import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const authBaseUrl = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8081';

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const axiosClient = axios.create({
    baseURL: authBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor cho Request: Tự động thêm Bearer Token vào Header
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor cho Response: Xử lý lỗi 401 (Refresh Token)
axiosClient.interceptors.response.use(
    (response) => response.data, // Trả về trực tiếp data, không cần .data ở nơi gọi
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryableConfig | undefined;
        if (!originalRequest) return Promise.reject(error);
        // Nếu lỗi 401 và chưa retry lần nào
        if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');

            const response = await axios.post(`${authBaseUrl}/api/auth/refreshtoken`, { refreshToken });
            
            // Lưu token mới
            localStorage.setItem('accessToken', response.data.accessToken);
            
            // Thực hiện lại request ban đầu với token mới
            return axiosClient(originalRequest);
        } catch (refreshError) {
            // Nếu refresh thất bại -> Logout
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userSubtitle');
            localStorage.removeItem('userRoles');
            window.dispatchEvent(new Event('auth-changed'));
            window.location.href = '/login';
            return Promise.reject(refreshError);
        }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;