import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AdminDashboard({ user, token, adminPhase, setAdminPhase }) {
    const { t } = useLanguage();
    const [demandData, setDemandData] = useState([]);
    const [confirmPhaseModal, setConfirmPhaseModal] = useState({ show: false, newPhase: null });
    const [capacityModal, setCapacityModal] = useState({ show: false, course: null, newCapacity: '' });
    const [phaseUpdating, setPhaseUpdating] = useState(false);
    const [capacityUpdating, setCapacityUpdating] = useState(false);
    const [stats, setStats] = useState({ totalCourses: 0, overSubscribed: 0 });
    const [newsTitle, setNewsTitle] = useState('');
    const [newsContent, setNewsContent] = useState('');
    const [newsPosting, setNewsPosting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchDemand = async () => {
            try {
                const demandRes = await fetch(`${API_BASE_URL}/api/admin/demand`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (demandRes.ok) {
                    const data = await demandRes.json();
                    setDemandData(data);

                    let overSubscribedCount = 0;
                    data.forEach(course => {
                        if (parseInt(course.pre_enrolled_count) > parseInt(course.capacity)) {
                            overSubscribedCount++;
                        }
                    });

                    setStats({
                        totalCourses: data.length,
                        overSubscribed: overSubscribedCount
                    });
                }
            } catch (error) {
                console.error("Failed to fetch demand data", error);
            }
        };
        fetchDemand();
    }, [token]);

    const executePhaseChange = async () => {
        const { newPhase } = confirmPhaseModal;
        if (!newPhase || phaseUpdating) return;

        setPhaseUpdating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/phase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ phase: newPhase })
            });

            if (res.ok) {
                setAdminPhase(newPhase);
                setConfirmPhaseModal({ show: false, newPhase: null });
                window.location.reload();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update phase');
                setConfirmPhaseModal({ show: false, newPhase: null });
            }
        } catch (error) {
            console.error('Error updating phase:', error);
            alert('Server error updating phase. Please try again.');
            setConfirmPhaseModal({ show: false, newPhase: null });
        } finally {
            setPhaseUpdating(false);
        }
    };

    const handleCapacityUpdate = async () => {
        const { course, newCapacity } = capacityModal;
        if (!course || !newCapacity || capacityUpdating) return;

        setCapacityUpdating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/courses/${course.id}/capacity`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ capacity: parseInt(newCapacity) })
            });

            if (res.ok) {
                // Refresh demand data
                const demandRes = await fetch(`${API_BASE_URL}/api/admin/demand`, { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                if (demandRes.ok) {
                    setDemandData(await demandRes.json());
                }
                setCapacityModal({ show: false, course: null, newCapacity: '' });
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update capacity');
            }
        } catch (error) {
            console.error('Error updating capacity:', error);
            alert('Failed to update capacity');
        } finally {
            setCapacityUpdating(false);
        }
    };

    const handlePostNews = async (e) => {
        e.preventDefault();
        setNewsPosting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/announcements/university`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: newsTitle, content: newsContent })
            });
            if (res.ok) {
                alert(t('news_posted_success'));
                setNewsTitle('');
                setNewsContent('');
            } else {
                const data = await res.json();
                alert(data.error || t('news_post_error'));
            }
        } catch (error) {
            console.error('Error posting news:', error);
            alert(t('news_post_error'));
        } finally {
            setNewsPosting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                <button
                    onClick={() => setActiveTab('overview')}
                    style={{
                        background: 'transparent', border: 'none', padding: '0.5rem 1rem', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer',
                        color: activeTab === 'overview' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        borderBottom: activeTab === 'overview' ? '3px solid var(--color-primary)' : '3px solid transparent',
                        transition: 'all 0.2s'
                    }}
                >
                    {t('overview_demand')}
                </button>
                <button
                    onClick={() => setActiveTab('news')}
                    style={{
                        background: 'transparent', border: 'none', padding: '0.5rem 1rem', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer',
                        color: activeTab === 'news' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        borderBottom: activeTab === 'news' ? '3px solid var(--color-primary)' : '3px solid transparent',
                        transition: 'all 0.2s'
                    }}
                >
                    {t('uni_news_tab')}
                </button>
            </div>

            {activeTab === 'overview' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
                    {/* Admin Stats Cards */}
                    <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.8rem' }}>
                        <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('total_courses')}</h3>
                        <div style={{ fontSize: '3.2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1 }} className="text-gradient">{stats.totalCourses}</div>
                        <p style={{ fontSize: '0.95rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '20px' }}>Active</span> {t('active_in_db')}
                        </p>
                    </div>

                    <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.8rem' }}>
                        <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('current_phase')}</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.2, color: 'var(--color-primary)' }}>
                            {adminPhase === 'PRE_ENROLLMENT' ? t('pre_enrollment') : (adminPhase === 'ENROLLMENT' ? t('active_enrollment') : t('closed'))}
                        </div>
                        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {t('system_enroll_state')}
                        </p>
                    </div>

                    <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '1.8rem', background: stats.overSubscribed > 0 ? 'rgba(239, 68, 68, 0.9)' : 'var(--color-primary-dark)', color: 'white', border: 'none' }}>
                        <h3 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('oversubscribed')}</h3>
                        <div style={{ fontSize: '3.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white', lineHeight: 1 }}>{stats.overSubscribed}</div>
                        <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)' }}>{t('need_review')}</p>
                    </div>

                    {/* Admin Panel Controls Core */}
                    <div className="glass-panel" style={{ gridColumn: 'span 12', padding: '2.5rem', border: '1px solid var(--color-primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-primary)' }}>{t('admin_controls')}</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{t('admin_controls_desc')}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                {/* Course Search Bar */}
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="text" 
                                        placeholder={t('search_courses') || "Search courses..."}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            padding: '0.6rem 1rem 0.6rem 2.5rem',
                                            borderRadius: '8px',
                                            background: 'var(--color-bg-light)',
                                            color: 'var(--color-text)',
                                            border: '1px solid var(--glass-border)',
                                            outline: 'none',
                                            width: '250px',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                    <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600 }}>{t('modify_phase')}</span>
                                    <select
                                        value={adminPhase}
                                        onChange={(e) => {
                                            const newPhase = e.target.value;
                                            setConfirmPhaseModal({ show: true, newPhase });
                                        }}
                                        style={{ padding: '0.6rem 1rem', borderRadius: '8px', background: 'var(--color-bg-light)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        <option value="PRE_ENROLLMENT">{t('pre_enrollment')}</option>
                                        <option value="ENROLLMENT">{t('active_enrollment')}</option>
                                        <option value="CLOSED">{t('closed')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <h4 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1.1rem' }}>{t('demand_tracking')}</h4>
                        <div style={{ overflowX: 'auto', background: 'var(--color-bg-light)', borderRadius: '12px', padding: '1rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '0.8rem' }}>{t('course')}</th>
                                        <th style={{ padding: '0.8rem', textAlign: 'center' }}>{t('capacity')}</th>
                                        <th style={{ padding: '0.8rem', textAlign: 'center' }}>{t('officially_enrolled')}</th>
                                        <th style={{ padding: '0.8rem', textAlign: 'center' }}>{t('waitlisted')}</th>
                                        <th style={{ padding: '0.8rem', textAlign: 'center' }}>{t('enrolled_badge')}</th>
                                        {/* Changed Action to suggest future course management */}
                                        <th style={{ padding: '0.8rem', textAlign: 'right' }}>{t('action')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {demandData
                                        .filter(course => 
                                            course.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                            course.name.toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map(course => {
                                        const c_cap = parseInt(course.capacity);
                                        const pre_en = parseInt(course.pre_enrolled_count);
                                        const isBottleneck = pre_en > c_cap;
                                        return (
                                            <tr key={course.id} style={{ borderBottom: '1px solid var(--glass-border)', background: isBottleneck ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                                                <td style={{ padding: '0.8rem', fontWeight: 600 }}>{course.code} - {course.name}</td>
                                                <td style={{ padding: '0.8rem', textAlign: 'center' }}>{course.capacity}</td>
                                                <td style={{ padding: '0.8rem', textAlign: 'center', color: isBottleneck ? '#ef4444' : 'var(--color-text)', fontWeight: isBottleneck ? 700 : 500 }}>
                                                    {course.pre_enrolled_count} {isBottleneck && '⚠️'}
                                                </td>
                                                <td style={{ padding: '0.8rem', textAlign: 'center' }}>{course.enrolled_count}</td>
                                                <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => setCapacityModal({ 
                                                            show: true, 
                                                            course: course, 
                                                            newCapacity: course.capacity.toString() 
                                                        })}
                                                        style={{ padding: '0.4rem 0.8rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                        {t('edit_cap')}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'news' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
                    {/* University News Form */}
                    <div className="glass-panel" style={{ gridColumn: 'span 12', padding: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>{t('post_news')}</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>{t('post_news_desc')}</p>
                        <form onSubmit={handlePostNews}>
                            <div style={{ marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder={t('news_headline')}
                                    value={newsTitle}
                                    onChange={(e) => setNewsTitle(e.target.value)}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <textarea
                                    placeholder={t('news_content')}
                                    value={newsContent}
                                    onChange={(e) => setNewsContent(e.target.value)}
                                    className="input-field"
                                    rows="4"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={newsPosting} style={{ padding: '0.8rem 2rem' }}>
                                {newsPosting ? t('enrolling') : t('publish_news')}
                            </button>
                        </form>
                    </div>
                </motion.div>
            )}

            {/* Confirmation Modal for Phase Change */}
            {confirmPhaseModal.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel"
                        style={{ padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <Settings size={30} color="#ef4444" />
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text)' }}>{t('confirm_phase_change')}</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.5 }}>
                            {t('confirm_phase_desc').replace('{phase}', confirmPhaseModal.newPhase)}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn" onClick={() => setConfirmPhaseModal({ show: false, newPhase: null })}
                                style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--color-border-light)', color: 'var(--color-text)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                                {t('cancel')}
                            </button>
                            <button className="btn" onClick={executePhaseChange} disabled={phaseUpdating}
                                style={{ flex: 1, padding: '0.8rem', background: '#ef4444', border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)', opacity: phaseUpdating ? 0.7 : 1 }}>
                                {phaseUpdating ? '...' : t('confirm')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
            {/* Capacity Update Modal */}
            {capacityModal.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel"
                        style={{ padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(var(--color-primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <Settings size={30} color="var(--color-primary)" />
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                            {t('edit_cap')}
                        </h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                            {capacityModal.course.code} - {capacityModal.course.name}
                        </p>
                        
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)', textAlign: 'left' }}>
                                {t('capacity')}
                            </label>
                            <input 
                                type="number" 
                                value={capacityModal.newCapacity}
                                onChange={(e) => setCapacityModal({ ...capacityModal, newCapacity: e.target.value })}
                                style={{
                                    width: '100%', padding: '0.8rem', borderRadius: '10px',
                                    background: 'var(--color-bg-light)', color: 'var(--color-text)',
                                    border: '1px solid var(--glass-border)', fontSize: '1.1rem', fontWeight: 600,
                                    textAlign: 'center', outline: 'none'
                                }}
                                autoFocus
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn" onClick={() => setCapacityModal({ show: false, course: null, newCapacity: '' })}
                                style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--color-border-light)', color: 'var(--color-text)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                                {t('cancel')}
                            </button>
                            <button className="btn" onClick={handleCapacityUpdate} disabled={capacityUpdating}
                                style={{ flex: 1, padding: '0.8rem', background: 'var(--color-primary)', border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 10px rgba(var(--color-primary-rgb), 0.3)', opacity: capacityUpdating ? 0.7 : 1 }}>
                                {capacityUpdating ? '...' : t('confirm')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
