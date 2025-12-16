const express = require('express');
const router = express.Router();

const RolesC = require('../controllers/rolesC');

// Roles chỉ có READ (GET) - không có CREATE, UPDATE, DELETE
router.get('/', RolesC.getAllRoles);
router.get('/:id', RolesC.getRoleById);

module.exports = router;

