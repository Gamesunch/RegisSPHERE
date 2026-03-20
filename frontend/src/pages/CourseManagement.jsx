import React, { useEffect, useState, useMemo } from 'react';
import { API_BASE_URL } from '../config';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Edit2, Trash2, Download, Users, X, Check, Search } from 'lucide-react';
import { TablePageSkeleton } from '../components/SkeletonLoader';

export default function CourseManagement() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [professorsList, setProfessorsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [profSearch, setProfSearch] = useState('');

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
        min_year: 1,
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

                // Fetch all courses
                const courseRes = await fetch(`${API_BASE_URL}/api/courses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (courseRes.ok) {
                    setCourses(await courseRes.json());
                }

                // Fetch all professors
                const profsRes = await fetch(`${API_BASE_URL}/api/users/professors`, {
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
            const res = await fetch(`${API_BASE_URL}/api/courses`, {
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
                    code: '', name: '', credits: 3, capacity: 30, min_year: 1,
                    professor_ids: [],
                    room: '', description: ''
                });
                setScheduleDay('Mon');
                setStartTime('10:00');
                setEndTime('11:30');
            } else {
                const errData = await res.json();
                alert(errData.error || t('failed_to_create_course'));
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
            min_year: course.min_year || 1,
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
            const res = await fetch(`${API_BASE_URL}/api/courses/${editingCourse.id}`, {
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
                alert(errData.error || t('failed_to_update_course'));
            }
        } catch (error) {
            console.error('Update course error:', error);
        }
    };

    const handleDeleteCourse = async (courseId, courseName) => {
        if (!window.confirm(t('confirm_delete_course', { courseName: courseName }))) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setCourses(courses.filter(c => c.id !== courseId));
            } else {
                const errData = await res.json();
                alert(errData.error || t('failed_to_delete_course'));
            }
        } catch (error) {
            console.error('Delete course error:', error);
        }
    };

    const handleExportCourseStudents = async (courseId, courseCode) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/students`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.length === 0) {
                    alert(t('no_students_found'));
                    return;
                }

                const headers = [t('student_id'), t('first_name'), t('last_name'), t('email'), t('major'), t('year'), t('status')];
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
                alert(t('failed_to_fetch_students'));
            }
        } catch (error) {
            console.error('Export course students error:', error);
        }
    };



    const filteredCourses = useMemo(() => courses.filter(c =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.professors && c.professors.some(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())))
    ), [courses, searchQuery]);

    const filteredProfessors = useMemo(() => professorsList.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(profSearch.toLowerCase())
    ), [professorsList, profSearch]);

    if (!user) return <TablePageSkeleton cols={8} />;

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
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }} className="text-gradient">
                        {t('course_mgmt_title')}
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                        {t('course_mgmt_desc')}
                    </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>

                    </div>
                </motion.header>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel" style={{ padding: '2.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 600 }}>{t('all_courses')}</h3>
                        <button className="btn"
                            onClick={() => setShowAddModal(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: 'var(--color-primary)', color: 'white',
                                padding: '0.8rem 1.2rem', borderRadius: '10px',
                                border: 'none', fontWeight: 600, cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(242, 159, 5, 0.3)'
                            }}>
                            <Plus size={18} /> {t('add_new_course')}
                        </button>
                    </div>
                    {/* Search Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0.7rem 1.2rem', borderRadius: '50px', marginBottom: '1.5rem', background: 'var(--color-bg-light)', border: '1px solid var(--glass-border)' }}>
                        <Search size={18} color="var(--color-text-muted)" />
                        <input type="text" placeholder={t('search_courses') || 'Search courses...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text)', marginLeft: '0.8rem', padding: '0.3rem', fontFamily: 'var(--font-main)', fontSize: '0.95rem', flex: 1 }} />
                        {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px' }}><X size={16} /></button>}
                    </div>

                    <div style={{ overflowX: 'auto', background: 'var(--color-bg-light)', borderRadius: '12px', padding: '1rem', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '1rem' }}>{t('code')}</th>
                                    <th style={{ padding: '1rem' }}>{t('course_name')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>{t('credits')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>{t('instructor')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>{t('schedule')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>{t('room')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>{t('min_year') || 'Min Year'}</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCourses.map(course => (
                                    <tr key={course.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{course.code}</td>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>{course.name}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>{course.credits}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                            {course.professors && course.professors.length > 0 ? course.professors.map(p => `${p.first_name} ${p.last_name}`).join(', ') : t('tba')}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>{course.schedule_time || t('tba')}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>{course.room || t('tba')}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>{course.min_year}</td>
                                        <td style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                            <button onClick={() => handleEditClick(course)} style={{ padding: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px', cursor: 'pointer' }} title={t('edit_course')}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteCourse(course.id, course.name)} style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', cursor: 'pointer' }} title={t('delete_course')}>
                                                <Trash2 size={16} />
                                            </button>
                                            <button onClick={() => handleExportCourseStudents(course.id, course.code)} style={{ padding: '0.4rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', cursor: 'pointer' }} title={t('download_enrolled_students_csv')}>
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
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', position: 'relative' }}>
                    <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <X size={24} />
                    </button>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2rem' }}>{t('add_new_course')}</h2>
                    <form onSubmit={handleAddCourse}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('code')}</label>
                                <input type="text" value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} className="input-field" required style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('credits')}</label>
                                <input type="number" value={newCourse.credits} onChange={e => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) })} className="input-field" required style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('course_name')}</label>
                            <input type="text" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} className="input-field" required style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('description')}</label>
                            <textarea value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} className="input-field" style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', minHeight: '80px', fontFamily: 'inherit' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('capacity')}</label>
                                <input type="number" value={newCourse.capacity} onChange={e => setNewCourse({ ...newCourse, capacity: parseInt(e.target.value) })} className="input-field" required style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('min_year') || 'Min Year'}</label>
                                <input type="number" min="1" max="6" value={newCourse.min_year} onChange={e => setNewCourse({ ...newCourse, min_year: parseInt(e.target.value) })} className="input-field" required style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('room')}</label>
                                <input type="text" value={newCourse.room} onChange={e => setNewCourse({ ...newCourse, room: e.target.value })} className="input-field" style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', width: '100%' }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>{t('assign_professors')} <span style={{ fontWeight: 'normal', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>({t('optional')})</span></label>
                            {/* Selected professors as chips */}
                            {newCourse.professor_ids.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                    {newCourse.professor_ids.map(pid => {
                                        const prof = professorsList.find(p => p.id === pid);
                                        if (!prof) return null;
                                        return (
                                            <span key={pid} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(242, 159, 5, 0.12)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600 }}>
                                                {prof.first_name} {prof.last_name}
                                                <button type="button" onClick={() => setNewCourse({ ...newCourse, professor_ids: newCourse.professor_ids.filter(id => id !== pid) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '0', display: 'flex' }}><X size={14} /></button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                            {/* Search input */}
                            <div style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'var(--color-bg-light)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                    <Search size={15} color="var(--color-text-muted)" />
                                    <input type="text" placeholder={t('search_professor') || 'Search professors...'} value={profSearch} onChange={e => setProfSearch(e.target.value)}
                                        style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text)', marginLeft: '0.5rem', fontSize: '0.88rem', flex: 1, fontFamily: 'var(--font-main)' }} />
                                </div>
                                {/* Dropdown list */}
                                <div style={{ maxHeight: '120px', overflowY: 'auto', marginTop: '4px', background: 'var(--color-bg-light)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                    {filteredProfessors.map(prof => {
                                        const isSelected = newCourse.professor_ids.includes(prof.id);
                                        return (
                                            <div key={prof.id}
                                                onClick={() => {
                                                    const updated = isSelected
                                                        ? newCourse.professor_ids.filter(id => id !== prof.id)
                                                        : [...newCourse.professor_ids, prof.id];
                                                    setNewCourse({ ...newCourse, professor_ids: updated });
                                                }}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.8rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--color-text)', background: isSelected ? 'rgba(242, 159, 5, 0.08)' : 'transparent', transition: 'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = isSelected ? 'rgba(242, 159, 5, 0.12)' : 'var(--color-surface-hover)'}
                                                onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(242, 159, 5, 0.08)' : 'transparent'}
                                            >
                                                <span>{prof.first_name} {prof.last_name}</span>
                                                {isSelected && <Check size={15} color="var(--color-primary)" />}
                                            </div>
                                        );
                                    })}
                                    {filteredProfessors.length === 0 && <div style={{ padding: '0.6rem 0.8rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{t('no_professors_found')}</div>}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('schedule')}</label>
                            <select value={scheduleDay} onChange={(e) => setScheduleDay(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', outline: 'none' }}>
                                <option value="Mon">{t('monday')}</option>
                                <option value="Tue">{t('tuesday')}</option>
                                <option value="Wed">{t('wednesday')}</option>
                                <option value="Thu">{t('thursday')}</option>
                                <option value="Fri">{t('friday')}</option>
                            </select>
                            <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                            <span style={{ color: 'var(--color-text-muted)' }}>{t('to')}</span>
                            <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>{t('cancel')}</button>
                            <button type="submit" style={{ flex: 1, padding: '0.8rem', background: 'var(--color-primary)', border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 10px rgba(242, 159, 5, 0.3)' }}>{t('create_course_btn')}</button>
                        </div>
                    </form>
                </motion.div>
                </div>
            )}

            {/* Edit Course Modal */}
            {showEditModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', position: 'relative' }}>
                    <button onClick={() => setShowEditModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <X size={24} />
                    </button>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2rem' }}>{t('edit_course')}</h2>
                    <form onSubmit={handleUpdateCourse}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('code')}</label>
                                <input type="text" value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} className="input-field" required style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('credits')}</label>
                                <input type="number" value={newCourse.credits} onChange={e => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) })} className="input-field" required style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('course_name')}</label>
                            <input type="text" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} className="input-field" required style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('description')}</label>
                            <textarea value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} className="input-field" style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', minHeight: '80px', fontFamily: 'inherit' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('capacity')}</label>
                                <input type="number" value={newCourse.capacity} onChange={e => setNewCourse({ ...newCourse, capacity: parseInt(e.target.value) })} className="input-field" required style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('min_year') || 'Min Year'}</label>
                                <input type="number" min="1" max="6" value={newCourse.min_year} onChange={e => setNewCourse({ ...newCourse, min_year: parseInt(e.target.value) })} className="input-field" required style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('room')}</label>
                                <input type="text" value={newCourse.room} onChange={e => setNewCourse({ ...newCourse, room: e.target.value })} className="input-field" style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', width: '100%' }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>{t('assign_professors')} <span style={{ fontWeight: 'normal', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>({t('optional')})</span></label>
                            {/* Selected professors as chips */}
                            {newCourse.professor_ids.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                    {newCourse.professor_ids.map(pid => {
                                        const prof = professorsList.find(p => p.id === pid);
                                        if (!prof) return null;
                                        return (
                                            <span key={pid} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(242, 159, 5, 0.12)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600 }}>
                                                {prof.first_name} {prof.last_name}
                                                <button type="button" onClick={() => setNewCourse({ ...newCourse, professor_ids: newCourse.professor_ids.filter(id => id !== pid) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '0', display: 'flex' }}><X size={14} /></button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                            {/* Search input */}
                            <div style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'var(--color-bg-light)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                    <Search size={15} color="var(--color-text-muted)" />
                                    <input type="text" placeholder={t('search_professor') || 'Search professors...'} value={profSearch} onChange={e => setProfSearch(e.target.value)}
                                        style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text)', marginLeft: '0.5rem', fontSize: '0.88rem', flex: 1, fontFamily: 'var(--font-main)' }} />
                                </div>
                                {/* Dropdown list */}
                                <div style={{ maxHeight: '120px', overflowY: 'auto', marginTop: '4px', background: 'var(--color-bg-light)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                    {filteredProfessors.map(prof => {
                                        const isSelected = newCourse.professor_ids.includes(prof.id);
                                        return (
                                            <div key={prof.id}
                                                onClick={() => {
                                                    const updated = isSelected
                                                        ? newCourse.professor_ids.filter(id => id !== prof.id)
                                                        : [...newCourse.professor_ids, prof.id];
                                                    setNewCourse({ ...newCourse, professor_ids: updated });
                                                }}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.8rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--color-text)', background: isSelected ? 'rgba(242, 159, 5, 0.08)' : 'transparent', transition: 'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = isSelected ? 'rgba(242, 159, 5, 0.12)' : 'var(--color-surface-hover)'}
                                                onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(242, 159, 5, 0.08)' : 'transparent'}
                                            >
                                                <span>{prof.first_name} {prof.last_name}</span>
                                                {isSelected && <Check size={15} color="var(--color-primary)" />}
                                            </div>
                                        );
                                    })}
                                    {filteredProfessors.length === 0 && <div style={{ padding: '0.6rem 0.8rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{t('no_professors_found')}</div>}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('schedule')}</label>
                            <select value={scheduleDay} onChange={(e) => setScheduleDay(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', outline: 'none' }}>
                                <option value="Mon">{t('monday')}</option>
                                <option value="Tue">{t('tuesday')}</option>
                                <option value="Wed">{t('wednesday')}</option>
                                <option value="Thu">{t('thursday')}</option>
                                <option value="Fri">{t('friday')}</option>
                            </select>
                            <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                            <span style={{ color: 'var(--color-text-muted)' }}>{t('to')}</span>
                            <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>{t('cancel')}</button>
                            <button type="submit" style={{ flex: 1, padding: '0.8rem', background: 'var(--color-primary)', border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 10px rgba(242, 159, 5, 0.3)' }}>{t('update_course_btn')}</button>
                        </div>
                    </form>
                </motion.div>
                </div>
            )}
        </div>
    );
}
