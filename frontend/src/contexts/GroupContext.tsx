import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import groupService from '../api/group.service';

export interface Group {
    groupId: string;
    groupName: string;
    leaderId?: string;
    workspaceId?: string;
    description?: string;
    status?: 'ACTIVE' | 'LOCKED' | string;
    maxMembers?: number;
    [key: string]: any;
}

interface GroupContextProps {
    groups: Group[];
    myGroups: Group[]; // Alias for compatibility with some components
    selectedGroup: Group | null;
    setSelectedGroup: (group: Group | null) => void;
    loading: boolean;
    error: string | null;
    refreshGroups: () => Promise<void>;
}

const GroupContext = createContext<GroupContextProps | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const isAuthed = useCallback(() => {
        try {
            return Boolean(localStorage.getItem('userId') || localStorage.getItem('userEmail') || localStorage.getItem('userName'));
        } catch {
            return false;
        }
    }, []);

    const fetchGroups = useCallback(async () => {
        if (!isAuthed()) {
            setGroups([]);
            setSelectedGroup(null);
            setError(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const rawRoles = localStorage.getItem('userRoles');
            const roles = rawRoles ? JSON.parse(rawRoles) : [];
            const isManagementRole = Array.isArray(roles) && (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_LECTURER'));

            const data: Group[] = isManagementRole 
                ? await groupService.getAllGroups() 
                : await groupService.getMyGroups();
            
            console.log(`Fetched ${data?.length || 0} groups for role:`, roles);
            setGroups(data || []);

            if (data && data.length > 0) {
                const savedId = localStorage.getItem('selectedGroupId');
                const matched = data.find(g => g.groupId === savedId);
                if (matched) {
                    setSelectedGroup(matched);
                } else {
                    // Tự động chọn group đầu tiên nếu chưa chọn hoặc không tìm thấy group cũ
                    setSelectedGroup(data[0]);
                    localStorage.setItem('selectedGroupId', data[0].groupId);
                }
            } else {
                setSelectedGroup(null);
                localStorage.removeItem('selectedGroupId');
            }
        } catch (err: any) {
            console.error('Lỗi khi fetch Groups:', err);
            // Detect connection refused or 500
            const status = err.response?.status;
            if (status === 500 || !err.response) {
                setError('Hệ thống đang khởi động hoặc gặp sự cố kết nối. Vui lòng thử lại sau giây lát.');
            } else {
                setError('Lỗi khi tải danh sách Group.');
            }
        } finally {
            setLoading(false);
        }
    }, [isAuthed]);

    useEffect(() => {
        const sync = () => {
            void fetchGroups();
        };

        sync();
        window.addEventListener('auth-changed', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('auth-changed', sync);
            window.removeEventListener('storage', sync);
        };
    }, [fetchGroups]);

    const handleSetSelectedGroup = (group: Group | null) => {
        setSelectedGroup(group);
        if (group?.groupId) {
            localStorage.setItem('selectedGroupId', group.groupId);
        } else {
            localStorage.removeItem('selectedGroupId');
        }
    };

    return (
        <GroupContext.Provider
            value={{
                groups,
                myGroups: groups, // provide as alias
                selectedGroup,
                setSelectedGroup: handleSetSelectedGroup,
                loading,
                error,
                refreshGroups: fetchGroups
            }}
        >
            {children}
        </GroupContext.Provider>
    );
}

export function useGroupContext() {
    const context = useContext(GroupContext);
    if (!context) {
        throw new Error('useGroupContext must be used within a GroupProvider');
    }
    return context;
}

// Alias for compatibility with old components
export const useGroup = useGroupContext;
