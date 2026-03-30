// src/api/auth.service.ts
import axiosClient from './authClient';

export interface LoginRequest {
    username?: string;
    password?: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    username: string;
    roles: string[];
}

/** Khớp `UserResponse` từ auth-service (UUID serialize thành string). */
export interface UserProfile {
    userId: string;
    name: string;
    email: string;
    roles: string[];
}

const authService = {
    login: (data: LoginRequest): Promise<AuthResponse> => {
        return axiosClient.post('/api/auth/signin', data);
    },

    getProfile: (): Promise<UserProfile> => {
        return axiosClient.get('/api/users/me');
    },
};

export default authService;