const db = require('../config/db');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// GET /api/profile - Fetch current user's full profile
exports.getProfile = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, email, first_name, last_name, role, bio, profile_picture_url, university, major, year_of_study, created_at 
             FROM users WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            bio: user.bio || '',
            profilePictureUrl: user.profile_picture_url || '',
            university: user.university || '',
            major: user.major || '',
            yearOfStudy: user.year_of_study || '',
            createdAt: user.created_at
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};

// PUT /api/profile - Update editable profile fields (bio only for students)
exports.updateProfile = async (req, res) => {
    try {
        const { bio, yearOfStudy } = req.body;

        const result = await db.query(
            `UPDATE users SET bio = $1, year_of_study = $2 WHERE id = $3 
             RETURNING id, email, first_name, last_name, role, bio, profile_picture_url, university, major, year_of_study`,
            [bio, yearOfStudy, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            message: 'Profile updated successfully',
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
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Server error updating profile' });
    }
};

// POST /api/profile/picture - Upload profile picture to Supabase Storage with optimization
exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // 1. Get current profile to check for old picture
        const oldResult = await db.query(
            'SELECT profile_picture_url FROM users WHERE id = $1',
            [req.user.id]
        );
        
        const oldPictureUrl = oldResult.rows.length > 0 ? oldResult.rows[0].profile_picture_url : null;

        // 2. Process image: Resize to 400x400 and convert to WebP
        // This keeps file sizes around 20-50KB, well within the 50MB limit
        const optimizedBuffer = await sharp(req.file.buffer)
            .resize(400, 400, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: 80 })
            .toBuffer();

        const fileName = `profile_${req.user.id}_${Date.now()}.webp`;
        
        // 3. Upload new optimized picture to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from('profile-pictures')
            .upload(fileName, optimizedBuffer, {
                contentType: 'image/webp',
                upsert: true
            });

        if (uploadError) {
            console.error('Supabase storage upload error:', uploadError);
            return res.status(500).json({ error: 'Failed to upload image to cloud storage' });
        }

        // 4. Get the public URL for the new picture
        const { data: { publicUrl } } = supabase.storage
            .from('profile-pictures')
            .getPublicUrl(fileName);

        // 5. Update user record in database
        await db.query(
            `UPDATE users SET profile_picture_url = $1 WHERE id = $2`,
            [publicUrl, req.user.id]
        );

        // 6. Cleanup: Delete old picture if it was a Supabase bucket file
        if (oldPictureUrl && oldPictureUrl.includes('profile-pictures')) {
            const oldFileName = oldPictureUrl.split('/').pop();
            await supabase.storage
                .from('profile-pictures')
                .remove([oldFileName]);
        }

        res.json({
            message: 'Profile picture updated successfully',
            profilePictureUrl: publicUrl
        });
    } catch (error) {
        console.error('Error handling profile picture:', error);
        res.status(500).json({ error: 'Server error during picture update' });
    }
};
