import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Sidebar from '../components/Sidebar';
import StudentDashboard from './StudentDashboard';
import AdminDashboard from './AdminDashboard';
import { DashboardSkeleton } from '../components/SkeletonLoader';

export default function Dashboard() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ credits: 0, pending: 0, gpa: 'N/A' });
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [adminPhase, setAdminPhase] = useState('ENROLLMENT');
    const [loading, setLoading] = useState(true);

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
                const profileRes = await fetch(`${API_BASE_URL}/api/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                let currentUser = null;
                if (profileRes.ok) {
                    currentUser = await profileRes.json();
                    setUser(currentUser);
                    if (currentUser.role === 'PROFESSOR') {
                        navigate('/professor/dashboard');
                        return;
                    }
                } else {
                    currentUser = JSON.parse(localStorage.getItem('user'));
                    setUser(currentUser);
                    if (currentUser?.role === 'PROFESSOR') {
                        navigate('/professor/dashboard');
                        return;
                    }
                }

                if (currentUser && currentUser.role === 'STUDENT') {
                    // Fetch real enrollments for student stats
                    const enrollRes = await fetch(`${API_BASE_URL}/api/enrollments/mine`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (enrollRes.ok) {
                        const myEnrollments = await enrollRes.json();

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
                                        prof: course.professors && course.professors.length > 0 ? `Prof. ${course.professors.map(p => p.last_name).join(', ')}` : 'TBA',
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

                    // Fetch student announcements
                    const annRes = await fetch(`${API_BASE_URL}/api/announcements/student`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (annRes.ok) {
                        setAnnouncements(await annRes.json());
                    }
                }

                if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'PROFESSOR')) {
                    const phaseRes = await fetch(`${API_BASE_URL}/api/admin/phase`, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (phaseRes.ok) {
                        const phaseData = await phaseRes.json();
                        setAdminPhase(phaseData.phase);
                    }
                }

            } catch (err) {
                console.error("Dashboard mount error", err);
                navigate('/login');
            } finally {
                setLoading(false); // Set loading to false after fetch attempt
            }
        };
        fetchData();
    }, [navigate]);

    if (loading) {
        return <DashboardSkeleton />;
    }

    // If not loading but user is still null (e.g., failed to fetch user), redirect or show error
    if (!user) {
        // This case should ideally be handled by the fetchData's catch block navigating to login
        // but as a fallback, we can show a generic error or redirect.
        // For now, let's just show a loading message, though it implies an issue if loading is false.
        // A better approach might be to have an error state.
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)' }}>{t('error_loading_user_data')}</div>;
    }

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-dark)', overflow: 'hidden' }}>

            {/* Sidebar - Glassmorphism unified component */}
            <Sidebar activePath="/dashboard" />

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
                        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.3rem', fontWeight: 600 }}>{t('welcome_back')}, {user.firstName || (user.role === 'ADMIN' ? t('admin_role_display') : t('student_role_display'))}</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>{t('academic_overview')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>

                        <motion.button whileHover={{ scale: 1.1 }} className="glass-panel" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', color: 'var(--color-text)', cursor: 'pointer', position: 'relative', background: 'var(--color-bg-light)' }}>
                            <Bell size={20} />
                            <span style={{ position: 'absolute', top: '12px', right: '12px', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', border: '2px solid var(--color-bg-light)' }}></span>
                        </motion.button>
                        {user.profilePictureUrl ? (
                            <img src={user.profilePictureUrl.startsWith('http') ? user.profilePictureUrl : `${API_BASE_URL}${user.profilePictureUrl}`} alt="Profile" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 10px rgba(217, 121, 4, 0.3)', cursor: 'pointer' }} />
                        ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(217, 121, 4, 0.3)', cursor: 'pointer' }}>
                                {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
                            </div>
                        )}
                    </div>
                </motion.header>

                {/* Dashboard Router */}
                {(user.role === 'ADMIN' || user.role === 'PROFESSOR') ? (
                    <AdminDashboard
                        user={user}
                        token={localStorage.getItem('token')}
                        adminPhase={adminPhase}
                        setAdminPhase={setAdminPhase}
                    />
                ) : (
                    <StudentDashboard
                        user={user}
                        stats={stats}
                        todaySchedule={todaySchedule}
                        announcements={announcements}
                    />
                )}

            </main>
        </div>
    );
}
