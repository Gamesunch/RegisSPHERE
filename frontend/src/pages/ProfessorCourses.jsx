import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import { BookOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfessorCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/courses/professor', {
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
                    <header style={{ marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>My Classes</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>Manage your assigned courses and view timetables.</p>
                    </header>
                    {loading ? (
                        <p>Loading classes...</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {courses.map(course => (
                                <div key={course.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>{course.code}</h3>
                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{course.name}</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                        <strong>Schedule:</strong> {course.schedule_time || 'TBA'}
                                    </p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                        <strong>Room:</strong> {course.room || 'TBA'}
                                    </p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                            onClick={() => navigate(`/professor/courses/${course.id}`)}
                                        >
                                            <Users size={16} /> Manage Class
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
