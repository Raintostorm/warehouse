const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const UsersM = require('./models/UsersM');
const { sendVideoCallInvitationEmail } = require('./utils/emailService');

// Use same JWT_SECRET as authS.js (with fallback)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

let io = null;

/**
 * Initialize Socket.io server
 */
function initSocketIO(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
                console.warn('⚠️ JWT_SECRET is using default value. Please set JWT_SECRET in .env for production!');
            }

            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                console.warn('⚠️ Socket connection attempt without token');
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            socket.userId = decoded.id || decoded.Id;
            socket.userRole = decoded.role || decoded.Role;
            socket.userName = decoded.fullname || decoded.Fullname || decoded.name;

            next();
        } catch (error) {
            console.error('❌ Socket authentication error:', error.message);
            if (error.message.includes('secret') || error.message.includes('invalid signature')) {
                console.error('   Token verification failed. Make sure JWT_SECRET matches the one used to sign tokens.');
            }
            next(new Error('Authentication error: Invalid token'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {

        // Join user's personal room
        socket.join(`user:${socket.userId}`);

        // Join role-based room
        if (socket.userRole) {
            socket.join(`role:${socket.userRole}`);
        }

        // Join admin room if admin
        if (socket.userRole === 'Admin' || socket.userRole === 'admin') {
            socket.join('admin');
        }

        // ============================================
        // Video Call Signaling (WebRTC)
        // ============================================

        // Join video call room
        socket.on('video:join', (roomId) => {
            socket.join(`video:${roomId}`);

            // Notify others in the room
            socket.to(`video:${roomId}`).emit('video:user-joined', {
                userId: socket.userId,
                userName: socket.userName
            });
        });

        // Leave video call room
        socket.on('video:leave', (roomId) => {
            socket.leave(`video:${roomId}`);

            // Notify others in the room
            socket.to(`video:${roomId}`).emit('video:user-left', {
                userId: socket.userId
            });
        });

        // WebRTC offer
        socket.on('video:offer', (data) => {
            const { roomId, offer, targetUserId } = data;
            socket.to(`video:${roomId}`).emit('video:offer', {
                offer,
                fromUserId: socket.userId,
                fromUserName: socket.userName,
                targetUserId
            });
        });

        // WebRTC answer
        socket.on('video:answer', (data) => {
            const { roomId, answer, targetUserId } = data;
            socket.to(`video:${roomId}`).emit('video:answer', {
                answer,
                fromUserId: socket.userId,
                targetUserId
            });
        });

        // ICE candidate
        socket.on('video:ice-candidate', (data) => {
            const { roomId, candidate, targetUserId } = data;
            socket.to(`video:${roomId}`).emit('video:ice-candidate', {
                candidate,
                fromUserId: socket.userId,
                targetUserId
            });
        });

        // Call request
        socket.on('video:call-request', async (data) => {
            const { targetUserId, roomId } = data;

            if (!targetUserId || !roomId) {
                console.error('Invalid call request data:', data);
                return;
            }

            // Emit to target user via socket
            socket.to(`user:${targetUserId}`).emit('video:incoming-call', {
                fromUserId: socket.userId,
                fromUserName: socket.userName,
                roomId
            });

            // Send email invitation to target user
            try {
                const targetUser = await UsersM.findById(targetUserId);

                if (targetUser?.email) {
                    const callLink = `${CLIENT_URL}/video-call?room=${roomId}&from=${socket.userId}`;
                    await sendVideoCallInvitationEmail(
                        targetUser.email,
                        socket.userName || 'Someone',
                        callLink
                    );
                }
            } catch (error) {
                console.error('Failed to send video call invitation email:', error.message);
                // Don't block the call request if email fails
            }
        });

        // Call response (accept/reject)
        socket.on('video:call-response', (data) => {
            const { targetUserId, roomId, accepted } = data;
            socket.to(`user:${targetUserId}`).emit('video:call-response', {
                fromUserId: socket.userId,
                roomId,
                accepted
            });
        });

        // End call
        socket.on('video:end-call', (data) => {
            const { roomId } = data;
            socket.to(`video:${roomId}`).emit('video:call-ended', {
                fromUserId: socket.userId
            });
        });

        // ============================================
        // Notifications
        // ============================================
        socket.on('subscribe:notifications', () => {
            socket.join('notifications');
        });

        socket.on('subscribe:dashboard', () => {
            socket.join('dashboard');
        });

        // Disconnect handler
        socket.on('disconnect', () => {
            // User disconnected
        });
    });

    return io;
}

/**
 * Get Socket.io instance
 */
function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initSocketIO first.');
    }
    return io;
}

module.exports = {
    initSocketIO,
    getIO
};
