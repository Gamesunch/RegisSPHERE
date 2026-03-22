import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, Mail, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Register() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const [role, setRole] = useState('STUDENT');

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (password !== confirmPassword) {
            return setErrorMsg(t('passwords_not_match'));
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, password, role })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t('registration_failed'));
            }

            // Redirect to login after successful registration
            navigate('/login');

        } catch (err) {
            setErrorMsg(err.message);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem', position: 'relative', background: 'var(--color-bg-dark)' }}>

            <div style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', gap: '0.5rem' }}>
                <LanguageSwitcher />
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTheme}
                    className="glass-panel"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '44px', height: '44px', border: '1px solid rgba(234, 88, 12, 0.4)',
                        background: 'rgba(10, 10, 10, 0.7)', color: 'var(--color-primary)',
                        borderRadius: '50%', cursor: 'pointer', transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                    }}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </motion.button>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="glass-panel"
                style={{ width: '100%', maxWidth: '480px', padding: '3.5rem', zIndex: 1, position: 'relative' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2.8rem', marginBottom: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Regis</span>
                        <span style={{ fontWeight: 800, letterSpacing: '1px', color: 'white', background: 'var(--color-primary-dark)', padding: '0 12px', borderRadius: '12px' }}>SPHERE</span>
                    </h1>
                </div>


                <form onSubmit={handleRegister}>
                    {errorMsg && (
                        <div style={{ color: 'var(--color-accent)', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>
                            {errorMsg}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>{t('firstName')}</label>
                            <div style={{ position: 'relative' }}>
                                <User style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{ paddingLeft: '3.2rem' }}
                                    placeholder={t('first')}
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>{t('lastName')}</label>
                            <div style={{ position: 'relative' }}>
                                <User style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{ paddingLeft: '3.2rem' }}
                                    placeholder={t('last')}
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>{t('email_address')}</label>
                        <div style={{ position: 'relative' }}>
                            <Mail style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                            <input
                                type="email"
                                className="input-field"
                                style={{ paddingLeft: '3.2rem' }}
                                placeholder={t('email_placeholder')}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>{t('password')}</label>
                        <div style={{ position: 'relative' }}>
                            <Lock style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="input-field"
                                style={{ paddingLeft: '3.2rem', paddingRight: '3rem' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '1.2rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--color-text-muted)' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>{t('confirm_password')}</label>
                        <div style={{ position: 'relative' }}>
                            <Lock style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="input-field"
                                style={{ paddingLeft: '3.2rem', paddingRight: '3rem' }}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{ position: 'absolute', right: '1.2rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--color-text-muted)' }}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}
                    >
                        {t('register_button')} <ArrowRight size={20} />
                    </motion.button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '1rem', color: 'var(--color-text-muted)' }}>
                    {t('already_have_account')} <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }} style={{ color: 'var(--color-primary-dark)', textDecoration: 'none', fontWeight: 600 }}>{t('sign_in')}</a>
                </div>
            </motion.div>
        </div>
    );
}
