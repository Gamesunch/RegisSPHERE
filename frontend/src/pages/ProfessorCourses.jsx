import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import { BookOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { ProfessorCoursesPageSkeleton } from '../components/SkeletonLoader';

export default function ProfessorCourses() {
    const { t } = useLanguage();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/courses/professor`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data);
                }
            } catch (error) {
                console.error('Error fetching professor courses:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Sidebar activePath="/professor/courses" />
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>{t('my_classes')}</h1>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>{t('manage_courses_desc')}</p>
                        </div>
                        <LanguageSwitcher />
                    </header>
                    {loading ? (
                        <ProfessorCoursesPageSkeleton />
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {courses.map(course => (
                                <div key={course.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>{course.code}</h3>
                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{course.name}</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                        <strong>{t('schedule')}:</strong> {course.schedule_time || t('tba')}
                                    </p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                        <strong>{t('room')}:</strong> {course.room || t('tba')}
                                    </p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                            onClick={() => navigate(`/professor/courses/${course.id}`)}
                                        >
                                            <Users size={16} /> {t('manage_class_btn')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
