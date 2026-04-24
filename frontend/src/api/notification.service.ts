import axiosClient from './authClient';

const NOTIFICATION_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || '/api/notifications';

export interface NotificationDto {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferenceDto {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  updatedAt: string;
}

export interface NotificationPreferenceUpdateRequest {
  pushEnabled: boolean;
  emailEnabled: boolean;
}

const notificationService = {
  getByUserId(userId: string): Promise<NotificationDto[]> {
    return axiosClient.get(`${NOTIFICATION_URL}/users/${userId}`);
  },

  markAsRead(notificationId: string): Promise<NotificationDto> {
    return axiosClient.put(`${NOTIFICATION_URL}/${notificationId}/read`, { isRead: true });
  },

  markAllAsRead(userId: string): Promise<number> {
    return axiosClient.put(`${NOTIFICATION_URL}/users/${userId}/read-all`);
  },

  deleteNotification(notificationId: string): Promise<void> {
    return axiosClient.delete(`${NOTIFICATION_URL}/${notificationId}`);
  },

  getPreferences(userId: string): Promise<NotificationPreferenceDto> {
    return axiosClient.get(`${NOTIFICATION_URL}/settings/${userId}`);
  },

  updatePreferences(userId: string, payload: NotificationPreferenceUpdateRequest): Promise<NotificationPreferenceDto> {
    return axiosClient.put(`${NOTIFICATION_URL}/settings/${userId}`, payload);
  },

  registerFcmToken(userId: string, token: string): Promise<void> {
    return axiosClient.post(`${NOTIFICATION_URL}/fcm-tokens`, { userId, token });
  },

  unregisterFcmToken(userId: string, token: string): Promise<void> {
    return axiosClient.delete(`${NOTIFICATION_URL}/fcm-tokens`, { data: { userId, token } });
  },
};

export default notificationService;
