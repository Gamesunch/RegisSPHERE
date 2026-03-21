import React, { useEffect, useState, useRef, useMemo } from 'react';
import { API_BASE_URL } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, Lock, Play, Layers, Send, Clock, MapPin, Filter, Tag, ChevronDown, ChevronUp, Briefcase, GraduationCap, Globe, Shield, Gamepad2, Cpu, Brain, BookMarked, LayoutGrid, Eye } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const API_BASE = API_BASE_URL;
import { useLanguage } from '../context/LanguageContext';
import { StudyPathSkeleton } from '../components/SkeletonLoader';

// Professional track definitions matching reference diagram
const TRACK_ICONS = {
    ALL: LayoutGrid,
    FULLSTACK: Globe,
    SECURITY_NETWORK: Shield,
    GAME_GRAPHIC: Gamepad2,
    IOT_ROBOT: Cpu,
    AI: Brain,
    OUTSIDE: BookMarked,
};

const PROFESSIONAL_TRACKS = [
    { key: 'ALL', label: 'All Tracks', color: '#f29f05' },
    { key: 'FULLSTACK', label: 'Full-Stack Track', color: '#22c55e' },
    { key: 'SECURITY_NETWORK', label: 'Security & Network', color: '#ef4444' },
    { key: 'GAME_GRAPHIC', label: 'Game & Graphic', color: '#a855f7' },
    { key: 'IOT_ROBOT', label: 'IoT & Robot', color: '#14b8a6' },
    { key: 'AI', label: 'AI Track', color: '#3b82f6' },
    { key: 'OUTSIDE', label: 'Outside of Track', color: '#6b7280' },
];

// Number of Professional Elective slots per semester (from curriculum reference)
const PROF_ELECTIVE_SLOTS = {
    // Co-op plan
    COOP: { 3: 1, 5: 4, 6: 3, 8: 2 },
    // Regular plan  
    REGULAR: { 3: 1, 5: 4, 6: 3, 8: 2 },
};

