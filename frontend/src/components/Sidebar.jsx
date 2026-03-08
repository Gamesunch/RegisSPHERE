import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Users, Settings, LogOut, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({ activePath }) {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [phase, setPhase] = useState('ENROLLMENT');
    const [userRole, setUserRole] = useState('STUDENT');

    useEffect(() => {
        const fetchPhase = async () => {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.role) {
                setUserRole(user.role);
            }
            if (token) {
                try {
                    const res = await fetch('http://localhost:5000/api/admin/phase', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setPhase(data.phase);
                    }
                } catch (err) {
                    console.error('Error fetching phase for sidebar:', err);
                }
            }
        };
        fetchPhase();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    let navItems = [];
    if (userRole === 'ADMIN') {
        navItems = [
            { icon: LayoutDashboard, label: t('overview'), path: '/dashboard' },
            { icon: BookOpen, label: 'Manage Courses', path: '/admin/courses' },
            { icon: Users, label: 'Student Users', path: '/admin/students' },
            { icon: Settings, label: t('settings'), path: '/settings' }
        ];
    } else if (userRole === 'PROFESSOR') {
        navItems = [
            { icon: LayoutDashboard, label: t('overview'), path: '/professor/dashboard' },
            { icon: BookOpen, label: 'My Classes', path: '/professor/courses' },
            { icon: Settings, label: t('settings'), path: '/settings' }
        ];
    } else {
        navItems = [
            { icon: LayoutDashboard, label: t('overview'), path: '/dashboard' },
            { icon: BookOpen, label: t('my_courses'), path: '/my-courses' },
            ...(phase !== 'CLOSED' ? [{ icon: Users, label: t('enrollment'), path: '/enrollment' }] : []),
            { icon: Award, label: t('grades'), path: '/grades' },
            { icon: Settings, label: t('settings'), path: '/settings' }
        ];
    }

    return (
        <motion.aside
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-panel"
            style={{ width: '280px', height: '100vh', padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', borderRadius: '0 24px 24px 0', borderLeft: 'none', borderTop: 'none', borderBottom: 'none' }}
        >
            <div style={{ padding: '0 1rem', marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.8rem', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Regis</span>
                    <span style={{ fontWeight: 800, letterSpacing: '1px', color: 'white', background: 'var(--color-primary)', padding: '2px 8px', borderRadius: '8px', fontSize: '1.4rem' }}>SPHERE</span>
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: '0.2rem' }}>{t('student_portal')}</p>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                {navItems.map((item, i) => {
                    const isActive = activePath === item.path;
                    return (
                        <button key={i}
                            onClick={() => item.path && navigate(item.path)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.2rem', width: '100%', border: 'none',
                                background: isActive ? 'linear-gradient(90deg, rgba(242, 159, 5, 0.15), transparent)' : 'transparent',
                                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                borderLeft: isActive ? '4px solid var(--color-primary)' : '4px solid transparent',
                                borderRadius: '0 12px 12px 0', cursor: 'pointer', fontSize: '1rem', fontWeight: 500, fontFamily: 'var(--font-main)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) e.currentTarget.style.color = 'var(--color-primary)';
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) e.currentTarget.style.color = 'var(--color-text-muted)';
                            }}
                        >
                            <item.icon size={22} /> {item.label}
                        </button>
                    );
                })}
            </nav>

            <div style={{ marginTop: 'auto', padding: '0 1rem' }}>
                <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(244, 63, 94, 0.2)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="btn glass-panel"
                    style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem' }}
                >
                    <LogOut size={18} /> {t('logout')}
                </motion.button>
            </div>
        </motion.aside>
    );
}
