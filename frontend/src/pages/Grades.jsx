import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Users, Settings, LogOut, Award, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Sidebar from '../components/Sidebar';

const API_BASE = 'http://localhost:5000';

const GRADE_COLORS = {
    'A': '#10b981', 'B+': '#2EA7F2', 'B': '#3b82f6', 'C+': '#F29F05',
    'C': '#f59e0b', 'D+': '#f97316', 'D': '#ef4444', 'F': '#dc2626'
};

export default function Grades() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [data, setData] = useState({ semesters: [], cumulative: { total_credits: 0, gpax: '0.00' } });
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [selectedYear, setSelectedYear] = useState('all');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const profileRes = await fetch(`${API_BASE}/api/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (profileRes.ok) setUser(await profileRes.json());
            const res = await fetch(`${API_BASE}/api/grades/mine`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setData(await res.json());
        } catch (err) { console.error('Error:', err); }
        setLoading(false);
    };

    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)' }}>{t('loading')}</div>;

    const avatarLetter = user?.firstName ? user.firstName[0].toUpperCase() : 'U';
    const fullPictureUrl = user?.profilePictureUrl ? `${API_BASE}${user.profilePictureUrl}` : '';

    // Get unique academic years
    const years = [...new Set(data.semesters.map(s => s.academic_year))].sort();
    const filteredSemesters = selectedYear === 'all' ? data.semesters : data.semesters.filter(s => s.academic_year === selectedYear);

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-dark)', overflow: 'hidden' }}>
            {/* Sidebar unified component */}
            <Sidebar activePath="/grades" />

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                {/* Header */}
                <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.3rem', fontWeight: 600 }}>{t('grades')}</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>{t('grades_desc')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>

                        {fullPictureUrl ? (
                            <img src={fullPictureUrl} alt="Profile" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 10px rgba(217, 121, 4, 0.3)' }} />
                        ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(217, 121, 4, 0.3)' }}>{avatarLetter}</div>
                        )}
                    </div>
                </motion.header>

                {/* GPAX Summary + Year Filter */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="glass-panel" style={{ padding: '1.2rem 2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(242, 159, 5, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Award size={24} color="var(--color-primary)" />
                        </div>
                        <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--color-text-muted)', lineHeight: 1 }}>{t('cumulative_gpax')}</span>
                        <span style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>{data.cumulative.gpax}</span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1 }}>|</span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1 }}>{data.cumulative.total_credits} {t('credits')}</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
                            style={{
                                appearance: 'none', padding: '0.6rem 2.5rem 0.6rem 1rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)',
                                background: 'white', fontFamily: 'var(--font-main)', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text)'
                            }}>
                            <option value="all">{t('all_years')}</option>
                            {years.map(y => <option key={y} value={y}>{t('academic_year')} {y}</option>)}
                        </select>
                        <ChevronDown size={16} style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
                    </div>
                </motion.div>

                {/* Semester Tables */}
                {filteredSemesters.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '4rem 2rem' }}>
                        <Award size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                        <p style={{ fontSize: '1.2rem' }}>{t('no_grades')}</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
                        {filteredSemesters.map((sem, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                                className="glass-panel" style={{ overflow: 'hidden', borderRadius: '16px' }}>
                                {/* Semester Header */}
                                <div style={{ background: 'var(--color-primary)', color: 'white', padding: '0.8rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                                        {t('academic_year')} {sem.academic_year}/{sem.semester}
                                    </span>
                                    <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                        GPA: <strong>{sem.gpa}</strong>
                                    </span>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(242, 159, 5, 0.06)' }}>
                                            <th style={{ padding: '0.8rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{t('course_code')}</th>
                                            <th style={{ padding: '0.8rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{t('course_name_label')}</th>
                                            <th style={{ padding: '0.8rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{t('credits')}</th>
                                            <th style={{ padding: '0.8rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{t('grade_label')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sem.courses.map((course, i) => (
                                            <tr key={course.enrollment_id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                                <td style={{ padding: '0.8rem 1rem' }}>
                                                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(242, 159, 5, 0.12)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>{course.code}</span>
                                                </td>
                                                <td style={{ padding: '0.8rem 1rem', fontWeight: 500 }}>{course.name}</td>
                                                <td style={{ padding: '0.8rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--color-primary)' }}>{course.credits}</td>
                                                <td style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        fontWeight: 700, fontSize: '0.95rem', color: GRADE_COLORS[course.grade] || 'var(--color-text)',
                                                        background: `${GRADE_COLORS[course.grade] || '#888'}18`, padding: '4px 14px', borderRadius: '8px'
                                                    }}>
                                                        {course.grade}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Summary Row */}
                                        <tr style={{ background: 'rgba(242, 159, 5, 0.06)', fontWeight: 600 }}>
                                            <td colSpan={2} style={{ padding: '0.8rem 1rem', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                                                {sem.courses.length} {t('enrolled_courses_count')}
                                            </td>
                                            <td style={{ padding: '0.8rem 1rem', textAlign: 'center', color: 'var(--color-primary)', fontWeight: 700 }}>
                                                {sem.total_credits}
                                            </td>
                                            <td style={{ padding: '0.8rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                GPA: {sem.gpa}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
