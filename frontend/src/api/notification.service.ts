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

const notificationService = {
  getByUserId(userId: string): Promise<NotificationDto[]> {
    return axiosClient.get(`${NOTIFICATION_URL}/users/${userId}`);
  },

  markAsRead(notificationId: string): Promise<NotificationDto> {
    return axiosClient.put(`${NOTIFICATION_URL}/${notificationId}/read`, { isRead: true });
  },

  deleteNotification(notificationId: string): Promise<void> {
    return axiosClient.delete(`${NOTIFICATION_URL}/${notificationId}`);
  },

  registerFcmToken(userId: string, token: string): Promise<void> {
    return axiosClient.post(`${NOTIFICATION_URL}/fcm-tokens`, { userId, token });
  },

  unregisterFcmToken(userId: string, token: string): Promise<void> {
    return axiosClient.delete(`${NOTIFICATION_URL}/fcm-tokens`, { data: { userId, token } });
  },
};

export default notificationService;
