import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Users, Settings, LogOut, Clock, MapPin, User, Trash2, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const API_BASE = 'http://localhost:5000';

export default function MyCourses() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [droppingId, setDroppingId] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const profileRes = await fetch(`${API_BASE}/api/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profileRes.ok) setUser(await profileRes.json());

            const res = await fetch(`${API_BASE}/api/enrollments/mine`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setEnrollments(await res.json());
        } catch (err) {
            console.error('Error:', err);
        }
        setLoading(false);
    };

    const handleDrop = async (enrollmentId) => {
        if (!window.confirm(t('drop_confirm'))) return;
        setDroppingId(enrollmentId);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/api/enrollments/${enrollmentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMessage({ text: t('drop_success'), type: 'success' });
                fetchData();
            } else {
                const data = await res.json();
                setMessage({ text: data.error || t('drop_error'), type: 'error' });
            }
        } catch (err) {
            setMessage({ text: t('drop_error'), type: 'error' });
        }
        setDroppingId(null);
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const totalCredits = enrollments.reduce((sum, e) => sum + (e.credits || 0), 0);

    if (loading) return <div className="flex-center" style={{ height: '100vh', color: 'var(--color-text)' }}>{t('loading')}</div>;

    const avatarLetter = user?.firstName ? user.firstName[0].toUpperCase() : 'U';
    const fullPictureUrl = user?.profilePictureUrl ? `${API_BASE}${user.profilePictureUrl}` : '';

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-dark)', overflow: 'hidden' }}>
            {/* Sidebar */}
            <motion.aside initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}
                className="glass-panel" style={{ width: '280px', height: '100vh', padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', borderRadius: '0 24px 24px 0', borderLeft: 'none', borderTop: 'none', borderBottom: 'none' }}>
                <div style={{ padding: '0 1rem', marginBottom: '3rem', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                    <h2 style={{ fontSize: '1.8rem', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Regis</span>
                        <span style={{ fontWeight: 800, letterSpacing: '1px', color: 'white', background: 'var(--color-primary)', padding: '2px 8px', borderRadius: '8px', fontSize: '1.4rem' }}>SPHERE</span>
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: '0.2rem' }}>{t('student_portal')}</p>
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                    {[
                        { icon: LayoutDashboard, label: t('overview'), path: '/dashboard' },
                        { icon: BookOpen, label: t('my_courses'), active: true, path: '/my-courses' },
                        { icon: Users, label: t('enrollment'), path: '/enrollment' },
                        { icon: Settings, label: t('settings'), path: '/settings' }
                    ].map((item, i) => (
                        <button key={i} onClick={() => item.path && navigate(item.path)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.2rem', width: '100%', border: 'none',
                                background: item.active ? 'linear-gradient(90deg, rgba(242, 159, 5, 0.15), transparent)' : 'transparent',
                                color: item.active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                borderLeft: item.active ? '4px solid var(--color-primary)' : '4px solid transparent',
                                borderRadius: '0 12px 12px 0', cursor: 'pointer', fontSize: '1rem', fontWeight: 500, fontFamily: 'var(--font-main)', transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => { if (!item.active) e.currentTarget.style.color = 'var(--color-primary)'; }}
                            onMouseLeave={(e) => { if (!item.active) e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                        >
                            <item.icon size={22} /> {item.label}
                        </button>
                    ))}
                </nav>
                <div style={{ marginTop: 'auto', padding: '0 1rem' }}>
                    <motion.button whileHover={{ scale: 1.02, backgroundColor: 'rgba(244, 63, 94, 0.2)' }} whileTap={{ scale: 0.98 }} onClick={handleLogout}
                        className="btn glass-panel" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem' }}>
                        <LogOut size={18} /> {t('logout')}
                    </motion.button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                {/* Header */}
                <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.3rem', fontWeight: 600 }}>{t('my_courses')}</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>{t('my_courses_desc')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <LanguageSwitcher />
                        {fullPictureUrl ? (
                            <img src={fullPictureUrl} alt="Profile" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 10px rgba(217, 121, 4, 0.3)' }} />
                        ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(217, 121, 4, 0.3)' }}>{avatarLetter}</div>
                        )}
                    </div>
                </motion.header>

                {/* Status message */}
                {message.text && (
                    <div style={{ marginBottom: '1rem', padding: '0.8rem 1.2rem', borderRadius: '10px', background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: message.type === 'error' ? '#ef4444' : '#10b981', fontWeight: 500 }}>
                        {message.text}
                    </div>
                )}

                {/* Credit Summary */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(242, 159, 5, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <GraduationCap size={26} color="var(--color-primary)" />
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{t('total_credits')}</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{t('enrolled_courses_count', { count: enrollments.length })}</p>
                        </div>
                    </div>
                    <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{totalCredits}</span>
                </motion.div>

                {/* Course List */}
                {enrollments.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '4rem 2rem' }}>
                        <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                        <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{t('no_enrolled_courses')}</p>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            className="btn btn-primary" onClick={() => navigate('/enrollment')}
                            style={{ marginTop: '1rem', padding: '0.8rem 2rem' }}>
                            {t('browse_courses')}
                        </motion.button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
                        {enrollments.map((course, i) => (
                            <motion.div key={course.enrollment_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                className="glass-panel" style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(242, 159, 5, 0.12)', padding: '3px 10px', borderRadius: '6px' }}>{course.code}</span>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{course.name}</h3>
                                        <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--color-primary)' }}>{course.credits} {t('credits')}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} /> {course.schedule_time}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={14} /> {course.room}</span>
                                        {course.prof_last && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><User size={14} /> Prof. {course.prof_last}</span>
                                        )}
                                    </div>
                                </div>
                                <motion.button whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.2)' }} whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDrop(course.enrollment_id)} disabled={droppingId === course.enrollment_id}
                                    style={{ padding: '0.7rem 1.2rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, fontSize: '0.9rem', fontFamily: 'var(--font-main)', marginLeft: '1.5rem' }}>
                                    <Trash2 size={16} /> {droppingId === course.enrollment_id ? '...' : t('drop_btn')}
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
