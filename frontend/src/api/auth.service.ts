// src/api/auth.service.ts
import axiosClient from './authClient';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    type: string;
    email: string;
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
        return axiosClient.post('/api/auth/login-user', data);
    },

    getProfile: (): Promise<UserProfile> => {
        return axiosClient.get('/api/users/me');
    },
};

export default authService;