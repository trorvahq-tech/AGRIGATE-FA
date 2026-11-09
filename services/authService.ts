import api from './apiClient';

export interface LoginPayload {
    email: string;
    password: string;
}

export interface User {
    id: string;
    email: string;
    role: string;
}

export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

export interface RefreshPayload {
    refreshToken: string;
}

export interface RefreshResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

export interface LogoutPayload {
    refreshToken: string;
}

export interface LogoutResponse {
    ok: boolean;
}

export interface ApiError {
    error: string;
}

export const authService = {
    login: async (payload: LoginPayload): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/login', payload);
        return response.data;
    },

    refresh: async (payload: RefreshPayload): Promise<RefreshResponse> => {
        const response = await api.post<RefreshResponse>('/auth/refresh', payload);
        return response.data;
    },

    logout: async (payload: LogoutPayload): Promise<LogoutResponse> => {
        const response = await api.post<LogoutResponse>('/auth/logout', payload);
        return response.data;
    },

    me: async (): Promise<any> => {
        const response = await api.get<any>('/auth/me');
        return response.data;
    },

    changePassword: async (payload: { oldPassword?: string; newPassword: string }): Promise<any> => {
        const response = await api.post<any>('/auth/change-password', payload);
        return response.data;
    },
};
