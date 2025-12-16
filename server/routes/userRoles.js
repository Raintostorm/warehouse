const express = require('express');
const router = express.Router();

const UserRolesC = require('../controllers/userRolesC');

// Lấy tất cả user-role assignments
router.get('/', UserRolesC.getAllUserRoles);

// Lấy roles của một user
router.get('/user/:userId', UserRolesC.getUserRoles);

// Lấy users có một role cụ thể
router.get('/role/:roleId', UserRolesC.getRoleUsers);

// CREATE: Gán role cho user
router.post('/assign', UserRolesC.assignRoleToUser);

// DELETE: Xóa role của user
router.post('/remove', UserRolesC.removeRoleFromUser);

module.exports = router;

