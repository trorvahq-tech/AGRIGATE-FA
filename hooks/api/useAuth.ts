import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { authService, LoginPayload, LoginResponse } from '../../services/authService';
import { syncService } from '../../services/syncService';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';
const CACHED_PROFILE_KEY = '@cached_me_profile';

export const useLogin = () => {
    const router = useRouter();

    return useMutation<LoginResponse, Error, LoginPayload>({
        mutationFn: authService.login,
        onSuccess: async (data) => {
            console.log('Login successful, user role:', data.user.role);
            // Store tokens and user info
            await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
            await AsyncStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(data.user));

            // Immediately prefetch and cache full staff profile for offline resilience
            try {
                const fullProfile = await authService.me();
                if (fullProfile && fullProfile.id) {
                    await AsyncStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(fullProfile));
                    await AsyncStorage.setItem(USER_KEY, JSON.stringify(fullProfile));
                }
            } catch (err) {
                console.warn('Could not immediately prefetch /auth/me on login:', err);
            }

            // Navigate based on role and temporary password status
            const role = data.user.role;
            const mustChangePassword = (data.user as any).mustChangePassword;

            if (mustChangePassword) {
                if (role === 'farmer') {
                    router.replace('/(farmers)/changePassword' as any);
                } else {
                    router.replace('/(agent)/changePassword' as any);
                }
            } else {
                if (role === 'farmer') {
                    router.replace('/(farmers)');
                } else if (role === 'machine-operator' || role === 'operator') {
                    router.replace('/(operators)');
                } else {
                    router.replace('/(agent)');
                }
            }
        },
        onError: (error) => {
            console.error('Login error:', error);
            if (axios.isAxiosError(error)) {
                console.error('Axios error details:', error.response?.status, error.response?.data);
            }
        },
    });
};

export const useLogout = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
            if (refreshToken) {
                await authService.logout({ refreshToken }).catch(() => {});
            }
        },
        onSuccess: async () => {
            // Clear all stored auth data
            await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, CACHED_PROFILE_KEY]);
            // Clear all cached queries
            queryClient.clear();
            // Navigate back to login
            router.replace('/(auth)/login');
        },
        onError: async () => {
            // Even if the API call fails, still clear local state and redirect
            await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, CACHED_PROFILE_KEY]);
            queryClient.clear();
            router.replace('/(auth)/login');
        },
    });
};

// Utility functions (non-hook)
export const getToken = async () => {
    return await AsyncStorage.getItem(TOKEN_KEY);
};

export const getRefreshToken = async () => {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

export const getUser = async () => {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
};

export const clearAuth = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, CACHED_PROFILE_KEY]);
};

export const useMe = (enabled: boolean = true) => {
    return useQuery({
        queryKey: ['me'],
        enabled,
        retry: 1,
        queryFn: async () => {
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            const userStr = await AsyncStorage.getItem(USER_KEY);
            const cachedUser = userStr ? JSON.parse(userStr) : null;
            if (!token) return null;
            try {
                const data = await authService.me();
                if (data && data.id) {
                    await AsyncStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(data));
                    const storedUri = await AsyncStorage.getItem(`vcm_avatar_uri_${data.id}`);
                    return { ...data, avatarUri: storedUri || null };
                }
                return { ...data, avatarUri: null };
            } catch (err: any) {
                console.warn('⚠️ [useMe] Offline / network error, loading local cached profile:', err?.message || err);
                // Return cached profile seamlessly if offline
                const storedProfile = await AsyncStorage.getItem(CACHED_PROFILE_KEY);
                if (storedProfile) {
                    const parsed = JSON.parse(storedProfile);
                    const storedUri = await AsyncStorage.getItem(`vcm_avatar_uri_${parsed.id || 'agent'}`);
                    if (!parsed.staff && parsed.email) {
                        const emailName = parsed.email.split('@')[0];
                        const cleanName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
                        parsed.staff = {
                            firstName: parsed.firstName || cleanName,
                            lastName: parsed.lastName || '',
                            fullName: parsed.fullName || cleanName,
                            jobTitle: parsed.role === 'farmer' ? 'Smallholder Farmer' : 'Field Agent (VCM)',
                            phone: parsed.phone || '—',
                            isActive: true,
                        };
                    }
                    return { ...parsed, avatarUri: storedUri || null };
                }
                if (cachedUser) {
                    return {
                        id: cachedUser.id || 'agent',
                        email: cachedUser.email || 'agent@agrigate.com',
                        role: cachedUser.role || 'agent',
                        staff: {
                            firstName: cachedUser.firstName || 'Field',
                            lastName: cachedUser.lastName || 'Agent',
                            fullName: cachedUser.fullName || `${cachedUser.firstName || 'Field'} ${cachedUser.lastName || 'Agent'}`,
                            jobTitle: 'Field Agent (VCM)',
                            phone: cachedUser.phone || '08000000000',
                            isActive: true,
                        },
                        avatarUri: null,
                    };
                }
                throw err;
            }
        },
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: async (payload: { oldPassword?: string; newPassword: string }) => {
            try {
                return await authService.changePassword(payload);
            } catch (err: any) {
                const isNetwork = !err?.response || err?.code === 'ECONNABORTED' || err?.message?.toLowerCase().includes('network');
                if (isNetwork) {
                    console.warn('⚠️ [ChangePassword] Offline. Enqueueing password change to background sync queue.');
                    await syncService.enqueueMutation({
                        type: 'CHANGE_PASSWORD',
                        description: 'VCM Password Update',
                        endpoint: '/auth/change-password',
                        method: 'POST',
                        payload,
                    });
                    return { success: true, offlineQueued: true };
                }
                throw err;
            }
        },
    });
};

