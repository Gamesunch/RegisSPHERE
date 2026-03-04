import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Users, Settings, LogOut, Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState({ credits: 0, pending: 0, gpa: 'N/A' });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Fetch user and system data
        const fetchData = async () => {
            try {
                const userStored = JSON.parse(localStorage.getItem('user'));
                setUser(userStored);

                // Fetch courses
                const courseRes = await fetch('http://localhost:5000/api/courses', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (courseRes.ok) {
                    const courseData = await courseRes.json();
                    setCourses(courseData);
                } else {
                    console.error("Failed to fetch courses:", courseRes.status);
                }

                // Fetch stats (mock data for now, replace with actual API call)
                // For example:
                // const statsRes = await fetch('http://localhost:5000/api/stats', {
                //     headers: { 'Authorization': `Bearer ${token}` }
                // });
                // if (statsRes.ok) {
                //     const statsData = await statsRes.json();
                //     setStats(statsData);
                // } else {
                //     console.error("Failed to fetch stats:", statsRes.status);
                // }
                setStats({ credits: 84, pending: 4, gpa: '3.85' }); // Mock stats

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

    if (!user) return <div className="flex-center" style={{ height: '100vh', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading System...</div>;

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-dark)', overflow: 'hidden' }}>

            {/* Sidebar - Glassmorphism */}
            <motion.aside
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-panel"
                style={{ width: '280px', margin: '1.5rem', padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', borderRadius: '24px' }}
            >
                <div style={{ padding: '0 1rem', marginBottom: '3rem' }}>
                    <h2 className="text-gradient title-3d" style={{ fontSize: '1.8rem', letterSpacing: '0.5px' }}>UniConnect</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: '0.2rem' }}>Student Portal</p>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                    {[
                        { icon: LayoutDashboard, label: 'Overview', active: true },
                        { icon: BookOpen, label: 'My Courses' },
                        { icon: Users, label: 'Enrollment' },
                        { icon: Settings, label: 'Settings' }
                    ].map((item, i) => (
                        <button key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.2rem', width: '100%', border: 'none',
                            background: item.active ? 'linear-gradient(90deg, rgba(139,92,246,0.25), transparent)' : 'transparent',
                            color: item.active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            borderLeft: item.active ? '4px solid var(--color-primary)' : '4px solid transparent',
                            borderRadius: '0 12px 12px 0', cursor: 'pointer', fontSize: '1rem', fontWeight: 500, fontFamily: 'var(--font-main)',
                            transition: 'all 0.3s ease'
                        }}
                            onMouseEnter={(e) => {
                                if (!item.active) e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                                if (!item.active) e.currentTarget.style.color = 'var(--color-text-muted)';
                            }}
                        >
                            <item.icon size={22} /> {item.label}
                        </button>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', padding: '0 1rem' }}>
                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(244, 63, 94, 0.2)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogout}
                        className="btn glass-panel"
                        style={{ width: '100%', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-accent)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '1rem' }}
                    >
                        <LogOut size={18} /> Logout Session
                    </motion.button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

                {/* Header */}
                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}
                >
                    <div>
                        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.3rem', fontWeight: 600 }}>Welcome back, {user.firstName || 'Student'} <span style={{ fontSize: '1.8rem' }}>👋</span></h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>Here's your academic overview for today.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 1.2rem', borderRadius: '50px' }}>
                            <Search size={18} color="var(--color-text-muted)" />
                            <input type="text" placeholder="Search anything..." style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', marginLeft: '0.8rem', padding: '0.2rem', fontFamily: 'var(--font-main)', fontSize: '0.95rem' }} />
                        </div>
                        <motion.button whileHover={{ scale: 1.1 }} className="glass-panel" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', color: 'white', cursor: 'pointer', position: 'relative' }}>
                            <Bell size={20} />
                            <span style={{ position: 'absolute', top: '12px', right: '12px', width: '10px', height: '10px', background: 'var(--color-accent)', borderRadius: '50%', border: '2px solid var(--color-surface)' }}></span>
                        </motion.button>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 15px rgba(236, 72, 153, 0.4)', cursor: 'pointer' }}>
                            {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
                        </div>
                    </div>
                </motion.header>

                {/* Widgets Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', paddingBottom: '2rem' }}>

                    {/* Stats Cards */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.8rem' }}>
                        <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Credits</h3>
                        <div style={{ fontSize: '3.2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1 }} className="text-gradient">84</div>
                        <p style={{ fontSize: '0.95rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '20px' }}>+12</span> this semester
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.8rem' }}>
                        <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current GPA</h3>
                        <div style={{ fontSize: '3.2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1 }}>3.85</div>
                        <p style={{ fontSize: '0.95rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '20px' }}>Top 15%</span> of class
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.8rem', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                        <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Action Items</h3>
                        <div style={{ fontSize: '3.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-accent)', lineHeight: 1 }}>4</div>
                        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>Tasks pending within 7 days</p>
                    </motion.div>

                    {/* Schedule / Main Section */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-panel" style={{ gridColumn: 'span 8', padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Today's Course Schedule</h3>
                            <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>View Full Calendar</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {[
                                { time: '09:00 AM', name: 'Advanced Mathematics', room: 'Hall 101', color: 'var(--color-primary)', prof: 'Dr. Sarah Jenkins' },
                                { time: '11:00 AM', name: 'UI/UX Design Principles', room: 'Lab 4B', color: 'var(--color-secondary)', prof: 'Prof. Mark Otto' },
                                { time: '02:00 PM', name: 'Software Architecture', room: 'Room 205', color: '#10b981', prof: 'Dr. Emily Chen' }
                            ].map((course, idx) => (
                                <motion.div whileHover={{ scale: 1.01, backgroundColor: 'rgba(30, 41, 59, 0.6)' }} key={idx} style={{ display: 'flex', alignItems: 'center', padding: '1.2rem', background: 'rgba(15,23,42,0.4)', borderRadius: '16px', borderLeft: `5px solid ${course.color}`, cursor: 'pointer', transition: 'background 0.3s' }}>
                                    <div style={{ minWidth: '110px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>{course.time}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '0.2rem' }}>{course.name}</div>
                                        <div style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>{course.prof}</div>
                                    </div>
                                    <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                        📍 {course.room}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Activity / Notifications */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-panel" style={{ gridColumn: 'span 4', padding: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '2rem', fontWeight: 600 }}>University News</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                            <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'inline-block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.8rem', color: 'var(--color-secondary)', background: 'rgba(236,72,153,0.1)', padding: '0.3rem 0.8rem', borderRadius: '50px' }}>EVENT</div>
                                <div style={{ fontSize: '1.15rem', marginBottom: '0.4rem', fontWeight: 500 }}>Annual Tech Job Fair</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>Join us at the Main Campus for networking with top tier tech companies.</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    📅 March 15, 2026
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'inline-block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.8rem', color: 'var(--color-primary)', background: 'rgba(139,92,246,0.1)', padding: '0.3rem 0.8rem', borderRadius: '50px' }}>NOTICE</div>
                                <div style={{ fontSize: '1.15rem', marginBottom: '0.4rem', fontWeight: 500 }}>Course Registration</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>Fall semester enrollment period begins next Monday at 8:00 AM.</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
