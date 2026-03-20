import React, { useEffect, useState, useRef } from 'react';
import { API_BASE_URL } from '../config';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Users, Settings as SettingsIcon, LogOut, Camera, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Sidebar from '../components/Sidebar';
import { SettingsPageSkeleton } from '../components/SkeletonLoader';

const API_BASE = API_BASE_URL;

export default function Settings() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [bio, setBio] = useState('');
    const [yearOfStudy, setYearOfStudy] = useState('');
    const [profilePictureUrl, setProfilePictureUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Fetch profile from API
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    setBio(data.bio || '');
                    setYearOfStudy(data.yearOfStudy || '');
                    setProfilePictureUrl(data.profilePictureUrl || '');
                } else {
                    console.error('Failed to fetch profile');
                    // Fallback to localStorage
                    const userStored = JSON.parse(localStorage.getItem('user'));
                    setUser(userStored);
                    setBio(userStored?.bio || '');
                    setYearOfStudy(userStored?.yearOfStudy || '');
                    setProfilePictureUrl(userStored?.profilePictureUrl || '');
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
                const userStored = JSON.parse(localStorage.getItem('user'));
                setUser(userStored);
            }
        };
        fetchProfile();
    }, [navigate]);

    const handleSaveProfile = async () => {
        setSaving(true);
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ bio, yearOfStudy })
            });
            if (res.ok) {
                const data = await res.json();
                setMessage(t('saved'));
                // Update localStorage with new data
                const stored = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({ 
                    ...stored, 
                    bio: data.user.bio
                }));
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            console.error('Error saving profile:', err);
            setMessage(t('error_saving') || 'Error saving');
        }
        setSaving(false);
    };

    const handlePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('profilePicture', file);

            const res = await fetch(`${API_BASE}/api/profile/picture`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setProfilePictureUrl(data.profilePictureUrl);
                // Update localStorage
                const stored = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({ ...stored, profilePictureUrl: data.profilePictureUrl }));
                setMessage(t('upload_success'));
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(t('upload_error'));
            }
        } catch (err) {
            console.error('Error uploading picture:', err);
            setMessage(t('upload_error'));
        }
        setUploading(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return <SettingsPageSkeleton />;

    const avatarLetter = user.firstName ? user.firstName[0].toUpperCase() : 'U';
    const fullPictureUrl = profilePictureUrl 
        ? (profilePictureUrl.startsWith('http') ? profilePictureUrl : `${API_BASE}${profilePictureUrl}`) 
        : '';

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-dark)', overflow: 'hidden' }}>

            {/* Sidebar unified component */}
            <Sidebar activePath="/settings" />

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

                {/* Header */}
                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}
                >
                    <div>
                        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.3rem', fontWeight: 600 }}>{t('settings')}</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>{t('personal_settings_desc')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>

                        {fullPictureUrl ? (
                            <img src={fullPictureUrl} alt="Profile" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 10px rgba(217, 121, 4, 0.3)' }} />
                        ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(217, 121, 4, 0.3)', cursor: 'pointer' }}>
                                {avatarLetter}
                            </div>
                        )}
                    </div>
                </motion.header>

                {/* Status message */}
                {message && (
                    <div style={{ marginBottom: '1rem', padding: '0.8rem 1.2rem', borderRadius: '10px', background: message.includes('Error') || message.includes('failed') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: message.includes('Error') || message.includes('failed') ? '#ef4444' : '#10b981', fontWeight: 500 }}>
                        {message}
                    </div>
                )}

                {/* Settings Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem', paddingBottom: '2rem' }}>

                    {/* Editable Profile Section */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel" style={{ padding: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            {t('personal_info')}
                        </h3>

                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                {fullPictureUrl ? (
                                    <img src={fullPictureUrl} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold' }}>
                                        {avatarLetter}
                                    </div>
                                )}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="glass-panel"
                                    style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--color-bg-light)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--color-text)' }}
                                >
                                    <Camera size={18} />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={handlePictureUpload}
                                    style={{ display: 'none' }}
                                />
                            </div>
                            <div>
                                <h4 style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '0.3rem' }}>{t('profile_picture')}</h4>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="btn"
                                    style={{ background: 'var(--color-surface-hover)', padding: '0.6rem 1.2rem', fontSize: '0.9rem', border: '1px solid var(--glass-border)', color: 'var(--color-text)' }}
                                    disabled={uploading}
                                >
                                    {uploading ? t('uploading') : t('upload_photo')}
                                </button>
                            </div>
                        </div>

                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>{t('bio')}</label>
                            <textarea
                                className="input-field"
                                rows="4"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                style={{ resize: 'vertical' }}
                            ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>{t('firstName')}</label>
                                <input type="text" className="input-field" value={user.firstName || ''} disabled style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }} />
                            </div>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>{t('lastName')}</label>
                                <input type="text" className="input-field" value={user.lastName || ''} disabled style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>{t('year_of_study')}</label>
                                <select 
                                    className="input-field" 
                                    value={yearOfStudy} 
                                    onChange={(e) => setYearOfStudy(e.target.value)}
                                    style={{ width: '100%', background: 'var(--color-surface-hover)', cursor: 'not-allowed' }}
                                    disabled
                                >
                                    <option value="">{t('select_year') || 'Select Year'}</option>
                                    <option value="1">Year 1</option>
                                    <option value="2">Year 2</option>
                                    <option value="3">Year 3</option>
                                    <option value="4">Year 4</option>
                                    <option value="5">Year 5+</option>
                                </select>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                    {t('year_locked_desc') || 'Year of study can only be changed by an administrator.'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            className="btn btn-primary"
                            style={{ marginTop: '1rem', width: '100%', padding: '1rem' }}
                            disabled={saving}
                        >
                            {saving ? t('saving') : t('save_changes')}
                        </button>
                    </motion.div>

                    {/* Read-Only Academic Info Section */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel" style={{ padding: '2.5rem', alignSelf: 'start' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            {t('academic_info')}
                        </h3>

                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>{t('university')}</label>
                            <input
                                type="text"
                                className="input-field"
                                value={user.university || 'Not set'}
                                disabled
                                style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }}
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>{t('major')}</label>
                            <input
                                type="text"
                                className="input-field"
                                value={user.major || 'Not set'}
                                disabled
                                style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }}
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>{t('email_address')}</label>
                            <input
                                type="email"
                                className="input-field"
                                value={user.email || ''}
                                disabled
                                style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }}
                            />
                        </div>
                    </motion.div>

                </div>
            </main>
        </div>
    );
}
