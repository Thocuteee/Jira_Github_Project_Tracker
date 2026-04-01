import axiosClient from './authClient';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    type: string;
    email: string;
    roles: string[];
}

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

    logout: (): Promise<string> => {
        const refreshToken = localStorage.getItem('refreshToken');
        const query = refreshToken ? `?refreshToken=${encodeURIComponent(refreshToken)}` : '';
        return axiosClient.post(`/api/auth/logout-user${query}`);
    },

    register: (data: RegisterRequest): Promise<string> => {
        return axiosClient.post('/api/auth/register-user', data);
    },

    getProfile: (): Promise<UserProfile> => {
        return axiosClient.get('/api/users/me');
    },
};

export default authService;