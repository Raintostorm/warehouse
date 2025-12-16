const express = require('express');
const router = express.Router();

const UserC = require('../controllers/userC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET routes - có thể cho phép nhiều roles xem
router.get('/', UserC.getAllUsers);
router.get('/:id', UserC.getUserById);

// POST, PUT, DELETE - chỉ admin mới có quyền
router.post('/', roleMiddleware('admin'), UserC.createUser);
router.put('/:id', roleMiddleware('admin'), UserC.updateUser);
// Bulk operations must be before /:id route to avoid conflict
router.delete('/bulk', roleMiddleware('admin'), UserC.bulkDeleteUsers);
router.delete('/:id', roleMiddleware('admin'), UserC.deleteUser);

// Profile routes - any authenticated user can access their own profile
router.put('/profile/update', UserC.updateProfile);
router.put('/profile/change-password', UserC.changePassword);

module.exports = router;
