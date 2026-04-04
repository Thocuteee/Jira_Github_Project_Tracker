import axiosClient from './authClient';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    roleName?: string;
}

export interface AuthResponse {
    token?: string | null;
    refreshToken?: string | null;
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
        return axiosClient.post('/api/auth/logout-user');
    },

    register: (data: RegisterRequest): Promise<string> => {
        return axiosClient.post('/api/auth/register-user', data);
    },

    createLecturer: (data: RegisterRequest): Promise<string> => {
        return axiosClient.post('/api/auth/admin/create-lecturer', data);
    },

    updateLecturer: (id: number, data: RegisterRequest): Promise<string> => {
        return axiosClient.put(`/api/auth/users/${id}`, data);
    },

    // chưa có api thật trong authcontroller
    updateUserStatus: (id: number, status: string): Promise<any> => {
        return axiosClient.patch(`/api/auth/users/${id}/status`, { status });
    },

    getProfile: (): Promise<UserProfile> => {
        return axiosClient.get('/api/users/me');
    },


};

export default authService;