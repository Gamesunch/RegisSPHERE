import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Plus, Edit2, Trash2, Download } from 'lucide-react';

export default function CourseManagement() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [professorsList, setProfessorsList] = useState([]);

    // Add Course Modal State
    const [showAddModal, setShowAddModal] = useState(false);

    // Edit Course Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);

    // Separate state for time selection
    const [scheduleDay, setScheduleDay] = useState('Mon');
    const [startTime, setStartTime] = useState('10:00');
    const [endTime, setEndTime] = useState('11:30');

    const [newCourse, setNewCourse] = useState({
        code: '',
        name: '',
        credits: 3,
        capacity: 30,
        professor_ids: [],
        room: '',
        description: ''
    });

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

                // Fetch all courses
                const courseRes = await fetch('http://localhost:5000/api/courses', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (courseRes.ok) {
                    setCourses(await courseRes.json());
                }

                // Fetch all professors
                const profsRes = await fetch('http://localhost:5000/api/users/professors', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (profsRes.ok) {
                    setProfessorsList(await profsRes.json());
                }

            } catch (err) {
                console.error("CourseManagement mount error", err);
                navigate('/login');
            }
        };
        fetchData();
    }, [navigate]);

    const handleAddCourse = async (e) => {
        e.preventDefault();

        // Combine schedule inputs
        const combinedSchedule = `${scheduleDay} ${startTime}-${endTime}`;
        const courseData = { ...newCourse, schedule_time: combinedSchedule };

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/courses', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });

            if (res.ok) {
                const data = await res.json();
                setCourses([...courses, data.course]);
                setShowAddModal(false);
                setNewCourse({
                    code: '', name: '', credits: 3, capacity: 30,
                    professor_ids: [],
                    room: '', description: ''
                });
                setScheduleDay('Mon');
                setStartTime('10:00');
                setEndTime('11:30');
            } else {
                const errData = await res.json();
                alert(errData.error || 'Failed to create course');
            }
        } catch (error) {
            console.error('Add course error:', error);
        }
    };

    const handleEditClick = (course) => {
        setEditingCourse(course);
        setNewCourse({
            code: course.code,
            name: course.name,
            credits: course.credits,
            capacity: course.capacity,
            professor_ids: course.professors ? course.professors.map(p => p.id) : [],
            room: course.room || '',
            description: course.description || ''
        });

        // Parse schedule_time
        if (course.schedule_time) {
            const parts = course.schedule_time.split(' ');
            if (parts.length === 2) {
                setScheduleDay(parts[0]);
                const timeParts = parts[1].split('-');
                if (timeParts.length === 2) {
                    setStartTime(timeParts[0]);
                    setEndTime(timeParts[1]);
                }
            }
        }
        setShowEditModal(true);
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        const combinedSchedule = `${scheduleDay} ${startTime}-${endTime}`;
        const courseData = { ...newCourse, schedule_time: combinedSchedule };

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/courses/${editingCourse.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });

            if (res.ok) {
                const data = await res.json();
                setCourses(courses.map(c => c.id === data.course.id ? { ...c, ...data.course } : c));
                setShowEditModal(false);
            } else {
                const errData = await res.json();
                alert(errData.error || 'Failed to update course');
            }
        } catch (error) {
            console.error('Update course error:', error);
        }
    };

    const handleDeleteCourse = async (courseId, courseName) => {
        if (!window.confirm(`Are you sure you want to delete ${courseName}? This will also delete all student enrollments for this course.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setCourses(courses.filter(c => c.id !== courseId));
            } else {
                const errData = await res.json();
                alert(errData.error || 'Failed to delete course');
            }
        } catch (error) {
            console.error('Delete course error:', error);
        }
    };

    const handleExportCourseStudents = async (courseId, courseCode) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/courses/${courseId}/students`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.length === 0) {
                    alert('No students found for this course.');
                    return;
                }

                const headers = ['Student ID', 'First Name', 'Last Name', 'Email', 'Major', 'Year', 'Status'];
                const csvRows = data.map(s => {
                    return [
                        s.student_id || 'N/A', s.first_name, s.last_name, s.email,
                        s.major || '', s.year_of_study || '', s.enrollment_status
                    ].map(val => `"${val}"`).join(',');
                });

                const csvString = [headers.join(','), ...csvRows].join('\n');
                // Prefix with BOM so Excel reads UTF-8 correctly
                const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('hidden', '');
                a.setAttribute('href', url);
                a.setAttribute('download', `${courseCode}_students.csv`);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                alert('Failed to fetch students for this course.');
            }
        } catch (error) {
            console.error('Export course students error:', error);
        }
    };



    if (!user) return <div className="flex-center" style={{ height: '100vh', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{t('loading')}</div>;

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-dark)', overflow: 'hidden' }}>
            <Sidebar activePath="/admin/courses" />

            <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}
                >
                    <div>
                        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.3rem', fontWeight: 600 }}>Course Management</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>Add, edit, or remove university courses</p>
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
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 600 }}>All Courses</h3>
                        <button className="btn"
                            onClick={() => setShowAddModal(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: 'var(--color-primary)', color: 'white',
                                padding: '0.8rem 1.2rem', borderRadius: '10px',
                                border: 'none', fontWeight: 600, cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(242, 159, 5, 0.3)'
                            }}>
                            <Plus size={18} /> Add New Course
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto', background: 'var(--color-bg-light)', borderRadius: '12px', padding: '1rem', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '1rem' }}>Code</th>
                                    <th style={{ padding: '1rem' }}>Course Name</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Credits</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Instructor</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Schedule</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Room</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map(course => (
                                    <tr key={course.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{course.code}</td>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>{course.name}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>{course.credits}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                            {course.professors && course.professors.length > 0 ? course.professors.map(p => `${p.first_name} ${p.last_name}`).join(', ') : 'TBA'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>{course.schedule_time || 'TBA'}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>{course.room || 'TBA'}</td>
                                        <td style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                            <button onClick={() => handleEditClick(course)} style={{ padding: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px', cursor: 'pointer' }} title="Edit Course">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteCourse(course.id, course.name)} style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', cursor: 'pointer' }} title="Delete Course">
                                                <Trash2 size={16} />
                                            </button>
                                            <button onClick={() => handleExportCourseStudents(course.id, course.code)} style={{ padding: '0.4rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', cursor: 'pointer' }} title="Download Enrolled Students CSV">
                                                <Download size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </main>

            {/* Add Course Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-text)' }}>Add New Course</h3>
                        <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input type="text" placeholder="Course Code (e.g. CS101)" required value={newCourse.code} onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                                <input type="number" placeholder="Credits" required value={newCourse.credits} onChange={(e) => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) })} style={{ width: '100px', padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                            </div>
                            <input type="text" placeholder="Course Name" required value={newCourse.name} onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                            <textarea placeholder="Description" value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', minHeight: '80px', fontFamily: 'inherit' }} />

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input type="number" placeholder="Capacity" required value={newCourse.capacity} onChange={(e) => setNewCourse({ ...newCourse, capacity: parseInt(e.target.value) })} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                                <input type="text" placeholder="Room (e.g. 101)" value={newCourse.room} onChange={(e) => setNewCourse({ ...newCourse, room: e.target.value })} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>Assign Professors <span style={{ fontWeight: 'normal', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>(Optional)</span></label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto', padding: '0.8rem', background: 'var(--color-bg-light)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                    {professorsList.map(prof => (
                                        <label key={prof.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                            <input
                                                type="checkbox"
                                                checked={newCourse.professor_ids.includes(prof.id)}
                                                onChange={(e) => {
                                                    const updated = e.target.checked
                                                        ? [...newCourse.professor_ids, prof.id]
                                                        : newCourse.professor_ids.filter(id => id !== prof.id);
                                                    setNewCourse({ ...newCourse, professor_ids: updated });
                                                }}
                                                style={{ accentColor: 'var(--color-primary)' }}
                                            />
                                            {prof.first_name} {prof.last_name}
                                        </label>
                                    ))}
                                    {professorsList.length === 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No professors found.</span>}
                                </div>
                            </div>

                            {/* New Schedule Selector */}
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <select value={scheduleDay} onChange={(e) => setScheduleDay(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', outline: 'none' }}>
                                    <option value="Mon">Monday</option>
                                    <option value="Tue">Tuesday</option>
                                    <option value="Wed">Wednesday</option>
                                    <option value="Thu">Thursday</option>
                                    <option value="Fri">Friday</option>
                                </select>
                                <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                                <span style={{ color: 'var(--color-text-muted)' }}>to</span>
                                <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '0.8rem', background: 'var(--color-primary)', border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 10px rgba(242, 159, 5, 0.3)' }}>Create Course</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Edit Course Modal */}
            {showEditModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-text)' }}>Edit Course</h3>
                        <form onSubmit={handleUpdateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input type="text" placeholder="Course Code (e.g. CS101)" required value={newCourse.code} onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                                <input type="number" placeholder="Credits" required value={newCourse.credits} onChange={(e) => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) })} style={{ width: '100px', padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                            </div>
                            <input type="text" placeholder="Course Name" required value={newCourse.name} onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                            <textarea placeholder="Description" value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', minHeight: '80px', fontFamily: 'inherit' }} />

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input type="number" placeholder="Capacity" required value={newCourse.capacity} onChange={(e) => setNewCourse({ ...newCourse, capacity: parseInt(e.target.value) })} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                                <input type="text" placeholder="Room (e.g. 101)" value={newCourse.room} onChange={(e) => setNewCourse({ ...newCourse, room: e.target.value })} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>Assign Professors <span style={{ fontWeight: 'normal', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>(Optional)</span></label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto', padding: '0.8rem', background: 'var(--color-bg-light)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                    {professorsList.map(prof => (
                                        <label key={prof.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                            <input
                                                type="checkbox"
                                                checked={newCourse.professor_ids.includes(prof.id)}
                                                onChange={(e) => {
                                                    const updated = e.target.checked
                                                        ? [...newCourse.professor_ids, prof.id]
                                                        : newCourse.professor_ids.filter(id => id !== prof.id);
                                                    setNewCourse({ ...newCourse, professor_ids: updated });
                                                }}
                                                style={{ accentColor: 'var(--color-primary)' }}
                                            />
                                            {prof.first_name} {prof.last_name}
                                        </label>
                                    ))}
                                    {professorsList.length === 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No professors found.</span>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <select value={scheduleDay} onChange={(e) => setScheduleDay(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', outline: 'none' }}>
                                    <option value="Mon">Monday</option>
                                    <option value="Tue">Tuesday</option>
                                    <option value="Wed">Wednesday</option>
                                    <option value="Thu">Thursday</option>
                                    <option value="Fri">Friday</option>
                                </select>
                                <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                                <span style={{ color: 'var(--color-text-muted)' }}>to</span>
                                <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '0.8rem', background: 'var(--color-primary)', border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 10px rgba(242, 159, 5, 0.3)' }}>Update Course</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
