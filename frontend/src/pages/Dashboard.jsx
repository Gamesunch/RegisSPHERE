import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Users, Settings, LogOut, Bell, Search, MapPin, Calendar, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState({ credits: 0, pending: 0, gpa: 'N/A' });
    const [enrollments, setEnrollments] = useState([]);
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [adminPhase, setAdminPhase] = useState('ENROLLMENT');
    const [demandData, setDemandData] = useState([]);
    const [confirmPhaseModal, setConfirmPhaseModal] = useState({ show: false, newPhase: null });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Fetch user and system data
        const fetchData = async () => {
            try {
                // Fetch profile
                const profileRes = await fetch('http://localhost:5000/api/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                let currentUser = null;
                if (profileRes.ok) {
                    currentUser = await profileRes.json();
                    setUser(currentUser);
                } else {
                    currentUser = JSON.parse(localStorage.getItem('user'));
                    setUser(currentUser);
                }

                // Fetch courses
                const courseRes = await fetch('http://localhost:5000/api/courses', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (courseRes.ok) setCourses(await courseRes.json());

                // Fetch real enrollments for student stats
                const enrollRes = await fetch('http://localhost:5000/api/enrollments/mine', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (enrollRes.ok) {
                    const myEnrollments = await enrollRes.json();
                    setEnrollments(myEnrollments);

                    // Calculate stats
                    let totalCredits = 0;
                    let waitlistedCount = 0;
                    let totalGradePoints = 0;
                    let gradedCredits = 0;

                    const gradeValues = { 'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0 };

                    const dayMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
                    const currentDayStr = dayMap[new Date().getDay()]; // e.g., 'Wed'
                    const todayClasses = [];

                    myEnrollments.forEach(course => {
                        if (course.status === 'ENROLLED') {
                            totalCredits += course.credits || 0;

                            // GPA calculation
                            if (course.grade && gradeValues[course.grade] !== undefined) {
                                totalGradePoints += gradeValues[course.grade] * (course.credits || 0);
                                gradedCredits += (course.credits || 0);
                            }

                            // Today's schedule check
                            if (course.schedule_time && course.schedule_time.includes(currentDayStr)) {
                                const match = course.schedule_time.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
                                todayClasses.push({
                                    time: match ? match[1] : 'TBA',
                                    sortTime: match ? match[1] : '99:99',
                                    name: course.name,
                                    room: course.room || 'TBA',
                                    prof: course.prof_last ? `Prof. ${course.prof_last}` : 'TBA',
                                    color: '#3b82f6' // Default color
                                });
                            }
                        } else if (course.status === 'WAITLISTED') {
                            waitlistedCount++;
                        }
                    });

                    // Sort today's classes by time
                    todayClasses.sort((a, b) => a.sortTime.localeCompare(b.sortTime));

                    // Assign colors to the schedule
                    const colors = ['var(--color-primary)', 'var(--color-secondary)', '#10b981', '#f59e0b', '#8b5cf6'];
                    todayClasses.forEach((c, idx) => c.color = colors[idx % colors.length]);

                    setTodaySchedule(todayClasses);

                    let calcGpa = 'N/A';
                    if (gradedCredits > 0) {
                        calcGpa = (totalGradePoints / gradedCredits).toFixed(2);
                    }

                    setStats({ credits: totalCredits, pending: waitlistedCount, gpa: calcGpa });
                }
                if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'PROFESSOR')) {
                    const phaseRes = await fetch('http://localhost:5000/api/admin/phase', { headers: { 'Authorization': `Bearer ${token}` } });
                    if (phaseRes.ok) {
                        const phaseData = await phaseRes.json();
                        setAdminPhase(phaseData.phase);
                    }
                    const demandRes = await fetch('http://localhost:5000/api/admin/demand', { headers: { 'Authorization': `Bearer ${token}` } });
                    if (demandRes.ok) {
                        setDemandData(await demandRes.json());
                    }
                }

            } catch (err) {
                console.error("Dashboard mount error", err);
                navigate('/login');
            }
        };
        fetchData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const executePhaseChange = async () => {
        const { newPhase } = confirmPhaseModal;
        if (!newPhase) return;

        setAdminPhase(newPhase);
        await fetch('http://localhost:5000/api/admin/phase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ phase: newPhase })
        });

        setConfirmPhaseModal({ show: false, newPhase: null });
        window.location.reload();
    };

    if (!user) return <div className="flex-center" style={{ height: '100vh', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{t('loading')}</div>;

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-dark)', overflow: 'hidden' }}>

            {/* Sidebar - Glassmorphism unified component */}
            <Sidebar activePath="/dashboard" />

            {/* Main Content Area */}            <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

                {/* Header */}
                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}
                >
                    <div>
                        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.3rem', fontWeight: 600 }}>{t('welcome_back')}, {user.firstName || t('student_role_display')}</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>{t('academic_overview')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 1.2rem', borderRadius: '50px', background: 'var(--color-bg-light)' }}>
                            <Search size={18} color="var(--color-text-muted)" />
                            <input type="text" placeholder={t('search_placeholder')} style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text)', marginLeft: '0.8rem', padding: '0.2rem', fontFamily: 'var(--font-main)', fontSize: '0.95rem' }} />
                        </div>
                        <LanguageSwitcher />
                        <motion.button whileHover={{ scale: 1.1 }} className="glass-panel" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', color: 'var(--color-text)', cursor: 'pointer', position: 'relative', background: 'var(--color-bg-light)' }}>
                            <Bell size={20} />
                            <span style={{ position: 'absolute', top: '12px', right: '12px', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', border: '2px solid var(--color-bg-light)' }}></span>
                        </motion.button>
                        {user.profilePictureUrl ? (
                            <img src={`http://localhost:5000${user.profilePictureUrl}`} alt="Profile" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 10px rgba(217, 121, 4, 0.3)', cursor: 'pointer' }} />
                        ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(217, 121, 4, 0.3)', cursor: 'pointer' }}>
                                {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
                            </div>
                        )}
                    </div>
                </motion.header>

                {/* Widgets Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', paddingBottom: '2rem' }}>

                    {/* Admin Panel (If Applicable) */}
                    {(user.role === 'ADMIN' || user.role === 'PROFESSOR') && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ gridColumn: 'span 12', padding: '2.5rem', border: '1px solid var(--color-primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-primary)' }}>Faculty & Admin Controls</h3>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Manage enrollment phases and course capacity</p>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600 }}>Current Phase:</span>
                                    <select
                                        value={adminPhase}
                                        onChange={(e) => {
                                            const newPhase = e.target.value;
                                            setConfirmPhaseModal({ show: true, newPhase });
                                        }}
                                        style={{ padding: '0.6rem 1rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        <option value="PRE_ENROLLMENT">Pre-Enrollment</option>
                                        <option value="ENROLLMENT">Active Enrollment</option>
                                        <option value="CLOSED">Closed</option>
                                    </select>
                                </div>
                            </div>

                            <h4 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1.1rem' }}>Course Demand (Pre-Enrollment Analytics)</h4>
                            <div style={{ overflowX: 'auto', background: 'var(--color-bg-light)', borderRadius: '12px', padding: '1rem' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                            <th style={{ padding: '0.8rem' }}>Course</th>
                                            <th style={{ padding: '0.8rem', textAlign: 'center' }}>Capacity</th>
                                            <th style={{ padding: '0.8rem', textAlign: 'center' }}>Pre-Enrolled</th>
                                            <th style={{ padding: '0.8rem', textAlign: 'center' }}>Waitlisted</th>
                                            <th style={{ padding: '0.8rem', textAlign: 'center' }}>Officially Enrolled</th>
                                            <th style={{ padding: '0.8rem', textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {demandData.map(course => {
                                            const c_cap = parseInt(course.capacity);
                                            const pre_en = parseInt(course.pre_enrolled_count);
                                            const isBottleneck = pre_en > c_cap;
                                            return (
                                                <tr key={course.id} style={{ borderBottom: '1px solid var(--glass-border)', background: isBottleneck ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                                                    <td style={{ padding: '0.8rem', fontWeight: 600 }}>{course.code} - {course.name}</td>
                                                    <td style={{ padding: '0.8rem', textAlign: 'center' }}>{course.capacity}</td>
                                                    <td style={{ padding: '0.8rem', textAlign: 'center', color: isBottleneck ? '#ef4444' : 'var(--color-text)' }}>
                                                        {course.pre_enrolled_count}
                                                    </td>
                                                    <td style={{ padding: '0.8rem', textAlign: 'center' }}>{course.waitlisted_count}</td>
                                                    <td style={{ padding: '0.8rem', textAlign: 'center' }}>{course.enrolled_count}</td>
                                                    <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                                                        <button
                                                            onClick={async () => {
                                                                const newCap = prompt(`Enter new capacity for ${course.code} (Current: ${course.capacity}):`, course.capacity);
                                                                if (newCap && !isNaN(newCap)) {
                                                                    await fetch(`http://localhost:5000/api/admin/courses/${course.id}/capacity`, {
                                                                        method: 'PUT',
                                                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                                                                        body: JSON.stringify({ capacity: parseInt(newCap) })
                                                                    });

                                                                    // Refresh demand data for the table
                                                                    const demandRes = await fetch('http://localhost:5000/api/admin/demand', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
                                                                    if (demandRes.ok) setDemandData(await demandRes.json());

                                                                    // Also refresh the user's enrollments to update the waitlist count instantly
                                                                    const enrollRes = await fetch('http://localhost:5000/api/enrollments/mine', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
                                                                    if (enrollRes.ok) {
                                                                        const myEnrollments = await enrollRes.json();
                                                                        let waitlistedCount = 0;
                                                                        myEnrollments.forEach(c => { if (c.status === 'WAITLISTED') waitlistedCount++; });
                                                                        setStats(prev => ({ ...prev, pending: waitlistedCount }));
                                                                    }
                                                                }
                                                            }}
                                                            style={{ padding: '0.4rem 0.8rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                            Edit Cap
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* Stats Cards */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.8rem' }}>
                        <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('total_credits')}</h3>
                        <div style={{ fontSize: '3.2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1 }} className="text-gradient">{stats.credits}</div>
                        <p style={{ fontSize: '0.95rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '20px' }}>Active</span> {t('this_semester')}
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.8rem' }}>
                        <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('current_gpa')}</h3>
                        <div style={{ fontSize: '3.2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1 }}>{stats.gpa}</div>
                        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Based on graded courses
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.8rem', background: 'var(--color-primary-dark)', color: 'white', border: 'none' }}>
                        <h3 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Waitlisted Courses</h3>
                        <div style={{ fontSize: '3.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white', lineHeight: 1 }}>{stats.pending}</div>
                        <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)' }}>Pending Action</p>
                    </motion.div>

                    {/* Schedule / Main Section */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-panel" style={{ gridColumn: 'span 8', padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 600 }}>{t('today_schedule')}</h3>
                            <button className="btn" style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text)', padding: '0.5rem 1rem', fontSize: '0.9rem', border: '1px solid var(--glass-border)' }}>{t('view_calendar')}</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {todaySchedule.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                    <Calendar size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                                    <p>No classes scheduled for today.</p>
                                </div>
                            ) : (
                                todaySchedule.map((course, idx) => (
                                    <motion.div whileHover={{ scale: 1.01, backgroundColor: 'var(--color-surface-hover)' }} key={idx} style={{ display: 'flex', alignItems: 'center', padding: '1.2rem', background: 'var(--color-bg-light)', borderRadius: '16px', borderLeft: `5px solid ${course.color}`, cursor: 'pointer', transition: 'background 0.3s', border: '1px solid var(--glass-border)' }}>
                                        <div style={{ minWidth: '110px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>{course.time}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '0.2rem', color: 'var(--color-text)' }}>{course.name}</div>
                                            <div style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>{course.prof}</div>
                                        </div>
                                        <div style={{ padding: '0.5rem 1rem', background: 'var(--color-bg-dark)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <MapPin size={16} /> {course.room}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Activity / Notifications */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-panel" style={{ gridColumn: 'span 4', padding: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '2rem', fontWeight: 600 }}>{t('uni_news')}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                            <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'inline-block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.8rem', color: 'var(--color-secondary)', background: 'rgba(236,72,153,0.1)', padding: '0.3rem 0.8rem', borderRadius: '50px' }}>{t('event')}</div>
                                <div style={{ fontSize: '1.15rem', marginBottom: '0.4rem', fontWeight: 500 }}>{t('news_1_title')}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{t('news_1_desc')}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <Calendar size={16} /> March 15, 2026
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'inline-block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.8rem', color: 'var(--color-primary)', background: 'rgba(139,92,246,0.1)', padding: '0.3rem 0.8rem', borderRadius: '50px' }}>{t('notice')}</div>
                                <div style={{ fontSize: '1.15rem', marginBottom: '0.4rem', fontWeight: 500 }}>{t('news_2_title')}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{t('news_2_desc')}</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Confirmation Modal for Phase Change */}
            {confirmPhaseModal.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel"
                        style={{ padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <Settings size={30} color="#ef4444" />
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text)' }}>Confirm Phase Change</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.5 }}>
                            Are you sure you want to change the enrollment phase to <strong>{confirmPhaseModal.newPhase}</strong>? This might trigger automatic waitlist enrollments and change what students see.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn" onClick={() => setConfirmPhaseModal({ show: false, newPhase: null })}
                                style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-text)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                                {t('cancel')}
                            </button>
                            <button className="btn" onClick={executePhaseChange}
                                style={{ flex: 1, padding: '0.8rem', background: '#ef4444', border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }}>
                                Confirm
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
