import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Login() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and redirect
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.user.role === 'PROFESSOR') {
                navigate('/professor/dashboard');
            } else {
                navigate('/dashboard');
            }

        } catch (err) {
            setErrorMsg(err.message);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem', position: 'relative', background: 'var(--color-bg-dark)' }}>

            <LanguageSwitcher style={{ position: 'absolute', top: '2rem', left: '2rem' }} />

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
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>{t('login_subtitle')}</p>
                </div>



                <form onSubmit={handleLogin}>
                    {errorMsg && (
                        <div style={{ color: 'var(--color-accent)', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>
                            {errorMsg}
                        </div>
                    )}

                    <div className="input-group">
                        <label>{t('email_address')}</label>
                        <div style={{ position: 'relative' }}>
                            <User style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }} />
                            <span style={{ color: 'var(--color-text-muted)' }}>{t('remember_me')}</span>
                        </label>
                        <a href="#" style={{ color: 'var(--color-secondary)', textDecoration: 'none', fontWeight: 500 }}>{t('forgot_password')}</a>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                    >
                        {t('login_button')} <ArrowRight size={20} />
                    </motion.button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '1rem', color: 'var(--color-text-muted)' }}>
                    {t('new_user')} <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }} style={{ color: 'var(--color-primary-dark)', textDecoration: 'none', fontWeight: 600 }}>{t('create_account')}</a>
                </div>
            </motion.div>
        </div>
    );
}
