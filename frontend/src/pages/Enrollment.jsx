import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Users, Settings, LogOut, Search, BookPlus, Clock, MapPin, User, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const API_BASE = 'http://localhost:5000';

export default function Enrollment() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [courses, setCourses] = useState([]);
    const [myEnrollments, setMyEnrollments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState(null);
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
            // Fetch profile
            const profileRes = await fetch(`${API_BASE}/api/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profileRes.ok) setUser(await profileRes.json());

            // Fetch all courses
            const courseRes = await fetch(`${API_BASE}/api/courses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (courseRes.ok) setCourses(await courseRes.json());

            // Fetch my enrollments
            const enrollRes = await fetch(`${API_BASE}/api/enrollments/mine`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (enrollRes.ok) {
                const data = await enrollRes.json();
                setMyEnrollments(data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        }
        setLoading(false);
    };

    const handleEnroll = async (courseId) => {
        setEnrollingId(courseId);
        setMessage({ text: '', type: '' });
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/api/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ course_id: courseId })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ text: t('enroll_success'), type: 'success' });
                fetchData(); // Refresh
            } else {
                setMessage({ text: data.error || t('enroll_error'), type: 'error' });
            }
        } catch (err) {
            setMessage({ text: t('enroll_error'), type: 'error' });
        }
        setEnrollingId(null);
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const enrolledCourseIds = myEnrollments.map(e => e.id);

    const filteredCourses = courses.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        { icon: BookOpen, label: t('my_courses'), path: '/my-courses' },
                        { icon: Users, label: t('enrollment'), active: true, path: '/enrollment' },
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
                        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.3rem', fontWeight: 600 }}>{t('course_catalog')}</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>{t('browse_enroll_desc')}</p>
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

                {/* Search Bar */}
                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0.8rem 1.5rem', borderRadius: '50px', marginBottom: '2rem', background: 'var(--color-bg-light)' }}>
                    <Search size={20} color="var(--color-text-muted)" />
                    <input type="text" placeholder={t('search_courses')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text)', marginLeft: '0.8rem', padding: '0.4rem', fontFamily: 'var(--font-main)', fontSize: '1rem', flex: 1 }} />
                </div>

                {/* Course Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem', paddingBottom: '2rem' }}>
                    {filteredCourses.map((course, i) => {
                        const isEnrolled = enrolledCourseIds.includes(course.id);
                        return (
                            <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="glass-panel" style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(242, 159, 5, 0.12)', padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.5px' }}>{course.code}</span>
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginTop: '0.6rem', lineHeight: 1.3 }}>{course.name}</h3>
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>{course.credits} {t('credits')}</span>
                                </div>

                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5, flex: 1 }}>{course.description}</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={15} /> {course.schedule_time}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MapPin size={15} /> {course.room}
                                    </div>
                                    {course.prof_last && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <User size={15} /> Prof. {course.prof_first} {course.prof_last}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Hash size={15} /> {t('capacity')}: {course.capacity}
                                    </div>
                                </div>

                                {isEnrolled ? (
                                    <div style={{ padding: '0.8rem', textAlign: 'center', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 600, fontSize: '0.95rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                        {t('enrolled_badge')}
                                    </div>
                                ) : (
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        className="btn btn-primary" onClick={() => handleEnroll(course.id)} disabled={enrollingId === course.id}
                                        style={{ padding: '0.8rem', borderRadius: '12px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <BookPlus size={18} /> {enrollingId === course.id ? t('enrolling') : t('enroll_btn')}
                                    </motion.button>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {filteredCourses.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem', fontSize: '1.1rem' }}>
                        {t('no_courses_found')}
                    </div>
                )}
            </main>
        </div>
    );
}
