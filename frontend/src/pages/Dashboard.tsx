import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toDisplayRole } from '@/utils/authDisplay';
import { useGroupContext } from '@/contexts/GroupContext';
import groupService from '@/api/group.service';
import AdminDashboard from '@/pages/dashboards/AdminDashboard';
import LecturerDashboard from '@/pages/dashboards/LecturerDashboard';
import LeaderDashboard from '@/pages/dashboards/LeaderDashboard';
import MemberDashboard from '@/pages/dashboards/MemberDashboard';

type GlobalRole = 'ROLE_ADMIN' | 'ROLE_LECTURER' | 'ROLE_MEMBER' | string;
type DerivedRole = 'Admin' | 'Lecturer' | 'Member' | 'Teamleader';

function safeParseRoles(raw: string | null): GlobalRole[] {
    try {
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
}

function rolePriority(roles: DerivedRole[]): DerivedRole[] {
    const order: DerivedRole[] = ['Admin', 'Lecturer', 'Teamleader', 'Member'];
    return [...new Set(roles)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export default function Dashboard() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Dashboard | Project Tracker";
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const email = params.get('email') ?? '';
        if (!email) return;

        const name = params.get('name') ?? '';
        const rolesRaw = params.get('roles') ?? '';
        const roles = rolesRaw
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean);

        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', name || email.split('@')[0] || email);
        localStorage.setItem('userRoles', JSON.stringify(roles));
        localStorage.setItem('userSubtitle', toDisplayRole(roles[0]));
        window.dispatchEvent(new Event('auth-changed'));
        navigate('/dashboard', { replace: true });
    }, [navigate]);

    const { selectedGroup } = useGroupContext();
    const [derivedRoles, setDerivedRoles] = useState<DerivedRole[]>([]);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            const globalRoles = safeParseRoles(localStorage.getItem('userRoles'));
            const base: DerivedRole[] = [];
            if (globalRoles.includes('ROLE_ADMIN')) base.push('Admin');
            if (globalRoles.includes('ROLE_LECTURER')) base.push('Lecturer');
            if (!base.length) base.push('Member');

            if (selectedGroup?.groupId) {
                try {
                    const isLeader = await groupService.checkLeader(selectedGroup.groupId);
                    if (isLeader) base.push('Teamleader');
                } catch {
                    // ignore
                }
            }

            if (!cancelled) setDerivedRoles(rolePriority(base));
        };
        void run();
        return () => {
            cancelled = true;
        };
    }, [selectedGroup]);

    const primaryDerivedRole: DerivedRole = useMemo(() => derivedRoles[0] || 'Member', [derivedRoles]);

    const globalRoles = useMemo(() => safeParseRoles(localStorage.getItem('userRoles')), []);
    const isAdmin = globalRoles.includes('ROLE_ADMIN');
    const isLecturer = globalRoles.includes('ROLE_LECTURER');

    // Team Leader is role-in-group based (leaderId), so we only switch to LeaderDashboard when a group is selected and checkLeader passed
    if (isAdmin) return <AdminDashboard />;
    if (isLecturer) return <LecturerDashboard />;
    if (primaryDerivedRole === 'Teamleader') return <LeaderDashboard />;
    return <MemberDashboard />;
}
