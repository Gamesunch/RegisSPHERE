const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;

        // Check if user exists
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // By default users register as STUDENT unless specified
        const userRole = role && ['STUDENT', 'PROFESSOR', 'ADMIN'].includes(role) ? role : 'STUDENT';

        const result = await db.query(
            'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role',
            [email, passwordHash, firstName, lastName, userRole]
        );

        res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                bio: user.bio || '',
                profilePictureUrl: user.profile_picture_url || '',
                university: user.university || '',
                major: user.major || '',
                yearOfStudy: user.year_of_study || ''
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, email, first_name, last_name, role, bio, profile_picture_url, university, major, year_of_study, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const u = result.rows[0];
        res.json({
            id: u.id,
            email: u.email,
            firstName: u.first_name,
            lastName: u.last_name,
            role: u.role,
            bio: u.bio || '',
            profilePictureUrl: u.profile_picture_url || '',
            university: u.university || '',
            major: u.major || '',
            yearOfStudy: u.year_of_study || '',
            createdAt: u.created_at
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};
