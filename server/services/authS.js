const UserS = require('./userS');
const UserRolesS = require('./userRolesS');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const db = require('../db');
const { sendPasswordResetEmail } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const PASSWORD_RESET_TOKEN_EXP_MINUTES = Number(process.env.PASSWORD_RESET_TOKEN_EXP_MINUTES) || 15;

// Initialize Google OAuth client
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const AuthS = {
    login: async (email, password) => {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        // Find user by email
        let user;
        try {
            user = await UserS.findByEmail(email);
        } catch (error) {
            if (error.message === 'User not found') {
                throw new Error('Invalid email or password');
            }
            throw error;
        }
        
        // Handle both lowercase and PascalCase column names
        const userPassword = user.password || user.Password;
        const userId = user.id || user.Id;
        const userEmail = user.email || user.Email;
        
        if (!userPassword) {
            throw new Error('Invalid email or password');
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, userPassword);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        // Get user roles với role names
        let roles = [];
        let roleNames = [];
        try {
            const userRoles = await UserRolesS.findByUserId(userId);
            roles = userRoles.map(ur => ur.role_id || ur.id);
            // Lấy role names từ kết quả (đã có role_name trong kết quả)
            roleNames = userRoles
                .map(ur => ur.role_name || ur.name || ur.Name)
                .filter(name => name); // Loại bỏ undefined/null
        } catch (error) {
            // User might not have roles yet, that's okay
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: userId,
                email: userEmail,
                roles: roles, // Giữ role IDs để tương thích
                roleNames: roleNames // Thêm role names để dễ check
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Return user data without password (handle both cases)
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        delete userWithoutPassword.Password;

        return {
            user: userWithoutPassword,
            token,
            roles,
            roleNames
        };
    },

    verifyToken: (token) => {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    },

    // Verify Google token and get user info
    verifyGoogleToken: async (googleToken) => {
        if (!googleClient) {
            throw new Error('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in environment variables.');
        }

        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: googleToken,
                audience: GOOGLE_CLIENT_ID
            });
            
            const payload = ticket.getPayload();
            return {
                googleId: payload.sub,
                email: payload.email,
                emailVerified: payload.email_verified,
                name: payload.name,
                picture: payload.picture,
                givenName: payload.given_name,
                familyName: payload.family_name
            };
        } catch (error) {
            throw new Error('Invalid Google token: ' + error.message);
        }
    },

    // Google OAuth Login
    googleLogin: async (googleToken) => {
        if (!googleToken) {
            throw new Error('Google token is required');
        }

        // Verify Google token
        const googleUser = await AuthS.verifyGoogleToken(googleToken);

        if (!googleUser.email) {
            throw new Error('Email not provided by Google');
        }

        // Find user by email
        let user;
        try {
            user = await UserS.findByEmail(googleUser.email);
        } catch (error) {
            if (error.message === 'User not found') {
                throw new Error('User not found. Please register first.');
            }
            throw error;
        }

        const userId = user.id || user.Id;
        const userEmail = user.email || user.Email;

        // Get user roles
        let roles = [];
        let roleNames = [];
        try {
            const userRoles = await UserRolesS.findByUserId(userId);
            roles = userRoles.map(ur => ur.role_id || ur.id);
            roleNames = userRoles
                .map(ur => ur.role_name || ur.name)
                .filter(name => name);
        } catch (error) {
            // User might not have roles yet, that's okay
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: userId,
                email: userEmail,
                roles: roles,
                roleNames: roleNames
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Return user data without password
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        delete userWithoutPassword.Password;

        return {
            user: userWithoutPassword,
            token,
            roles,
            roleNames
        };
    },

    // Google OAuth Register
    googleRegister: async (googleToken, additionalData = {}) => {
        if (!googleToken) {
            throw new Error('Google token is required');
        }

        // Verify Google token
        const googleUser = await AuthS.verifyGoogleToken(googleToken);

        if (!googleUser.email) {
            throw new Error('Email not provided by Google');
        }

        if (!googleUser.emailVerified) {
            throw new Error('Email not verified by Google');
        }

        // Check if user already exists
        try {
            const existingUser = await UserS.findByEmail(googleUser.email);
            if (existingUser) {
                throw new Error('User already exists. Please login instead.');
            }
        } catch (error) {
            if (error.message !== 'User not found') {
                throw error;
            }
            // User not found, continue with registration
        }

        // Generate unique user ID
        // Format: GOOGLE_<first_6_chars_of_googleId>_<timestamp>
        const googleIdShort = googleUser.googleId.substring(0, 6);
        const timestamp = Date.now().toString().slice(-6);
        let userId = additionalData.id || `GOOGLE_${googleIdShort}_${timestamp}`;
        
        // Ensure ID is unique (max 10 characters for database)
        // If too long, use shorter version
        if (userId.length > 10) {
            userId = `G${googleIdShort}${timestamp}`.substring(0, 10);
        }
        
        // Check if ID already exists, if so, append random number
        try {
            const existingUser = await UserS.findById(userId);
            if (existingUser) {
                // ID exists, append random number
                const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                userId = userId.substring(0, 7) + randomSuffix;
            }
        } catch (error) {
            // ID doesn't exist, we can use it
            if (error.message !== 'User not found') {
                throw error;
            }
        }

        // Prepare user data
        const userData = {
            id: userId,
            email: googleUser.email,
            fullname: googleUser.name || additionalData.fullname || googleUser.email.split('@')[0],
            number: additionalData.number || '',
            address: additionalData.address || '',
            // No password for Google OAuth users
            password: null,
            actor: additionalData.actor || 'system'
        };

        // Create user
        const newUser = await UserS.createUser(userData);

        // Get user roles (if any default roles should be assigned)
        let roles = [];
        let roleNames = [];
        // You can assign default roles here if needed

        // Generate JWT token
        const token = jwt.sign(
            {
                id: newUser.id || newUser.Id,
                email: newUser.email || newUser.Email,
                roles: roles,
                roleNames: roleNames
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Return user data without password
        const userWithoutPassword = { ...newUser };
        delete userWithoutPassword.password;
        delete userWithoutPassword.Password;

        return {
            user: userWithoutPassword,
            token,
            roles,
            roleNames
        };
    },

    /**
     * Request password reset: generate token, store in DB, send email
     */
    requestPasswordReset: async (email, baseResetUrl) => {
        if (!email) {
            throw new Error('Email is required');
        }

        // Find user by email - if not found, we still return success to avoid user enumeration
        let user;
        try {
            user = await UserS.findByEmail(email);
        } catch (error) {
            if (error.message === 'User not found') {
                // Fake success - do not reveal that user doesn't exist
                return { success: true };
            }
            throw error;
        }

        const userId = user.id || user.Id;
        const userEmail = user.email || user.Email;

        // Generate secure random token
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Calculate expiry time
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXP_MINUTES * 60 * 1000);

        // Store token in password_resets table (invalidate previous tokens for this user)
        await db.query(
            'UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND used = FALSE',
            [userId]
        );

        await db.query(
            'INSERT INTO password_resets (user_id, token_hash, expires_at, used) VALUES ($1, $2, $3, FALSE)',
            [userId, tokenHash, expiresAt]
        );

        // Build reset link
        const url = new URL(baseResetUrl);
        url.searchParams.set('token', token);
        const resetLink = url.toString();

        // Send email
        await sendPasswordResetEmail(userEmail, resetLink);

        return { success: true };
    },

    /**
     * Reset password using token
     */
    resetPassword: async (token, newPassword) => {
        if (!token || !newPassword) {
            throw new Error('Token and new password are required');
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Find valid reset record
        const result = await db.query(
            'SELECT * FROM password_resets WHERE token_hash = $1 AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [tokenHash]
        );

        const resetRecord = result.rows[0];
        if (!resetRecord) {
            throw new Error('Invalid or expired reset token');
        }

        const userId = resetRecord.user_id;

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password (handle both Users and users table naming)
        await db.query(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, userId]
        );

        // Mark token as used
        await db.query(
            'UPDATE password_resets SET used = TRUE WHERE id = $1',
            [resetRecord.id]
        );

        return { success: true };
    }
};

module.exports = AuthS;

