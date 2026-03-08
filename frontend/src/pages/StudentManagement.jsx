import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Users } from 'lucide-react';

export default function StudentManagement() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [students, setStudents] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

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
                    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'PROFESSOR') {
                        navigate('/dashboard'); // Kick students out
                        return;
                    }
                }

                // Fetch students
                const studentsRes = await fetch('http://localhost:5000/api/admin/students', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (studentsRes.ok) {
                    setStudents(await studentsRes.json());
                }

            } catch (err) {
                console.error("StudentManagement mount error", err);
                navigate('/login');
            }
        };
        fetchData();
    }, [navigate]);

    const handleExportCSV = () => {
        if (students.length === 0) return;

        // Define CSV headers
        const headers = ['Student ID', 'First Name', 'Last Name', 'Email', 'University', 'Major', 'Year of Study', 'Joined'];

        // Convert rows
        const csvRows = students.map(s => {
            return [
                s.student_id || 'N/A',
                s.first_name || '',
                s.last_name || '',
                s.email || '',
                s.university || '',
                s.major || '',
                s.year_of_study || '',
                s.created_at ? new Date(s.created_at).toLocaleDateString() : ''
            ].map(val => `"${val}"`).join(',');
        });

        // Combine into one string
        const csvString = [headers.join(','), ...csvRows].join('\n');

        // Trigger download with UTF-8 BOM for Excel support
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'students_export.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (!user) return <div className="flex-center" style={{ height: '100vh', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{t('loading')}</div>;

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-dark)', overflow: 'hidden' }}>
            <Sidebar activePath="/admin/students" />

            <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}
                >
                    <div>
                        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.3rem', fontWeight: 600 }}>Student Management</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>Manage university students and users</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 1.2rem', borderRadius: '50px', background: 'var(--color-bg-light)' }}>
                            <Search size={18} color="var(--color-text-muted)" />
                            <input type="text" placeholder={t('search_placeholder')} style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text)', marginLeft: '0.8rem', padding: '0.2rem', fontFamily: 'var(--font-main)', fontSize: '0.95rem' }} />
                        </div>
                        <LanguageSwitcher />
                        <motion.button whileHover={{ scale: 1.1 }} className="glass-panel" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', color: 'var(--color-text)', cursor: 'pointer', position: 'relative', background: 'var(--color-bg-light)' }}>
                            <Bell size={20} />
                        </motion.button>
                    </div>
                </motion.header>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel" style={{ padding: '2.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 600 }}>All Students</h3>
                        <button className="btn"
                            onClick={handleExportCSV}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: '#10b981', color: 'white',
                                padding: '0.8rem 1.2rem', borderRadius: '10px',
                                border: 'none', fontWeight: 600, cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}>
                            Download CSV
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto', background: 'var(--color-bg-light)', borderRadius: '12px', padding: '1rem', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '1rem' }}>Student ID</th>
                                    <th style={{ padding: '1rem' }}>Name</th>
                                    <th style={{ padding: '1rem' }}>Email</th>
                                    <th style={{ padding: '1rem' }}>University</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Major</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Year</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No students found.</td>
                                    </tr>
                                ) : (
                                    students.map(student => (
                                        <tr key={student.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>{student.student_id ? student.student_id : 'N/A'}</td>
                                            <td style={{ padding: '1rem', fontWeight: 500 }}>{student.first_name} {student.last_name}</td>
                                            <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{student.email}</td>
                                            <td style={{ padding: '1rem' }}>{student.university || 'N/A'}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{student.major || '-'}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{student.year_of_study || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
