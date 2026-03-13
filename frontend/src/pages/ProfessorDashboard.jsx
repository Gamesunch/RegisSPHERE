import React, { useEffect, useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import { Bell, Calendar, MapPin, Download } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import html2canvas from 'html2canvas';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const HALF_HOURS = Array.from({ length: 30 }, (_, i) => ({ hour: Math.floor(i / 2) + 7, min: i % 2 === 0 ? 0 : 30 }));

const COURSE_COLORS = [
    { bg: '#9BCAF2', text: '#000000' },
    { bg: '#C2DCF2', text: '#000000' },
    { bg: '#F2D6B3', text: '#000000' },
];

function parseSchedule(scheduleTime) {
    if (!scheduleTime) return [];
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

export default function ProfessorDashboard() { // Removed 'token' prop
    const navigate = useNavigate();
    const { t } = useLanguage(); // Kept one declaration
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const timetableRef = useRef(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const cachedUser = JSON.parse(localStorage.getItem('user'));
                if (cachedUser) {
                    setUser(cachedUser);
                }

                const [coursesRes, announcementsRes] = await Promise.all([
                    fetch('http://localhost:5000/api/courses/professor', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('http://localhost:5000/api/announcements/professor', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (coursesRes.ok) {
                    setCourses(await coursesRes.json());
                }
                if (announcementsRes.ok) {
                    setAnnouncements(await announcementsRes.json());
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [navigate]);

    const handleDownloadTimetable = async () => {
        if (!timetableRef.current) return;
        try {
            const canvas = await html2canvas(timetableRef.current, { backgroundColor: '#FAFAFA', scale: 2 });
            const link = document.createElement('a');
            link.download = 'professor_timetable.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) { }
    };

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)' }}>{t('loading')}</div>;
    }

    const totalStudentsEnrolled = courses.reduce((sum, c) => sum + (parseInt(c.enrolled_count) || 0), 0);
    const totalClasses = courses.length;

    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue"
    const todayClasses = courses.filter(c => c.schedule_time && c.schedule_time.includes(dayOfWeek)).map(c => {
        const match = c.schedule_time.match(/(\d{2}:\d{2})-\d{2}:\d{2}/);
        return {
            ...c,
            startTime: match ? match[1] : '99:99'
        };
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));

    const timetableBlocks = [];
    courses.forEach((course, idx) => {
        const slots = parseSchedule(course.schedule_time);
        const color = COURSE_COLORS[idx % COURSE_COLORS.length];
        slots.forEach(slot => {
            timetableBlocks.push({ ...slot, code: course.code, room: course.room, color, name: course.name, id: course.id });
        });
    });

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-dark)', overflow: 'hidden' }}>
            <Sidebar activePath="/professor/dashboard" />
            <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}
                >
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>{t('prof_dashboard_title')}</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>{t('prof_dashboard_desc')}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>

                        <motion.button whileHover={{ scale: 1.1 }} className="glass-panel" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', color: 'var(--color-text)', cursor: 'pointer', position: 'relative', background: 'var(--color-bg-light)' }}>
                            <Bell size={20} />
                            <span style={{ position: 'absolute', top: '12px', right: '12px', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', border: '2px solid var(--color-bg-light)' }}></span>
                        </motion.button>
                        {user?.profilePictureUrl ? (
                            <img src={`http://localhost:5000${user.profilePictureUrl}`} alt="Profile" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 10px rgba(217, 121, 4, 0.3)', cursor: 'pointer' }} />
                        ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(217, 121, 4, 0.3)', cursor: 'pointer' }}>
                                {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
                            </div>
                        )}
                    </div>
                </motion.header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', paddingBottom: '2rem' }}>
                    {/* Stats Overview */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel" style={{ gridColumn: 'span 4', padding: '2rem' }}>
                        <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('my_classes')}</h3>
                        <div style={{ fontSize: '3.5rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1, color: 'var(--color-primary)' }}>{totalClasses}</div>
                        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>{t('this_semester')}</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel" style={{ gridColumn: 'span 4', padding: '2rem' }}>
                        <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('classes_today')}</h3>
                        <div style={{ fontSize: '3.5rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1, color: '#10b981' }}>{todayClasses.length}</div>
                        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel" style={{ gridColumn: 'span 4', padding: '2rem' }}>
                        <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('total_students')}</h3>
                        <div style={{ fontSize: '3.5rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1, color: '#10b981' }}>{totalStudentsEnrolled}</div>
                        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>{t('across_all_courses')}</p>
                    </motion.div>

                    {/* Today's Schedule Mini-View */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel" style={{ gridColumn: 'span 6', padding: '2rem' }}>
                        <h3 style={{ color: 'var(--color-text)', fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 600 }}>{t('classes_today')} ({dayOfWeek})</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {todayClasses.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{t('no_classes_today')}</p>
                            ) : (
                                todayClasses.map(course => (
                                    <div key={course.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem', minWidth: '45px' }}>{course.startTime}</div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text)' }}>{course.code}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                <MapPin size={12} /> {course.room || 'TBA'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Recent Announcements */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-panel" style={{ gridColumn: 'span 6', padding: '2.5rem' }}>
                        <h3 style={{ color: 'var(--color-text)', fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 600 }}>{t('recent_announcements')}</h3>
                        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {announcements.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{t('no_announcements')}</p>
                            ) : (
                                announcements.map(ann => (
                                    <div key={ann.id} style={{ minWidth: '300px', maxWidth: '300px', padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(242, 159, 5, 0.12)', padding: '2px 8px', borderRadius: '4px', marginBottom: '0.5rem' }}>{ann.course_code}</div>
                                        <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ann.title}</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '0.8rem' }}>{ann.content}</p>
                                        <small style={{ color: 'var(--color-text-muted)', opacity: 0.7, fontSize: '0.75rem' }}>{new Date(ann.created_at).toLocaleDateString()}</small>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Weekly Timetable */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel" style={{ gridColumn: 'span 12', padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)' }}>{t('weekly_schedule')}</h3>
                            <button className="btn btn-primary" onClick={handleDownloadTimetable} style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {t('download')} <Download size={16} />
                            </button>
                        </div>
                        <div ref={timetableRef} style={{ background: '#FAFAFA', borderRadius: '16px', padding: '1.5rem', overflow: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(30, 1fr)', fontSize: '0.72rem', minWidth: '1100px' }}>
                                {/* Header Row */}
                                <div style={{ padding: '0.5rem', fontWeight: 700, textAlign: 'center', background: '#F3F4F6', color: '#4B5563', borderRadius: '8px 0 0 0', fontSize: '0.72rem', borderBottom: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>{t('day_time')}</div>
                                {HALF_HOURS.map((slot, i) => (
                                    <div key={i} style={{
                                        padding: '0.4rem 0', fontWeight: slot.min === 0 ? 700 : 500, textAlign: 'center', background: '#F3F4F6', color: '#4B5563',
                                        fontSize: slot.min === 0 ? '0.68rem' : '0.58rem', borderLeft: slot.min === 0 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                                        borderBottom: '1px solid #E5E7EB',
                                        borderRadius: i === HALF_HOURS.length - 1 ? '0 8px 0 0' : '0', opacity: slot.min === 0 ? 1 : 0.7
                                    }}>
                                        {`${slot.hour.toString().padStart(2, '0')}:${slot.min === 0 ? '00' : '30'}`}
                                    </div>
                                ))}

                                {/* Day Rows */}
                                {DAYS.map((day, dayIdx) => (
                                    <React.Fragment key={day}>
                                        <div style={{
                                            padding: '0.6rem 0.4rem', fontWeight: 700, textAlign: 'center', background: dayIdx % 2 === 0 ? '#fff' : '#f9f9f9',
                                            borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#333'
                                        }}>{t(day.toLowerCase())}</div>
                                        <div style={{
                                            gridColumn: '2 / -1', position: 'relative', minHeight: '64px',
                                            background: dayIdx % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #eee',
                                            display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)'
                                        }}>
                                            {/* Grid lines */}
                                            {HALF_HOURS.map((slot, i) => (
                                                <div key={i} style={{
                                                    borderRight: slot.min === 0 ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(0,0,0,0.04)',
                                                    minHeight: '64px'
                                                }}></div>
                                            ))}
                                            {/* Course blocks */}
                                            {timetableBlocks.filter(b => b.day === day).map((block, i) => {
                                                const left = ((block.startOffset - 7) / 15) * 100;
                                                const width = (block.duration / 15) * 100;
                                                return (
                                                    <div key={i} onClick={() => navigate(`/professor/courses/${block.id}`)} style={{
                                                        position: 'absolute', left: `${left}%`, width: `${width}%`, top: '4px', bottom: '4px',
                                                        backgroundColor: block.color.bg,
                                                        borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)',
                                                        padding: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                                        overflow: 'hidden', zIndex: 2, cursor: 'pointer', transition: 'transform 0.2s',
                                                    }}
                                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                        title={`${block.code} - ${block.name}`}
                                                    >
                                                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: block.color.text, lineHeight: 1.2 }}>{block.code}</span>
                                                        <span style={{ fontSize: '0.7rem', color: block.color.text, opacity: 0.9, marginTop: '2px' }}>{block.startTime}-{block.endTime}</span>
                                                        <span style={{ fontSize: '0.65rem', color: block.color.text, opacity: 0.8, marginTop: '1px' }}>{block.room}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
