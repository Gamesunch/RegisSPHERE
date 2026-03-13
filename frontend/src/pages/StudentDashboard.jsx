import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function StudentDashboard({ user, stats, todaySchedule, announcements }) {
    const { t } = useLanguage();
    const navigate = useNavigate();

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', paddingBottom: '2rem' }}>
            {/* Stats Cards */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.8rem' }}>
                <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('total_credits')}</h3>
                <div style={{ fontSize: '3.2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1 }} className="text-gradient">{stats.credits}</div>
                <p style={{ fontSize: '0.95rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '20px' }}>{t('active_badge')}</span> {t('this_semester')}
                </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.8rem' }}>
                <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('current_gpa')}</h3>
                <div style={{ fontSize: '3.2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1 }}>{stats.gpa}</div>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {t('based_on_graded_courses')}
                </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.8rem', background: 'var(--color-primary-dark)', color: 'white', border: 'none' }}>
                <h3 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('waitlisted_active')}</h3>
                <div style={{ fontSize: '3.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white', lineHeight: 1 }}>{stats.pending}</div>
                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)' }}>{t('pending_action')}</p>
            </motion.div>

            {/* Schedule / Main Section */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-panel" style={{ gridColumn: 'span 8', padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 600 }}>{t('today_schedule')}</h3>
                    <button 
                        className="btn" 
                        style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text)', padding: '0.5rem 1rem', fontSize: '0.9rem', border: '1px solid var(--glass-border)' }}
                        onClick={() => navigate('/my-courses?tab=timetable')}
                    >
                        {t('view_calendar')}
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {todaySchedule.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                            <Calendar size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                            <p>{t('no_classes_today')}</p>
                        </div>
                    ) : (
                        todaySchedule.map((course, idx) => (
                            <motion.div whileHover={{ scale: 1.01, backgroundColor: 'var(--color-surface-hover)' }} key={idx} style={{ display: 'flex', alignItems: 'center', padding: '1.2rem', background: 'var(--color-bg-light)', borderRadius: '16px', borderLeft: `5px solid ${course.color}`, cursor: 'pointer', transition: 'background 0.3s', border: '1px solid var(--glass-border)' }}>
                                <div style={{ minWidth: '110px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>{course.time}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '0.2rem', color: 'var(--color-text)' }}>{course.name}</div>
                                    <div style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>{course.prof}</div>
                                </div>
                                <div style={{ padding: '0.5rem 1rem', background: 'var(--color-bg-dark)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <MapPin size={16} /> {course.room}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>

            {/* Activity / Notifications */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-panel" style={{ gridColumn: 'span 4', padding: '2.5rem' }}>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '2rem', fontWeight: 600 }}>{t('uni_news')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem', maxHeight: '450px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {(!announcements || announcements.length === 0) ? (
                        <p style={{ color: 'var(--color-text-muted)' }}>{t('no_news_announcements')}</p>
                    ) : (
                        announcements.map((ann, idx) => {
                            const isGlobal = !ann.course_id;
                            const badgeColor = isGlobal ? 'var(--color-primary)' : 'var(--color-secondary)';
                            const badgeBg = isGlobal ? 'rgba(139,92,246,0.1)' : 'rgba(236,72,153,0.1)';
                            const badgeText = isGlobal ? t('uni_notice') : ann.course_code;

                            return (
                                <div key={idx} style={{ paddingBottom: '1.5rem', borderBottom: idx !== announcements.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                                    <div style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.8rem', color: badgeColor, background: badgeBg, padding: '0.3rem 0.8rem', borderRadius: '50px' }}>
                                        {badgeText}
                                    </div>
                                    <div style={{ fontSize: '1.15rem', marginBottom: '0.4rem', fontWeight: 500 }}>{ann.title}</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{ann.content}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <Calendar size={14} /> {new Date(ann.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </motion.div>
        </div>
    );
}
