import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface Group {
  groupId: string;
  groupName: string;
}

interface GroupContextType {
  selectedGroup: Group | null;
  setSelectedGroup: (group: Group | null) => void;
  loading: boolean;
  refreshGroups: () => Promise<void>;
  myGroups: Group[];
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider = ({ children }: { children: ReactNode }) => {
  const [selectedGroup, setSelectedGroupState] = useState<Group | null>(null);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      const groupService = (await import('../api/group.service')).default;
      const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
      const isAdmin = Array.isArray(roles) && roles.includes('ROLE_ADMIN');
      const data = isAdmin
        ? await groupService.getAllGroups()
        : await groupService.getMyGroups();
      setMyGroups(data || []);
      
      // Attempt to restore selection from localStorage
      const savedId = localStorage.getItem('selectedGroupId');
      if (savedId && data) {
        const found = data.find((g: any) => g.groupId === savedId);
        if (found) {
          setSelectedGroupState(found);
        } else {
          setSelectedGroupState(null);
          localStorage.removeItem('selectedGroupId');
        }
      }
    } catch (error) {
      console.error('Error fetching groups in context:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const setSelectedGroup = (group: Group | null) => {
    setSelectedGroupState(group);
    if (group) {
      localStorage.setItem('selectedGroupId', group.groupId);
    } else {
      localStorage.removeItem('selectedGroupId');
    }
  };

  return (
    <GroupContext.Provider value={{ 
      selectedGroup, 
      setSelectedGroup, 
      loading, 
      refreshGroups: fetchGroups,
      myGroups 
    }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};
