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
    fullName: string;
    name: string;
    email: string;
    roles: string[];
    avatarUrl?: string | null;
    createdAt?: string;
    googleAccount?: boolean;
}

export interface UpdateProfileRequest {
    avatarUrl?: string | null;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
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

    // Đã thêm api thật trong authcontroller
    updateUserStatus: (id: string | number, status: string): Promise<any> => {
        return axiosClient.patch(`/api/auth/users/${id}/status`, { status });
    },

    getProfile: (): Promise<UserProfile> => {
        return axiosClient.get('/api/users/me');
    },

    updateProfile: (data: UpdateProfileRequest): Promise<UserProfile> => {
        return axiosClient.put('/api/users/me', data);
    },

    changePassword: (data: ChangePasswordRequest): Promise<{ message: string }> => {
        return axiosClient.put('/api/users/me/password', data);
    },

    getUserNames: (userIds: string[]): Promise<Record<string, string>> => {
        return axiosClient.post('/api/users/names', userIds);
    }
};

export default authService;