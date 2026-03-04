import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
    const navigate = useNavigate();
    const [role, setRole] = useState('STUDENT');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

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
            navigate('/dashboard');

        } catch (err) {
            setErrorMsg(err.message);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '2rem', position: 'relative' }}>

            {/* 3D Floating Elements Background */}
            <motion.div
                animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: 'absolute', top: '15%', left: '15%', width: '200px', height: '200px', borderRadius: '40%', background: 'linear-gradient(135deg, var(--color-primary), #c084fc)', filter: 'blur(50px)', opacity: 0.6, zIndex: 0 }}
            />
            <motion.div
                animate={{ y: [0, 40, 0], scale: [1, 1.15, 1], rotate: [0, -10, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: 'absolute', bottom: '15%', right: '15%', width: '300px', height: '300px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-secondary), #fb7185)', filter: 'blur(70px)', opacity: 0.5, zIndex: 0 }}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="glass-panel"
                style={{ width: '100%', maxWidth: '480px', padding: '3.5rem', zIndex: 1, position: 'relative' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 className="title-3d" style={{ fontSize: '2.8rem', marginBottom: '0.8rem' }}>
                        <span className="text-gradient">Uni</span>Connect
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>Welcome to your premium academic hub</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                    {['STUDENT', 'PROFESSOR'].map(r => (
                        <button
                            key={r}
                            onClick={(e) => { e.preventDefault(); setRole(r); }}
                            style={{
                                flex: 1,
                                padding: '0.8rem',
                                borderRadius: '10px',
                                border: `1px solid ${role === r ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                                background: role === r ? 'rgba(139, 92, 246, 0.2)' : 'rgba(30, 41, 59, 0.4)',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                fontFamily: 'var(--font-main)',
                                fontWeight: role === r ? 600 : 400,
                                boxShadow: role === r ? '0 0 15px rgba(139, 92, 246, 0.3)' : 'none'
                            }}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleLogin}>
                    {errorMsg && (
                        <div style={{ color: 'var(--color-accent)', marginBottom: '1rem', textAlign: 'center', fontWeight: '500' }}>
                            {errorMsg}
                        </div>
                    )}

                    <div className="input-group">
                        <label>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <User style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                            <input
                                type="email"
                                className="input-field"
                                style={{ paddingLeft: '3.2rem' }}
                                placeholder="your.name@university.edu"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
                            <input
                                type="password"
                                className="input-field"
                                style={{ paddingLeft: '3.2rem' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }} />
                            <span style={{ color: 'var(--color-text-muted)' }}>Remember me</span>
                        </label>
                        <a href="#" style={{ color: 'var(--color-secondary)', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                    >
                        Access Portal <ArrowRight size={20} />
                    </motion.button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '1rem', color: 'var(--color-text-muted)' }}>
                    New to UniConnect? <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Create an account</a>
                </div>
            </motion.div>
        </div>
    );
}
