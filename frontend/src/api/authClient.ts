import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const authBaseUrl = import.meta.env.VITE_API_GATEWAY_URL || window.location.origin;
let isHandlingAuthFailure = false;
const ACCESS_TOKEN_KEY = 'accessToken';

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function getStoredAccessToken(): string | null {
    try {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
        return null;
    }
}

function persistAccessToken(token?: string | null): void {
    try {
        if (token && token.trim().length > 0) {
            localStorage.setItem(ACCESS_TOKEN_KEY, token);
        }
    } catch {
        // ignore storage failures
    }
}

function clearAuthStorage(): void {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userSubtitle');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('userId');
    localStorage.removeItem(ACCESS_TOKEN_KEY);
}

const axiosClient = axios.create({
    baseURL: authBaseUrl,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: luôn ưu tiên Bearer token từ localStorage nếu có
axiosClient.interceptors.request.use((config) => {
    const token = getStoredAccessToken();
    if (token) {
        config.headers = config.headers ?? {};
        if (!config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
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
                const refreshResponse = await axios.post(`${authBaseUrl}/api/auth/refreshtoken`, {}, { withCredentials: true });
                const refreshedToken = (refreshResponse.data as { accessToken?: string; token?: string } | undefined)?.accessToken
                    ?? (refreshResponse.data as { accessToken?: string; token?: string } | undefined)?.token
                    ?? null;
                persistAccessToken(refreshedToken);

                // Thực hiện lại request ban đầu với token mới
                return axiosClient(originalRequest);
            } catch (refreshError) {
                // Nếu refresh thất bại -> Logout
                if (isHandlingAuthFailure) {
                    return Promise.reject(refreshError);
                }
                isHandlingAuthFailure = true;
                clearAuthStorage();
                window.dispatchEvent(new Event('auth-changed'));
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                window.setTimeout(() => {
                    isHandlingAuthFailure = false;
                }, 250);
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export { persistAccessToken, clearAuthStorage, getStoredAccessToken };
export default axiosClient;