export default function StudyPath() {
    const { t } = useLanguage();
    const [courses, setCourses] = useState([]);
    const [myEnrollments, setMyEnrollments] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState(null);
    const [selectedTrack, setSelectedTrack] = useState('ALL');
    const [programPlan, setProgramPlan] = useState('COOP'); // COOP or REGULAR
    const [expandedElectives, setExpandedElectives] = useState({});
    const [activeArrowCourseId, setActiveArrowCourseId] = useState(null);
    const [lineCoords, setLineCoords] = useState([]);
    
    const containerRef = useRef(null);
    const cardRefs = useRef({});

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
        fetchData();
    }, []);

    // Filter courses based on program plan and selected professional track
    const filteredCourses = useMemo(() => {
        return courses.filter(c => {
            // For CORE track courses, filter by program plan
            if (c.track === 'COOP' && programPlan !== 'COOP') return false;
            if (c.track === 'REGULAR' && programPlan !== 'REGULAR') return false;

            // For professional electives: when a specific track is selected, only show that track's courses
            if (c.course_category === 'PROFESSIONAL_ELECTIVE') {
                if (selectedTrack !== 'ALL' && c.track !== selectedTrack) return false;
            }
            
            return true;
        });
    }, [courses, selectedTrack, programPlan]);

    useEffect(() => {
        if (!loading && filteredCourses.length > 0) {
            const timer = setTimeout(calculateLines, 300);
            window.addEventListener('resize', calculateLines);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', calculateLines);
            };
        }
    }, [loading, filteredCourses, myEnrollments, expandedElectives]);

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
        if (e.target.closest('button') || e.target.closest('.course-card-inner') || e.target.closest('.elective-dropdown')) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const calculateLines = () => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newLines = [];

        // Find the lowest point of any card in the grid to route skipped-semester lines under them
        let maxBottom = 0;
        Object.values(cardRefs.current).forEach(el => {
            if (el) {
                const rect = el.getBoundingClientRect();
                const bottom = rect.bottom - containerRect.top;
                if (bottom > maxBottom) maxBottom = bottom;
            }
        });

        let bottomRoutes = 0;
        let sameColRoutes = 0;

        filteredCourses.forEach(course => {
            if (course.prerequisites && Array.isArray(course.prerequisites) && course.prerequisites.length > 0) {
                const targetEl = cardRefs.current[course.id];
                if (!targetEl) return;
                const targetRect = targetEl.getBoundingClientRect();

                course.prerequisites.forEach(pre => {
                    const fullPre = courses.find(c => c.id === pre.id);
                    if (!fullPre) return;

                    const sourceEl = cardRefs.current[pre.id];
                    if (!sourceEl) return;
                    const sourceRect = sourceEl.getBoundingClientRect();

                    const endX = targetRect.left - containerRect.left;
                    const endY = targetRect.top + targetRect.height / 2 - containerRect.top;
                    
                    let pathD = "";
                    const semDiff = course.semester_number - fullPre.semester_number;

                    if (semDiff === 1) {
                        // Adjacent semester: standard H -> V -> H routing
                        const startX = sourceRect.right - containerRect.left;
                        const startY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
                        if (Math.abs(startY - endY) < 5) {
                            pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
                        } else {
                            const turnX = startX + 16;
                            pathD = `M ${startX} ${startY} H ${turnX} V ${endY} H ${endX}`;
                        }
                    } else if (semDiff > 1) {
                        // Skips semesters: use standard orthogonal routing and let it pass behind opaque cards
                        const startX = sourceRect.right - containerRect.left;
                        const startY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
                        const turnX = startX + 16 + (course.id % 20); // staggered turn in the first gap
                        pathD = `M ${startX} ${startY} H ${turnX} V ${endY} H ${endX}`;
                    } else if (semDiff === 0) {
                        // Same semester: route back through the left gap
                        const startX = sourceRect.left - containerRect.left;
                        const startY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
                        sameColRoutes++;
                        const turnX = startX - 16 - (sameColRoutes * 4);
                        pathD = `M ${startX} ${startY} H ${turnX} V ${endY} H ${endX}`;
                    } else {
                        // Fallback
                        const startX = sourceRect.right - containerRect.left;
                        const startY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
                        pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
                    }

                    newLines.push({ 
                        pathD, 
                        status: getCourseStatus(pre),
                        sourceId: fullPre.id,
                        targetId: course.id 
                    });
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

    const getCategoryStyle = (category) => {
        switch (category) {
            case 'PROFESSIONAL_ELECTIVE': return { bg: 'rgba(59, 130, 246, 0.08)', border: '#3b82f6', text: '#60a5fa', label: 'Professional Elective' };
            case 'LANGUAGE_ELECTIVE': return { bg: 'rgba(251, 146, 60, 0.08)', border: '#f97316', text: '#fb923c', label: 'Language Elective' };
            case 'SOCIAL_SCIENCE_ELECTIVE': return { bg: 'rgba(168, 85, 247, 0.08)', border: '#a855f7', text: '#c084fc', label: 'Social Science Elective' };
            case 'SCIENCE_MATH_ELECTIVE': return { bg: 'rgba(34, 197, 94, 0.08)', border: '#22c55e', text: '#4ade80', label: 'Science & Math Elective' };
            case 'HUMANITIES_ELECTIVE': return { bg: 'rgba(236, 72, 153, 0.08)', border: '#ec4899', text: '#f472b6', label: 'Humanities Elective' };
            case 'SPORT_ELECTIVE': return { bg: 'rgba(20, 184, 166, 0.08)', border: '#14b8a6', text: '#2dd4bf', label: 'Sport & Recreation' };
            case 'FREE_ELECTIVE': return { bg: 'rgba(156, 163, 175, 0.08)', border: '#9ca3af', text: '#d1d5db', label: 'Free Elective' };
            default: return null;
        }
    };

    const getTrackStyle = (trackKey) => {
        const track = PROFESSIONAL_TRACKS.find(t => t.key === trackKey);
        return track || PROFESSIONAL_TRACKS[0];
    };

    const isElective = (course) => course.course_category && course.course_category !== 'CORE';
    const isProfessionalElective = (course) => course.course_category === 'PROFESSIONAL_ELECTIVE';

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

    const getStatusText = (status) => t(status.toLowerCase());

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

    const toggleElectiveExpand = (key) => {
        setExpandedElectives(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Group elective courses in a semester for collapsible display
    const getElectiveGroups = (semCourses) => {
        const groups = {};
        semCourses.filter(c => isProfessionalElective(c)).forEach(c => {
            if (!groups['PROFESSIONAL_ELECTIVE']) groups['PROFESSIONAL_ELECTIVE'] = [];
            groups['PROFESSIONAL_ELECTIVE'].push(c);
        });
        return groups;
    };

    // Render a single course card
    const renderCourseCard = (course) => {
        const status = getCourseStatus(course);
        const color = getStatusColor(status);
        const isYearIneligible = parseInt(user?.yearOfStudy || 1) < (course.min_year || 1);
        const catStyle = getCategoryStyle(course.course_category);
        const electiveStyle = isElective(course);
        const trackStyle = isProfessionalElective(course) ? getTrackStyle(course.track) : null;

        return (
            <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={course.id}
                ref={el => cardRefs.current[course.id] = el}
                whileHover={{ y: -3, boxShadow: '0 8px 20px -5px rgba(0,0,0,0.3)' }}
                className="course-card-inner"
                style={{ 
                    padding: '1rem', 
                    borderRadius: '12px',
                    borderLeft: `4px solid ${electiveStyle ? (catStyle?.border || color) : color}`,
                    borderStyle: electiveStyle ? 'dashed' : 'solid',
                    borderWidth: electiveStyle ? '1px' : '1px',
                    borderLeftWidth: '4px',
                    borderColor: electiveStyle ? (catStyle?.border || 'rgba(255,255,255,0.1)') + '55' : 'rgba(255,255,255,0.05)',
                    borderLeftColor: electiveStyle ? (catStyle?.border || color) : color,
                    backgroundColor: 'var(--color-bg-light)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    position: 'relative',
                    zIndex: 1,
                    opacity: status === 'LOCKED' ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '120px',
                    cursor: 'default'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: trackStyle ? trackStyle.color : color, letterSpacing: '0.5px' }}>
                        {course.code}
                    </span>
                    <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {course.credits} cr
                    </span>
                </div>
                
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3, marginBottom: '0.4rem', flexGrow: 1 }}>
                    {course.name}
                </div>

                {/* Track badge for professional electives */}
                {trackStyle && (
                    <div style={{
                        fontSize: '0.55rem',
                        fontWeight: 700,
                        color: trackStyle.color,
                        background: trackStyle.color + '15',
                        border: `1px solid ${trackStyle.color}33`,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        marginBottom: '0.4rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase',
                        width: 'fit-content'
                    }}>
                        {React.createElement(TRACK_ICONS[course.track] || LayoutGrid, { size: 9 })} {trackStyle.label}
                    </div>
                )}

                {/* Non-professional elective badge */}
                {electiveStyle && !isProfessionalElective(course) && catStyle && (
                    <div style={{
                        fontSize: '0.55rem',
                        fontWeight: 700,
                        color: catStyle.text,
                        background: catStyle.bg,
                        border: `1px solid ${catStyle.border}33`,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        marginBottom: '0.4rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase',
                        width: 'fit-content'
                    }}>
                        <Tag size={8} />
                        {catStyle.label}
                    </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ color: color, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                            {getStatusIcon(status)}
                            {status === 'ENROLLED' ? (
                                <span style={{ background: 'rgba(242, 159, 5, 0.12)', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(242, 159, 5, 0.2)' }}>
                                    {t('enrolled')}
                                </span>
                            ) : getStatusText(status)}
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveArrowCourseId(activeArrowCourseId === course.id ? null : course.id);
                            }}
                            title="Toggle prerequisite arrows"
                            style={{
                                background: activeArrowCourseId === course.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                border: `1px solid ${activeArrowCourseId === course.id ? 'rgba(59, 130, 246, 0.4)' : 'transparent'}`,
                                color: activeArrowCourseId === course.id ? '#3b82f6' : 'rgba(255,255,255,0.2)',
                                borderRadius: '4px',
                                padding: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Eye size={13} />
                        </button>
                    </div>

                    {status === 'READY' && (
                        <button 
                            onClick={() => handleEnroll(course.id)}
                            disabled={enrollingId === course.id || isYearIneligible}
                            style={{
                                background: isYearIneligible ? '#6b7280' : 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '3px 7px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                cursor: isYearIneligible ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                opacity: isYearIneligible ? 0.6 : 1
                            }}
                        >
                            {isYearIneligible ? t('year_restricted') : (enrollingId === course.id ? '...' : <><Send size={10} /> {t('enroll_btn')}</>)}
                        </button>
                    )}
                </div>
            </motion.div>
        );
    };

    // Render a collapsible elective group (Professional Elective dropdown)
    const renderElectiveGroup = (sem, electiveCourses) => {
        const groupKey = `prof_elective_${sem}`;
        const isExpanded = expandedElectives[groupKey];
        const availableCount = electiveCourses.length;
        const slotsNeeded = PROF_ELECTIVE_SLOTS[programPlan]?.[sem] || 0;
        
        if (availableCount === 0) return null;

        return (
            <div key={groupKey} className="elective-dropdown" style={{ marginBottom: '0.5rem' }}>
                <motion.div
                    whileHover={{ y: -2 }}
                    onClick={() => toggleElectiveExpand(groupKey)}
                    className="glass-panel"
                    style={{
                        padding: '0.8rem 1rem',
                        borderLeft: '4px solid #3b82f6',
                        borderStyle: 'dashed',
                        borderWidth: '1px',
                        borderLeftWidth: '4px',
                        borderColor: '#3b82f644',
                        borderLeftColor: '#3b82f6',
                        background: 'rgba(59, 130, 246, 0.06)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        minHeight: '80px',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3b82f6', letterSpacing: '0.5px', marginBottom: '4px' }}>
                            040613xxx
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3 }}>
                            {slotsNeeded > 1 ? `${slotsNeeded} × ` : ''}Professional Elective Course
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                            {slotsNeeded > 0 && (
                                <span style={{ 
                                    fontSize: '0.6rem', 
                                    fontWeight: 700, 
                                    color: '#60a5fa', 
                                    background: 'rgba(59, 130, 246, 0.12)', 
                                    padding: '2px 7px', 
                                    borderRadius: '4px',
                                    border: '1px solid rgba(59, 130, 246, 0.2)'
                                }}>
                                    Enroll {slotsNeeded} course{slotsNeeded > 1 ? 's' : ''}
                                </span>
                            )}
                            <span style={{ fontSize: '0.58rem', color: 'var(--color-text-muted)' }}>
                                {availableCount} available • 3 cr each
                            </span>
                        </div>
                    </div>
                    <div style={{ color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </motion.div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: 'hidden', marginTop: '0.5rem' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(59, 130, 246, 0.2)' }}>
                                {electiveCourses.map(course => renderCourseCard(course))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
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
                    padding: '1.5rem', 
                    overflowX: 'auto', 
                    position: 'relative', 
                    minWidth: 0,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: isDragging ? 'none' : 'auto'
                }}
            >
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ minWidth: 'fit-content' }}>
                    <header style={{ marginBottom: '1.5rem' }}>
                        {/* Title Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Layers className="text-primary" /> {t('study_path_title')}
                                </h1>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{t('cs_program')}</p>
                            </div>

                            {/* Program Plan Toggle: Co-op vs Regular */}
                            <div style={{ 
                                display: 'flex', 
                                gap: '4px', 
                                background: 'rgba(255,255,255,0.05)', 
                                padding: '4px', 
                                borderRadius: '10px', 
                                border: '1px solid rgba(255,255,255,0.1)' 
                            }}>
                                <button
                                    onClick={() => setProgramPlan('COOP')}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: programPlan === 'COOP' ? '1px solid #22c55e' : '1px solid transparent',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background: programPlan === 'COOP' ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                                        color: programPlan === 'COOP' ? '#4ade80' : 'var(--color-text-muted)',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Briefcase size={14} />
                                    Co-op Program
                                </button>
                                <button
                                    onClick={() => setProgramPlan('REGULAR')}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: programPlan === 'REGULAR' ? '1px solid #a855f7' : '1px solid transparent',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background: programPlan === 'REGULAR' ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
                                        color: programPlan === 'REGULAR' ? '#c084fc' : 'var(--color-text-muted)',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <GraduationCap size={14} />
                                    Regular Program
                                </button>
                            </div>
                        </div>

                        {/* Professional Track Filter */}
                        <div style={{ 
                            display: 'flex', 
                            gap: '5px', 
                            background: 'rgba(255,255,255,0.03)', 
                            padding: '5px', 
                            borderRadius: '10px', 
                            border: '1px solid rgba(255,255,255,0.08)',
                            flexWrap: 'wrap'
                        }}>
                            {PROFESSIONAL_TRACKS.map(track => (
                                <button
                                    key={track.key}
                                    onClick={() => setSelectedTrack(track.key)}
                                    style={{
                                        padding: '5px 10px',
                                        borderRadius: '7px',
                                        border: selectedTrack === track.key ? `1px solid ${track.color}` : '1px solid transparent',
                                        fontSize: '0.68rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background: selectedTrack === track.key ? track.color + '18' : 'transparent',
                                        color: selectedTrack === track.key ? track.color : 'var(--color-text-muted)',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {React.createElement(TRACK_ICONS[track.key] || LayoutGrid, { size: 13 })}
                                    {track.label}
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
                            zIndex: activeArrowCourseId ? 10 : 0,
                            transition: 'z-index 0.3s'
                        }}>
                            <defs>
                                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                                    <polygon points="0 0, 8 3, 0 6" fill="#f29f05" />
                                </marker>
                                <marker id="arrowhead-green" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                                    <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
                                </marker>
                                <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                                    <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
                                </marker>
                            </defs>
                            {lineCoords.map((line, i) => {
                                const isConnected = activeArrowCourseId && (line.sourceId === activeArrowCourseId || line.targetId === activeArrowCourseId);
                                
                                if (activeArrowCourseId && !isConnected) return null;

                                const isCompleted = line.status === 'COMPLETED';
                                let strokeColor = isCompleted ? '#10b981' : '#f29f05';
                                let markerRef = isCompleted ? 'url(#arrowhead-green)' : 'url(#arrowhead)';
                                
                                if (isConnected) {
                                    strokeColor = '#3b82f6'; // Bright blue for active connections
                                    markerRef = 'url(#arrowhead-active)';
                                }

                                const opacity = isConnected ? 1 : 0.4;
                                const width = isConnected ? 2.5 : 1.5;

                                return (
                                    <path
                                        key={`${selectedTrack}-${programPlan}-${i}`}
                                        d={line.pathD}
                                        fill="none"
                                        stroke={strokeColor}
                                        strokeWidth={width}
                                        strokeOpacity={opacity}
                                        markerEnd={markerRef}
                                        style={{ transition: 'all 0.3s ease' }}
                                    />
                                );
                            })}
                        </svg>

                        {/* Year Headers */}
                        <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '0.8rem' }}>
                            {yearGroups.map((year, idx) => (
                                <div key={idx} style={{ 
                                    flex: year.sems.length, 
                                    minWidth: `${year.sems.length * 240}px`,
                                    background: `linear-gradient(180deg, ${year.color}33, transparent)`,
                                    padding: '0.6rem',
                                    borderRadius: '10px 10px 0 0',
                                    textAlign: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    color: year.color,
                                    border: `1px solid ${year.color}33`,
                                    borderBottom: 'none'
                                }}>
                                    {year.label.startsWith('YEAR') ? `${t('year')} ${year.label.split(' ')[1]}` : t(year.label.toLowerCase())}
                                </div>
                            ))}
                        </div>

                        {/* Semester Grid */}
                        <div style={{ display: 'flex', gap: '2.5rem' }}>
                            {semesters.map(sem => {
                                const semCourses = filteredCourses.filter(c => c.semester_number === sem);
                                const coreSemCourses = semCourses.filter(c => !isProfessionalElective(c));
                                const profElectiveCourses = semCourses.filter(c => isProfessionalElective(c));

                                // Determine if we should collapse professional electives
                                const shouldCollapse = selectedTrack === 'ALL' && profElectiveCourses.length > 2;

                                return (
                                    <div key={sem} style={{ minWidth: '220px', flex: 1 }}>
                                        <div style={{ 
                                            background: 'var(--color-bg-light)', 
                                            padding: '0.5rem', 
                                            textAlign: 'center', 
                                            borderRadius: '6px', 
                                            fontWeight: 700, 
                                            fontSize: '0.75rem',
                                            marginBottom: '1rem',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            color: 'var(--color-text-muted)'
                                        }}>
                                            {t('semester')} {sem}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            <AnimatePresence mode="popLayout">
                                                {/* Core + non-professional-elective courses */}
                                                {coreSemCourses.map(course => renderCourseCard(course))}

                                                {/* Professional electives: collapse or expand */}
                                                {shouldCollapse ? (
                                                    renderElectiveGroup(sem, profElectiveCourses)
                                                ) : (
                                                    profElectiveCourses.map(course => renderCourseCard(course))
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
