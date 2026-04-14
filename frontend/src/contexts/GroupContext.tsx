import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import groupService from '../api/group.service';

function isAuthedLocally(): boolean {
    try {
        return Boolean(localStorage.getItem('userEmail') || localStorage.getItem('userName'));
    } catch {
        return false;
    }
}

export interface Group {
    groupId: string;
    groupName: string;
    leaderId?: string;
    course?: string;
    semester?: string;
    [key: string]: any;
}

interface GroupContextProps {
    groups: Group[];
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

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const rawRoles = localStorage.getItem('userRoles');
            const roles = rawRoles ? JSON.parse(rawRoles) : [];
            const isAdmin = Array.isArray(roles) && roles.includes('ROLE_ADMIN');
            const data: Group[] = isAdmin 
                ? await groupService.getAllGroups() 
                : await groupService.getMyGroups();
            setGroups(data || []);

            if (data && data.length > 0) {
                const savedId = localStorage.getItem('selectedGroupId');
                const matched = data.find(g => g.groupId === savedId);
                if (matched) {
                    setSelectedGroup(matched);
                } else {
                    setSelectedGroup(data[0]);
                    localStorage.setItem('selectedGroupId', data[0].groupId);
                }
            } else {
                setSelectedGroup(null);
                localStorage.removeItem('selectedGroupId');
            }
        } catch (err: any) {
            console.error('Lỗi khi fetch Groups:', err);
            setError('Lỗi khi tải danh sách Group.');
        } finally {
            setLoading(false);
        }
    }, []);

    const clearGroupsState = useCallback(() => {
        setLoading(false);
        setError(null);
        setGroups([]);
        setSelectedGroup(null);
        localStorage.removeItem('selectedGroupId');
    }, []);

    useEffect(() => {
        const sync = () => {
            if (isAuthedLocally()) {
                void fetchGroups();
            } else {
                clearGroupsState();
            }
        };

        sync();
        window.addEventListener('auth-changed', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('auth-changed', sync);
            window.removeEventListener('storage', sync);
        };
    }, [fetchGroups, clearGroupsState]);

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
