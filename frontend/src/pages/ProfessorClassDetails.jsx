import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import Sidebar from '../components/Sidebar';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Save } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { ProfessorClassDetailsSkeleton } from '../components/SkeletonLoader';

export default function ProfessorClassDetails() {
    const { t } = useLanguage();
    const { courseId } = useParams();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gradingRowId, setGradingRowId] = useState(null);
    const [gradeInput, setGradeInput] = useState('');
    const [announcements, setAnnouncements] = useState([]);
    const [newAnnTitle, setNewAnnTitle] = useState('');
    const [newAnnContent, setNewAnnContent] = useState('');
    const [loadingAnn, setLoadingAnn] = useState(true);

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/students`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (error) {
            console.error('Error fetching course students:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/announcements/course/${courseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data);
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoadingAnn(false);
        }
    };

    useEffect(() => {
        fetchStudents();
        fetchAnnouncements();
    }, [courseId]);

    const handleDownload = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/students/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `course_${courseId}_students.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error downloading students:', error);
        }
    };

    const handleGradeSave = async (enrollmentId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/grades/${enrollmentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ grade: gradeInput })
            });

            if (res.ok) {
                // Refresh students list
                fetchStudents();
                setGradingRowId(null);
                setGradeInput('');
            } else {
                const data = await res.json();
                alert(data.error || t('failed_update_grade'));
            }
        } catch (error) {
            console.error('Error updating grade:', error);
            alert(t('failed_update_grade'));
        }
    };

    const handlePostAnnouncement = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/announcements/course/${courseId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: newAnnTitle, content: newAnnContent })
            });

            if (res.ok) {
                setNewAnnTitle('');
                setNewAnnContent('');
                fetchAnnouncements();
            } else {
                const data = await res.json();
                alert(data.error || t('failed_post_announcement'));
            }
        } catch (error) {
            console.error('Error posting announcement:', error);
            alert(t('failed_post_announcement'));
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Sidebar activePath="/professor/courses" />
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>{t('class_details_title')}</h1>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>{t('manage_students_desc')}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <LanguageSwitcher />
                            <button className="btn btn-primary" onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Download size={18} /> {t('download_csv')}
                            </button>
                        </div>
                    </header>
                    {loading ? (
                        <ProfessorClassDetailsSkeleton />
                    ) : (
                        <div className="glass-panel" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)' }}>{t('student_id')}</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)' }}>{t('name')}</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)' }}>{t('major')}</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)' }}>{t('status')}</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)' }}>{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(student => (
                                        <tr key={student.enrollment_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem' }}>{student.student_id}</td>
                                            <td style={{ padding: '1rem' }}>{student.first_name} {student.last_name}</td>
                                            <td style={{ padding: '1rem' }}>{student.major}</td>
                                            <td style={{ padding: '1rem' }}>{student.enrollment_status}</td>
                                            <td style={{ padding: '1rem' }}>
                                                {gradingRowId === student.enrollment_id ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        <select
                                                            value={gradeInput}
                                                            onChange={(e) => setGradeInput(e.target.value)}
                                                            className="input-field"
                                                            style={{ padding: '0.3rem', width: '80px', marginBottom: 0 }}
                                                        >
                                                            <option value="">{t('select_grade')}</option>
                                                            <option value="A">A</option>
                                                            <option value="B+">B+</option>
                                                            <option value="B">B</option>
                                                            <option value="C+">C+</option>
                                                            <option value="C">C</option>
                                                            <option value="D+">D+</option>
                                                            <option value="D">D</option>
                                                            <option value="F">F</option>
                                                        </select>
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={() => handleGradeSave(student.enrollment_id)}
                                                            style={{ padding: '0.4rem', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}
                                                        >
                                                            <Save size={16} />
                                                        </button>
                                                        <button
                                                            className="btn"
                                                            onClick={() => setGradingRowId(null)}
                                                            style={{ padding: '0.4rem 0.6rem', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                                        >
                                                            {t('cancel')}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 600 }}>{student.grade || t('not_available')}</span>
                                                        <button
                                                            className="btn"
                                                            onClick={() => { setGradingRowId(student.enrollment_id); setGradeInput(student.grade || ''); }}
                                                            style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                        >
                                                            {t('edit_grade')}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                {t('no_students_enrolled')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div style={{ marginTop: '3rem' }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '1.5rem' }}>{t('announcements')}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>{t('post_new_announcement')}</h3>
                                <form onSubmit={handlePostAnnouncement} className="glass-panel" style={{ padding: '1.5rem' }}>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <input
                                            type="text"
                                            placeholder={t('announcement_title_label')}
                                            value={newAnnTitle}
                                            onChange={(e) => setNewAnnTitle(e.target.value)}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <textarea
                                            placeholder={t('announcement_content_label')}
                                            value={newAnnContent}
                                            onChange={(e) => setNewAnnContent(e.target.value)}
                                            className="input-field"
                                            rows="4"
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{t('post_announcement_btn')}</button>
                                </form>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>{t('recent_announcements')}</h3>
                                {loadingAnn ? <p>{t('loading_announcements')}</p> : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '450px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                        {announcements.length === 0 ? <p style={{ color: 'var(--color-text-muted)' }}>{t('no_announcements_posted')}</p> : announcements.map(ann => (
                                            <div key={ann.id} className="glass-panel" style={{ padding: '1.2rem' }}>
                                                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>{ann.title}</h4>
                                                <p style={{ color: 'var(--color-text)', fontSize: '0.95rem', marginBottom: '0.8rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{ann.content}</p>
                                                <small style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>
                                                    {t('posted_on')} {new Date(ann.created_at).toLocaleDateString()}
                                                </small>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </motion.div>
            </main>
        </div>
    );
}
