import { useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import authService, { type UserProfile } from '@/api/auth.service';
import fileService from '@/api/file.service';
import { UserCircle2, Upload, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [pageError, setPageError] = useState('');
  const [avatarNotice, setAvatarNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.getProfile();
        setProfile(res);
      } catch (e: any) {
        setPageError(extractErrorMessage(e, 'Không thể tải hồ sơ người dùng.'));
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, []);

  const joinedAt = useMemo(() => {
    if (!profile?.createdAt) return 'N/A';
    return new Date(profile.createdAt).toLocaleDateString('vi-VN');
  }, [profile?.createdAt]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile || !event.target.files?.length) return;
    setAvatarNotice(null);
    setPageError('');
    const file = event.target.files[0];
    if (!file.type.startsWith('image/')) {
      setAvatarNotice({ type: 'error', text: 'Chỉ cho phép upload file ảnh.' });
      return;
    }

    setUploadingAvatar(true);
    try {
      const uploadResult = await fileService.uploadFile(file, profile.userId, 'AVATAR');
      const updated = await authService.updateProfile({
        avatarUrl: uploadResult.fileUrl,
      });
      setProfile(updated);
      localStorage.setItem('userName', updated.fullName || updated.name || '');
      localStorage.setItem('userAvatarUrl', updated.avatarUrl || '');
      window.dispatchEvent(new Event('auth-changed'));
      setAvatarNotice({ type: 'success', text: 'Cập nhật ảnh đại diện thành công.' });
    } catch (e: any) {
      setAvatarNotice({ type: 'error', text: extractErrorMessage(e, 'Cập nhật ảnh đại diện thất bại.') });
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleChangePassword = async () => {
    setPasswordNotice(null);
    setPageError('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordNotice({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin đổi mật khẩu.' });
      return;
    }
    setSavingPassword(true);
    try {
      const result = await authService.changePassword(passwordForm);
      setPasswordNotice({ type: 'success', text: result?.message || 'Đổi mật khẩu thành công.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      setPasswordNotice({ type: 'error', text: extractErrorMessage(e, 'Đổi mật khẩu thất bại.') });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
          <p className="text-sm text-slate-600">Quản lý thông tin tài khoản và bảo mật.</p>
        </div>

        {pageError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        {loading || !profile ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Đang tải hồ sơ...</div>
        ) : (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-center text-lg font-semibold text-slate-900">Avatar</h2>
              <div className="flex flex-col items-center gap-4">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="avatar" className="h-28 w-28 rounded-full border-4 border-slate-100 object-cover shadow-sm" />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-100 bg-slate-50">
                    <UserCircle2 className="h-12 w-12 text-slate-400" />
                  </div>
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Upload className="h-4 w-4" />
                  {uploadingAvatar ? 'Đang cập nhật...' : 'Cập nhật avatar'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => void handleAvatarUpload(e)} />
                </label>
                {avatarNotice && (
                  <NoticeBox type={avatarNotice.type} text={avatarNotice.text} />
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Thông tin chung</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Email</label>
                  <input value={profile.email} readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Ngày tham gia</label>
                  <input value={joinedAt} readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Họ tên</label>
                  <input
                    value={profile.fullName || profile.name || ''}
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Lock className="h-5 w-5" />
                Bảo mật
              </h2>
              {profile.oauthAccount ? (
                <p className="text-sm text-slate-600">
                  Tài khoản đăng nhập bằng Google hoặc GitHub không thể đổi mật khẩu tại đây.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Mật khẩu cũ"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Mật khẩu mới"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Xác nhận mật khẩu mới"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <div className="md:col-span-3">
                    {passwordNotice && (
                      <div className="mb-3">
                        <NoticeBox type={passwordNotice.type} text={passwordNotice.text} />
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={savingPassword}
                      onClick={() => void handleChangePassword()}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      {savingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
}

function extractErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) {
    return data;
  }
  if (data && typeof data === 'object') {
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }
  }
  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function NoticeBox({ type, text }: { type: 'success' | 'error'; text: string }) {
  const success = type === 'success';
  return (
    <div
      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
        success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
      <span>{text}</span>
    </div>
  );
}
