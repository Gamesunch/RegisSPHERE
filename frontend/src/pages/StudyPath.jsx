import React, { useEffect, useState, useRef, useMemo } from 'react';
import { API_BASE_URL } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, Lock, Play, Layers, Send, Clock, MapPin, Filter } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const API_BASE = API_BASE_URL;
import { useLanguage } from '../context/LanguageContext';
import { StudyPathSkeleton } from '../components/SkeletonLoader';

export default function StudyPath() {
    const { t } = useLanguage();
    const [courses, setCourses] = useState([]);
    const [myEnrollments, setMyEnrollments] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState(null);
    const [selectedTrack, setSelectedTrack] = useState('ALL');
    const [lineCoords, setLineCoords] = useState([]);
    
    const containerRef = useRef(null);
    const cardRefs = useRef({});

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
        fetchData();
    }, []);

    const tracks = useMemo(() => {
        const uniqueTracks = [...new Set(courses.map(c => c.track))].filter(tr => tr && tr !== 'CORE' && tr !== 'OUTSIDE');
        return ['ALL', ...uniqueTracks, 'OUTSIDE'];
    }, [courses]);

    const filteredCourses = useMemo(() => {
        if (selectedTrack === 'ALL') return courses.filter(c => c.track === 'CORE' || c.track === 'OUTSIDE' || c.track === 'ALL' || !c.track);
        return courses.filter(c => c.track === 'CORE' || c.track === selectedTrack);
    }, [courses, selectedTrack]);

    useEffect(() => {
        if (!loading && filteredCourses.length > 0) {
            // Wait for DOM to update after filtering
            const timer = setTimeout(calculateLines, 300);
            window.addEventListener('resize', calculateLines);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', calculateLines);
            };
        }
    }, [loading, filteredCourses, myEnrollments]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const [courseRes, enrollRes] = await Promise.all([
                fetch(`${API_BASE}/api/courses`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE}/api/enrollments/mine`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            
            if (courseRes.ok && enrollRes.ok) {
                setCourses(await courseRes.json());
                setMyEnrollments(await enrollRes.json());
            }
        } catch (err) {
            console.error('Error fetching study path data:', err);
        }
        setLoading(false);
    };

    // Drag-to-Scroll Logic
    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e) => {
        // Only trigger if clicking the background or non-interactive elements
        if (e.target.closest('button') || e.target.closest('.course-card-inner')) return;
        
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const calculateLines = () => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newLines = [];

        filteredCourses.forEach(course => {
            if (course.prerequisites && Array.isArray(course.prerequisites) && course.prerequisites.length > 0) {
                const targetEl = cardRefs.current[course.id];
                if (!targetEl) return;
                const targetRect = targetEl.getBoundingClientRect();

                course.prerequisites.forEach(pre => {
                    const sourceEl = cardRefs.current[pre.id];
                    if (!sourceEl) return;
                    const sourceRect = sourceEl.getBoundingClientRect();

                    const startX = sourceRect.right - containerRect.left;
                    const startY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
                    const endX = targetRect.left - containerRect.left;
                    const endY = targetRect.top + targetRect.height / 2 - containerRect.top;

                    newLines.push({ startX, startY, endX, endY, status: getCourseStatus(pre) });
                });
            }
        });
        setLineCoords(newLines);
    };

    const handleEnroll = async (courseId) => {
        const token = localStorage.getItem('token');
        setEnrollingId(courseId);
        try {
            const res = await fetch(`${API_BASE}/api/enrollments`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ course_id: courseId })
            });
            const data = await res.json();
            if (res.ok) {
                alert(t('successfully_enrolled'));
                fetchData();
            } else {
                alert(data.error || t('enrollment_failed'));
            }
        } catch (err) {
            alert(t('server_error_enrollment'));
        }
        setEnrollingId(null);
    };

    const semesters = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const yearGroups = [
        { label: 'YEAR 1', sems: [1, 2], color: '#f87171' },
        { label: 'YEAR 2', sems: [3, 4], color: '#60a5fa' },
        { label: 'YEAR 3', sems: [5, 6], color: '#34d399' },
        { label: 'SUMMER', sems: [7], color: '#fbbf24' },
        { label: 'YEAR 4', sems: [8, 9], color: '#a78bfa' }
    ];

    const getCourseStatus = (course) => {
        const enrollment = myEnrollments.find(e => e.id === course.id);
        if (enrollment) {
            if (enrollment.grade && !['F', 'W'].includes(enrollment.grade)) return 'COMPLETED';
            return 'ENROLLED';
        }

        if (course.prerequisites && course.prerequisites.length > 0) {
            const allMet = course.prerequisites.every(p => {
                const preEnroll = myEnrollments.find(e => e.id === p.id);
                return preEnroll && preEnroll.grade && !['F', 'W'].includes(preEnroll.grade);
            });
            return allMet ? 'READY' : 'LOCKED';
        }
        return 'READY';
    };

    const getStatusText = (status) => {
        return t(status.toLowerCase());
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED': return '#10b981';
            case 'ENROLLED': return 'var(--color-primary)';
            case 'READY': return '#3b82f6';
            case 'LOCKED': return '#6b7280';
            default: return 'var(--color-text-muted)';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle size={14} />;
            case 'ENROLLED': return <Play size={14} />;
            case 'READY': return <BookOpen size={14} />;
            case 'LOCKED': return <Lock size={14} />;
            default: return null;
        }
    };

    if (loading) return <StudyPathSkeleton />;

    return (
        <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: 'var(--color-bg-dark)' }}>
            <Sidebar activePath="/study-path" />
            <main 
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{ 
                    flex: 1, 
                    padding: '2rem', 
                    overflowX: 'auto', 
                    position: 'relative', 
                    minWidth: 0,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: isDragging ? 'none' : 'auto'
                }}
            >
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ minWidth: 'fit-content' }}>
                    <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h1 style={{ fontSize: '2.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Layers className="text-primary" /> {t('study_path_title')}
                            </h1>
                            <p style={{ color: 'var(--color-text-muted)' }}>{t('cs_program')}</p>
                        </div>

                        
                        {/* Track Selector */}
                        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {tracks.map(trackItem => (
                                <button
                                    key={trackItem}
                                    onClick={() => setSelectedTrack(trackItem)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background: selectedTrack === trackItem ? 'var(--color-primary)' : 'transparent',
                                        color: selectedTrack === trackItem ? 'white' : 'var(--color-text-muted)',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    {trackItem === 'ALL' ? <Filter size={12} /> : null}
                                    {trackItem ? t(trackItem.toLowerCase()) : trackItem}
                                </button>
                            ))}
                        </div>
                    </header>

                    <div style={{ position: 'relative' }} ref={containerRef}>
                        {/* SVG Overlay for Prerequisites */}
                        <svg style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            width: '100%', 
                            height: '100%', 
                            pointerEvents: 'none',
                            zIndex: 0
                        }}>
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.2)" />
                                </marker>
                            </defs>
                            {lineCoords.map((line, i) => (
                                <line 
                                    key={`${selectedTrack}-${i}`}
                                    x1={line.startX} y1={line.startY} 
                                    x2={line.endX} y2={line.endY} 
                                    stroke={line.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.1)'} 
                                    strokeWidth="2"
                                    markerEnd="url(#arrowhead)"
                                />
                            ))}
                        </svg>

                        {/* Year Headers */}
                        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                            {yearGroups.map((year, idx) => (
                                <div key={idx} style={{ 
                                    flex: year.sems.length, 
                                    minWidth: `${year.sems.length * 240}px`,
                                    background: `linear-gradient(180deg, ${year.color}33, transparent)`,
                                    padding: '0.8rem',
                                    borderRadius: '12px 12px 0 0',
                                    textAlign: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.9rem',
                                    color: year.color,
                                    border: `1px solid ${year.color}33`,
                                    borderBottom: 'none'
                                }}>
                                    {year.label.startsWith('YEAR') ? `${t('year')} ${year.label.split(' ')[1]}` : t(year.label.toLowerCase())}
                                </div>
                            ))}
                        </div>

                        {/* Semester Grid */}
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            {semesters.map(sem => (
                                <div key={sem} style={{ minWidth: '240px', flex: 1 }}>
                                    <div style={{ 
                                        background: 'var(--color-bg-light)', 
                                        padding: '0.6rem', 
                                        textAlign: 'center', 
                                        borderRadius: '8px', 
                                        fontWeight: 700, 
                                        fontSize: '0.8rem',
                                        marginBottom: '1.5rem',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        color: 'var(--color-text-muted)'
                                    }}>
                                        {t('semester')} {sem}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                        <AnimatePresence mode="popLayout">
                                        {filteredCourses.filter(c => c.semester_number === sem).map(course => {
                                            const status = getCourseStatus(course);
                                            const color = getStatusColor(status);
                                            const isYearIneligible = parseInt(user?.yearOfStudy || 1) < (course.min_year || 1);
                                            return (
                                                <motion.div 
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    key={course.id}
                                                    ref={el => cardRefs.current[course.id] = el}
                                                    whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                                                    className="glass-panel course-card-inner"
                                                    style={{ 
                                                        padding: '1.2rem', 
                                                        borderLeft: `4px solid ${color}`,
                                                        position: 'relative',
                                                        zIndex: 1,
                                                        opacity: status === 'LOCKED' ? 0.6 : 1,
                                                        transition: 'all 0.3s ease',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        minHeight: '160px',
                                                        cursor: 'default'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: color, letterSpacing: '0.5px' }}>
                                                            {course.code}
                                                        </span>
                                                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {(status === 'ENROLLED' || status === 'COMPLETED') && <CheckCircle size={10} color="var(--color-primary)" />}
                                                            {course.credits} {t('credits_abbr')}
                                                        </span>
                                                    </div>
                                                    
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3, marginBottom: '0.8rem', flexGrow: 1 }}>
                                                        {course.name}
                                                    </div>

                                                    {course.min_year > 1 && (
                                                        <div style={{ 
                                                            fontSize: '0.7rem', 
                                                            color: isYearIneligible ? '#ef4444' : '#10b981', 
                                                            background: isYearIneligible ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            marginBottom: '0.8rem',
                                                            fontWeight: 700,
                                                            display: 'inline-block'
                                                        }}>
                                                            {t('min_year') || 'Min Year'}: {course.min_year}
                                                            {isYearIneligible && ` (${t('ineligible') || 'Ineligible'})`}
                                                        </div>
                                                    )}

                                                    {/* Schedule Info */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                                            <Clock size={12} className="text-primary" /> {course.schedule_time}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                                            <MapPin size={12} className="text-primary" /> {course.room}
                                                        </div>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                                        <div style={{ color: color, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            {getStatusIcon(status)}
                                                            {status === 'ENROLLED' ? (
                                                                <span style={{ background: 'rgba(242, 159, 5, 0.12)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', marginLeft: '4px', border: '1px solid rgba(242, 159, 5, 0.2)' }}>
                                                                    {t('enrolled')}
                                                                </span>
                                                            ) : getStatusText(status)}
                                                        </div>

                                                        {status === 'LOCKED' && course.prerequisites?.length > 0 && (
                                                            <div style={{ 
                                                                fontSize: '0.7rem', 
                                                                color: 'var(--color-primary)', 
                                                                marginTop: '8px',
                                                                padding: '6px',
                                                                background: 'rgba(242, 159, 5, 0.05)',
                                                                borderRadius: '4px',
                                                                border: '1px solid rgba(242, 159, 5, 0.1)',
                                                                lineHeight: 1.2,
                                                                fontWeight: 600
                                                            }}>
                                                                Prerequisite: {course.prerequisites.map(p => p.code).join(', ')}
                                                            </div>
                                                        )}

                                                        {status === 'READY' && (
                                                            <button 
                                                                onClick={() => handleEnroll(course.id)}
                                                                disabled={enrollingId === course.id || isYearIneligible}
                                                                style={{
                                                                    background: isYearIneligible ? '#6b7280' : 'var(--color-primary)',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    padding: '4px 8px',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 600,
                                                                    cursor: isYearIneligible ? 'not-allowed' : 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    transition: 'transform 0.2s',
                                                                    opacity: isYearIneligible ? 0.6 : 1
                                                                }}
                                                                title={isYearIneligible ? t('year_restricted') : ''}
                                                                onMouseEnter={e => !isYearIneligible && (e.currentTarget.style.transform = 'scale(1.05)')}
                                                                onMouseLeave={e => !isYearIneligible && (e.currentTarget.style.transform = 'scale(1)')}
                                                            >
                                                                {isYearIneligible ? t('year_restricted') : (enrollingId === course.id ? t('enrolling') : <><Send size={12} /> {t('enroll_btn')}</>)}
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
