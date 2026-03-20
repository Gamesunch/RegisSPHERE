import React, { useEffect, useState, useRef } from 'react';
import { API_BASE_URL } from '../config';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Users, Settings, LogOut, Clock, MapPin, User, Trash2, GraduationCap, Calendar, FileText, Download, Award } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Sidebar from '../components/Sidebar';
import { MyCoursesPageSkeleton } from '../components/SkeletonLoader';
import html2canvas from 'html2canvas';

const API_BASE = API_BASE_URL;

const GRADE_COLORS = {
    'A': '#10b981', 'B+': '#2EA7F2', 'B': '#3b82f6', 'C+': '#F29F05',
    'C': '#f59e0b', 'D+': '#f97316', 'D': '#ef4444', 'F': '#dc2626'
};

const COURSE_COLORS = [
    { bg: '#9BCAF2', text: '#000000' },
    { bg: '#C2DCF2', text: '#000000' },
    { bg: '#F2D6B3', text: '#000000' },
];

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00
const HALF_HOURS = Array.from({ length: 30 }, (_, i) => ({ hour: Math.floor(i / 2) + 7, min: i % 2 === 0 ? 0 : 30 })); // 7:00 to 21:30

function parseSchedule(scheduleTime) {
    if (!scheduleTime) return [];
    // Format: "Mon/Wed 09:00-10:30" or "Fri 09:00-12:00"
    const match = scheduleTime.match(/^([A-Za-z/]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    if (!match) return [];
    const daysPart = match[1];
    const startTime = match[2];
    const endTime = match[3];

    const dayMap = { 'Mon': 'MON', 'Tue': 'TUE', 'Wed': 'WED', 'Thu': 'THU', 'Fri': 'FRI', 'Sat': 'SAT', 'Sun': 'SUN' };
    const days = daysPart.split('/').map(d => dayMap[d]).filter(Boolean);

    const startHour = parseInt(startTime.split(':')[0]);
    const startMin = parseInt(startTime.split(':')[1]);
    const endHour = parseInt(endTime.split(':')[0]);
    const endMin = parseInt(endTime.split(':')[1]);

    const startOffset = startHour + startMin / 60;
    const endOffset = endHour + endMin / 60;
    const duration = endOffset - startOffset;

    return days.map(day => ({ day, startOffset, duration, startTime, endTime }));
}

function getDayLabel(dayKey, t) {
    return t(dayKey.toLowerCase());
}

export default function MyCourses() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [droppingId, setDroppingId] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('courses');
    const [confirmDropModalId, setConfirmDropModalId] = useState(null);
    const [selectedCourseForAnnouncements, setSelectedCourseForAnnouncements] = useState(null);
    const [courseAnnouncements, setCourseAnnouncements] = useState([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
    const timetableRef = useRef(null);

    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        const tab = searchParams.get('tab');
        if (tab && ['courses', 'timetable', 'exam'].includes(tab)) {
            setActiveTab(tab);
        }

        fetchData();
    }, [navigate, searchParams]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const profileRes = await fetch(`${API_BASE}/api/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (profileRes.ok) setUser(await profileRes.json());
            const res = await fetch(`${API_BASE}/api/enrollments/mine`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setEnrollments(await res.json());
        } catch (err) { console.error('Error:', err); }
        setLoading(false);
    };

    const executeDrop = async () => {
        if (!confirmDropModalId) return;
        setDroppingId(confirmDropModalId);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE}/api/enrollments/${confirmDropModalId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) { setMessage({ text: t('drop_success'), type: 'success' }); fetchData(); }
            else { const data = await res.json(); setMessage({ text: data.error || t('drop_error'), type: 'error' }); }
        } catch (err) { setMessage({ text: t('drop_error'), type: 'error' }); }
        setDroppingId(null);
        setConfirmDropModalId(null);
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    const handleDownloadTimetable = async () => {
        if (!timetableRef.current) return;
        try {
            const canvas = await html2canvas(timetableRef.current, { backgroundColor: '#FAFAFA', scale: 2 });
            const link = document.createElement('a');
            link.download = 'study_timetable.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) { console.error('Download error:', err); }
    };

    const handleViewAnnouncements = async (course) => {
        setSelectedCourseForAnnouncements(course);
        setLoadingAnnouncements(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/announcements/course/${course.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCourseAnnouncements(data);
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoadingAnnouncements(false);
        }
    };

    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

    const totalCredits = enrollments.reduce((sum, e) => sum + (e.credits || 0), 0);

    if (loading) return <MyCoursesPageSkeleton />;

    const avatarLetter = user?.firstName ? user.firstName[0].toUpperCase() : 'U';
    const fullPictureUrl = user?.profilePictureUrl 
        ? (user.profilePictureUrl.startsWith('http') ? user.profilePictureUrl : `${API_BASE}${user.profilePictureUrl}`) 
        : '';

    const tabs = [
        { key: 'courses', label: t('tab_courses'), icon: BookOpen },
        { key: 'timetable', label: t('tab_timetable'), icon: Calendar },
        { key: 'exam', label: t('tab_exam'), icon: FileText },
    ];

    // Build timetable blocks
    const timetableBlocks = [];
    enrollments.forEach((course, idx) => {
        if (course.status === 'WAITLISTED') return;
        const slots = parseSchedule(course.schedule_time);
        const color = COURSE_COLORS[idx % COURSE_COLORS.length];
        slots.forEach(slot => {
            timetableBlocks.push({ ...slot, code: course.code, room: course.room, color, name: course.name });
        });
    });

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-dark)', overflow: 'hidden' }}>
            {/* Sidebar unified component */}
            <Sidebar activePath="/my-courses" />

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                {/* Header */}
                <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.3rem', fontWeight: 600 }}>{t('my_courses')}</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>{t('my_courses_desc')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>

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

                {/* Credit Summary — Centered */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="glass-panel" style={{ padding: '1.2rem 2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(242, 159, 5, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GraduationCap size={24} color="var(--color-primary)" />
                    </div>
                    <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>{totalCredits}</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--color-text-muted)', lineHeight: 1 }}>{t('credits')}</span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1 }}>|</span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1 }}>{enrollments.length} {t('enrolled_courses_count')}</span>
                </motion.div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border-subtle)', paddingBottom: '0' }}>
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', border: 'none', cursor: 'pointer',
                                background: 'transparent', fontFamily: 'var(--font-main)', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.3s',
                                color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                borderBottom: activeTab === tab.key ? '3px solid var(--color-primary)' : '3px solid transparent',
                                marginBottom: '-2px'
                            }}>
                            <tab.icon size={18} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'courses' && (
                    <div>
                        {enrollments.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '4rem 2rem' }}>
                                <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                                <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{t('no_enrolled_courses')}</p>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-primary" onClick={() => navigate('/enrollment')} style={{ marginTop: '1rem', padding: '0.8rem 2rem' }}>
                                    {t('browse_courses')}
                                </motion.button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingBottom: '2rem' }}>
                                {enrollments.map((course, i) => (
                                    <motion.div key={course.enrollment_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                        className="glass-panel" style={{ padding: '1.2rem 1.8rem', display: 'flex', alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(242, 159, 5, 0.12)', padding: '3px 10px', borderRadius: '6px' }}>{course.code}</span>
                                                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{course.name}</h3>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.83rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={13} /> {course.schedule_time}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={13} /> {course.room}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><User size={13} /> {course.professors && course.professors.length > 0 ? `Prof. ${course.professors.map(p => p.last_name).join(', ')}` : t('no_professor')}</span>
                                            </div>
                                        </div>
                                        {/* Status Badge */}
                                        <span style={{
                                            fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', marginRight: '1rem',
                                            color: course.status === 'PRE_ENROLLED' ? 'var(--color-primary)' : (course.status === 'WAITLISTED' ? '#ef4444' : '#10b981'),
                                            background: course.status === 'PRE_ENROLLED' ? 'rgba(242, 159, 5, 0.1)' : (course.status === 'WAITLISTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'),
                                            border: `1px solid ${course.status === 'PRE_ENROLLED' ? 'rgba(242, 159, 5, 0.2)' : (course.status === 'WAITLISTED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)')}`,
                                            padding: '4px 10px', borderRadius: '6px'
                                        }}>
                                            {course.status === 'PRE_ENROLLED' ? t('pre_enrolled') : (course.status === 'WAITLISTED' ? t('waitlisted') : t('enrolled_badge'))}
                                        </span>

                                        {course.grade && (
                                            <span style={{
                                                fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', marginRight: '1rem',
                                                color: GRADE_COLORS[course.grade] || 'var(--color-text)',
                                                background: `${GRADE_COLORS[course.grade] || '#888'}18`,
                                                padding: '6px 14px', borderRadius: '8px'
                                            }}>
                                                {t('grade_label')}: {course.grade}
                                            </span>
                                        )}
                                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem', whiteSpace: 'nowrap', background: 'rgba(242, 159, 5, 0.08)', padding: '6px 14px', borderRadius: '8px', marginRight: '1rem' }}>{course.credits} {t('credits')}</span>
                                        <motion.button whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.2)' }} whileTap={{ scale: 0.95 }}
                                            onClick={() => handleViewAnnouncements(course)}
                                            style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.4)', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, fontSize: '0.85rem', fontFamily: 'var(--font-main)' }}>
                                             <FileText size={15} /> {t('announcements')}
                                        </motion.button>
                                        <motion.button whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.2)' }} whileTap={{ scale: 0.95 }}
                                            onClick={() => setConfirmDropModalId(course.enrollment_id)} disabled={droppingId === course.enrollment_id}
                                            style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, fontSize: '0.85rem', fontFamily: 'var(--font-main)', marginLeft: '1rem', whiteSpace: 'nowrap' }}>
                                            <Trash2 size={15} /> {droppingId === course.enrollment_id ? '...' : t('drop_btn')}
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'timetable' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDownloadTimetable}
                                className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1px solid var(--color-primary)', background: 'rgba(242, 159, 5, 0.08)', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.9rem' }}>
                                <Download size={16} /> {t('download_timetable')}
                            </motion.button>
                        </div>
                        <div ref={timetableRef} style={{ background: 'var(--color-bg-dark)', borderRadius: '16px', padding: '1.5rem', overflow: 'auto' }}>
                            <h3 style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--color-text)' }}>{t('tab_timetable')}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(30, 1fr)', fontSize: '0.72rem', minWidth: '1100px' }}>
                                {/* Header Row */}
                                <div style={{ padding: '0.5rem', fontWeight: 700, textAlign: 'center', background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', borderRadius: '8px 0 0 0', fontSize: '0.72rem', borderBottom: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)' }}>{t('day_time')}</div>
                                {HALF_HOURS.map((slot, i) => (
                                    <div key={i} style={{
                                        padding: '0.4rem 0', fontWeight: slot.min === 0 ? 700 : 500, textAlign: 'center', background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)',
                                        fontSize: slot.min === 0 ? '0.68rem' : '0.58rem', borderLeft: slot.min === 0 ? '1px solid var(--color-border-subtle)' : 'none',
                                        borderBottom: '1px solid var(--glass-border)',
                                        borderRadius: i === HALF_HOURS.length - 1 ? '0 8px 0 0' : '0', opacity: slot.min === 0 ? 1 : 0.7
                                    }}>
                                        {`${slot.hour.toString().padStart(2, '0')}:${slot.min === 0 ? '00' : '30'}`}
                                    </div>
                                ))}

                                {/* Day Rows */}
                                {DAYS.map((day, dayIdx) => (
                                    <React.Fragment key={day}>
                                        <div style={{
                                            padding: '0.6rem 0.4rem', fontWeight: 700, textAlign: 'center', background: dayIdx % 2 === 0 ? 'var(--color-table-row-even)' : 'var(--color-table-row-odd)',
                                            borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--color-text)'
                                        }}>{getDayLabel(day, t)}</div>
                                        <div style={{
                                            gridColumn: '2 / -1', position: 'relative', minHeight: '56px',
                                            background: dayIdx % 2 === 0 ? 'var(--color-table-row-even)' : 'var(--color-table-row-odd)', borderBottom: '1px solid var(--glass-border)',
                                            display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)'
                                        }}>
                                            {/* Grid lines — solid on hour, solid lighter on half */}
                                            {HALF_HOURS.map((slot, i) => (
                                                <div key={i} style={{
                                                    borderRight: slot.min === 0 ? '1px solid var(--color-border-light)' : '1px solid var(--color-border-subtle)',
                                                    minHeight: '56px'
                                                }}></div>
                                            ))}
                                            {/* Course blocks */}
                                            {timetableBlocks.filter(b => b.day === day).map((block, i) => {
                                                const left = ((block.startOffset - 7) / 15) * 100;
                                                const width = (block.duration / 15) * 100;
                                                return (
                                                    <div key={i} style={{
                                                        position: 'absolute', left: `${left}%`, width: `${width}%`, top: '4px', bottom: '4px',
                                                        backgroundColor: block.color.bg,
                                                        borderRadius: '8px', border: '1px solid var(--color-border-subtle)',
                                                        padding: '3px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                                        overflow: 'hidden', zIndex: 2, cursor: 'default'
                                                    }}
                                                        title={`${block.code} — ${block.startTime}-${block.endTime} — ${block.room}`}
                                                    >
                                                        <span style={{ fontWeight: 700, fontSize: '0.72rem', color: block.color.text, lineHeight: 1.2 }}>{block.code}</span>
                                                        <span style={{ fontSize: '0.65rem', color: block.color.text, opacity: 0.9, marginTop: '2px' }}>{block.startTime}-{block.endTime}</span>
                                                        <span style={{ fontSize: '0.6rem', color: block.color.text, opacity: 0.8, marginTop: '1px' }}>{block.room}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'exam' && (
                    <div style={{ paddingBottom: '2rem' }}>
                        {enrollments.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '4rem 2rem' }}>
                                <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                                <p>{t('no_enrolled_courses')}</p>
                            </div>
                        ) : (
                            <div className="glass-panel" style={{ overflow: 'hidden', borderRadius: '16px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--color-primary)', color: 'white' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>{t('course_code')}</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>{t('course_name_label')}</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>{t('credits')}</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>{t('midterm_exam')}</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>{t('final_exam')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {enrollments.map((course, i) => (
                                            <tr key={course.enrollment_id} style={{ borderBottom: '1px solid var(--color-border-subtle)', background: i % 2 === 0 ? 'var(--color-table-row-even)' : 'var(--color-table-row-odd)' }}>
                                                <td style={{ padding: '0.9rem 1rem' }}>
                                                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(242, 159, 5, 0.12)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>{course.code}</span>
                                                </td>
                                                <td style={{ padding: '0.9rem 1rem', fontWeight: 500 }}>{course.name}</td>
                                                <td style={{ padding: '0.9rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--color-primary)' }}>{course.credits}</td>
                                                <td style={{ padding: '0.9rem 1rem', textAlign: 'center', color: course.midterm_date ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                                                    {course.midterm_date || '—'}
                                                </td>
                                                <td style={{ padding: '0.9rem 1rem', textAlign: 'center', color: course.final_date ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                                                    {course.final_date || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr style={{ background: 'var(--color-table-header-bg)', fontWeight: 700 }}>
                                            <td colSpan={2} style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>{t('total')} {enrollments.length} {t('enrolled_courses_count')}</td>
                                            <td style={{ padding: '0.9rem 1rem', textAlign: 'center', color: 'var(--color-primary)', fontSize: '1.1rem' }}>{totalCredits}</td>
                                            <td colSpan={2}></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {confirmDropModalId && (() => {
                const courseToDrop = enrollments.find(e => e.enrollment_id === confirmDropModalId);
                return (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel"
                            style={{ padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                                <Trash2 size={30} color="#ef4444" />
                            </div>
                             <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text)' }}>{t('warning_title')}</h3>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.5 }}>
                                {t('confirm_drop_desc').replace('{courseName}', courseToDrop?.name || '')}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn" onClick={() => setConfirmDropModalId(null)}
                                    style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--color-border-light)', color: 'var(--color-text)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                                    {t('cancel')}
                                </button>
                                <button className="btn" onClick={executeDrop}
                                    style={{ flex: 1, padding: '0.8rem', background: '#ef4444', border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }}>
                                    {t('confirm_drop') || 'Drop Course'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                );
            })()}

            {selectedCourseForAnnouncements && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel"
                        style={{ padding: '2rem', borderRadius: '16px', maxWidth: '600px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                             <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-text)' }}>
                                {t('announcements_title').replace('{courseCode}', selectedCourseForAnnouncements.code)}
                            </h3>
                            <button className="btn" onClick={() => setSelectedCourseForAnnouncements(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}>&times;</button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                             {loadingAnnouncements ? (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('loading_announcements')}</p>
                            ) : courseAnnouncements.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{t('no_announcements_course')}</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {courseAnnouncements.map(ann => (
                                        <div key={ann.id} style={{ padding: '1.2rem', background: 'var(--color-surface-hover)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>{ann.title}</h4>
                                            <p style={{ color: 'var(--color-text)', fontSize: '0.95rem', marginBottom: '0.8rem', lineHeight: 1.5 }}>{ann.content}</p>
                                            <small style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>
                                                {new Date(ann.created_at).toLocaleDateString()} by {ann.prof_first} {ann.prof_last}
                                            </small>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
