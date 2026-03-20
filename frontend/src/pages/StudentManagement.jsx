import React, { useEffect, useState, useMemo } from 'react';
import { API_BASE_URL } from '../config';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { Bell, Users, Search, X } from 'lucide-react';
import { TablePageSkeleton } from '../components/SkeletonLoader';

export default function StudentManagement() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            // Fetch profile
            const profileRes = await fetch(`${API_BASE_URL}/api/profile`, {
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
            const studentsRes = await fetch(`${API_BASE_URL}/api/admin/students`, {
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

    const handleYearChange = async (studentId, newYear) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/students/${studentId}/year`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ year_of_study: newYear })
            });

            if (res.ok) {
                fetchData(); // Refresh list
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update year');
            }
        } catch (err) {
            console.error('Error updating student year:', err);
            alert('Server error updating year');
        }
    };

    const handleExportCSV = () => {
        if (students.length === 0) return;

        // Define CSV headers
        const headers = [t('student_id'), t('first_name'), t('last_name'), t('email'), t('university'), t('major'), t('year_of_study'), t('joined')];

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

    const filteredStudents = useMemo(() => students.filter(s =>
        (s.student_id && s.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [students, searchQuery]);

    if (!user) return <TablePageSkeleton cols={6} />;

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
                        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.3rem', fontWeight: 600 }}>{t('student_mgmt_title')}</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>{t('student_mgmt_desc')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>

                    </div>
                </motion.header>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel" style={{ padding: '2.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 600 }}>{t('all_students')}</h3>
                        <button className="btn"
                            onClick={handleExportCSV}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: '#10b981', color: 'white',
                                padding: '0.8rem 1.2rem', borderRadius: '10px',
                                border: 'none', fontWeight: 600, cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}>
                            {t('download_csv')}
                        </button>
                    </div>
                    {/* Search Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0.7rem 1.2rem', borderRadius: '50px', marginBottom: '1.5rem', background: 'var(--color-bg-light)', border: '1px solid var(--glass-border)' }}>
                        <Search size={18} color="var(--color-text-muted)" />
                        <input type="text" placeholder={t('search_students') || 'Search students...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text)', marginLeft: '0.8rem', padding: '0.3rem', fontFamily: 'var(--font-main)', fontSize: '0.95rem', flex: 1 }} />
                        {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px' }}><X size={16} /></button>}
                    </div>

                    <div style={{ overflowX: 'auto', background: 'var(--color-bg-light)', borderRadius: '12px', padding: '1rem', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '1rem' }}>{t('student_id')}</th>
                                    <th style={{ padding: '1rem' }}>{t('name')}</th>
                                    <th style={{ padding: '1rem' }}>{t('email_address')}</th>
                                    <th style={{ padding: '1rem' }}>{t('university')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>{t('major')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>{t('year')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('no_students_found')}</td>
                                    </tr>
                                ) : (
                                    filteredStudents.map(student => (
                                        <tr key={student.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>{student.student_id ? student.student_id : 'N/A'}</td>
                                            <td style={{ padding: '1rem', fontWeight: 500 }}>{student.first_name} {student.last_name}</td>
                                            <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{student.email}</td>
                                            <td style={{ padding: '1rem' }}>{student.university || 'N/A'}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{student.major || '-'}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <select 
                                                    value={student.year_of_study || ''}
                                                    onChange={(e) => handleYearChange(student.id, e.target.value)}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid var(--glass-border)',
                                                        borderRadius: '6px',
                                                        color: 'var(--color-text)',
                                                        padding: '4px 8px',
                                                        fontSize: '0.85rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="">-</option>
                                                    <option value="1">1</option>
                                                    <option value="2">2</option>
                                                    <option value="3">3</option>
                                                    <option value="4">4</option>
                                                    <option value="5">5+</option>
                                                </select>
                                            </td>
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
