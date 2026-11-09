import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://smallholders-backend.onrender.com/api',
    timeout: 45000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Request Interceptor: Attach access token ---
api.interceptors.request.use(
    async (config) => {
        console.log(`📡 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.warn('⚠️ [API Request Error]:', error);
        return Promise.reject(error);
    }
);

// --- Response Interceptor: Auto-refresh on 401 ---
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token!);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => {
        console.log(`✅ [API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const url = error.config?.url || 'N/A';
        const method = error.config?.method?.toUpperCase() || 'N/A';
        const message = error.response?.data?.error || error.message;

        const isPublicAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register') || url.includes('/auth/forgot-password') || url.includes('/auth/reset-password');
        const isRefreshable401 = status === 401 && !originalRequest?._retry && !isPublicAuthEndpoint;
        const isNetworkOrTimeout = !status || error.code === 'ECONNABORTED' || message?.toLowerCase().includes('timeout') || message?.toLowerCase().includes('network');

        // Log appropriately (use console.warn for errors to avoid halting React Native with an intrusive LogBox modal)
        if (isRefreshable401) {
            console.log(`ℹ️ [API] Intercepted 401 for ${method} ${url}, attempting auto-token refresh...`);
        } else if (isNetworkOrTimeout) {
            console.warn(`⚠️ [API Network/Timeout] ${method} ${url} - ${message}`);
        } else {
            console.warn(`❌ [API Error] ${method} ${url} - Status: ${status} - Message: ${message}`);
        }

        // Automatic retry for transient network/timeout on GET requests (e.g. Render server cold-start)
        if (isNetworkOrTimeout && method === 'GET' && originalRequest && !originalRequest._retryTimeout) {
            originalRequest._retryTimeout = true;
            console.log(`🔄 [API] Retrying GET ${url} after cold start / network delay...`);
            return new Promise((resolve) => {
                setTimeout(() => resolve(api(originalRequest)), 1500);
            });
        }

        // No local server fallback - strictly connect to the configured live backend.

        // Only attempt refresh on 401, and not on public auth endpoints themselves
        if (status === 401 && !originalRequest._retry && !isPublicAuthEndpoint) {
            if (isRefreshing) {
                // Queue this request until the refresh completes
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token: string) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(api(originalRequest));
                        },
                        reject,
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                console.log('🔄 [Auth] Attempting token refresh...');
                const activeBaseURL = originalRequest.baseURL || api.defaults.baseURL;
                const response = await axios.post(
                    `${activeBaseURL}/auth/refresh`,
                    { refreshToken },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                const { accessToken, refreshToken: newRefreshToken, user } = response.data;

                // Store new tokens
                await AsyncStorage.setItem(TOKEN_KEY, accessToken);
                await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
                await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

                console.log('✅ [Auth] Token refreshed successfully');

                // Process queued requests with the new token
                processQueue(null, accessToken);

                // Retry the original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError: any) {
                console.warn('⚠️ [Auth] Token refresh failed:', refreshError.message || refreshError);
                processQueue(refreshError, null);

                // Only log out if it is an auth error (400, 401, or 403) or if no refresh token exists, NOT on network error/timeout.
                const isAuthError = 
                    refreshError.message === 'No refresh token available' ||
                    (refreshError.response && [400, 401, 403].includes(refreshError.response.status));
                if (isAuthError) {
                    console.log('🔄 [Auth] Refresh token invalid or expired. Clearing session and logging out.');
                    // Clear auth state
                    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);

                    // Redirect to login page
                    try {
                        const { router } = require('expo-router');
                        router.replace('/(auth)/login');
                    } catch (navErr) {
                        console.error('Failed to redirect to login:', navErr);
                    }
                } else {
                    console.warn('⚠️ [Auth] Token refresh failed due to network / sleep wake timeout. Keeping session intact.');
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
