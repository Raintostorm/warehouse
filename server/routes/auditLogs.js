const express = require('express');
const router = express.Router();
const AuditLogC = require('../controllers/auditLogC');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET routes - chỉ admin mới có quyền xem audit logs
router.get('/', roleMiddleware('admin'), AuditLogC.getAuditLogs);
router.get('/record/:tableName/:recordId', roleMiddleware('admin'), AuditLogC.getRecordHistory);
router.get('/actor/:actor', roleMiddleware('admin'), AuditLogC.getActorLogs);

module.exports = router;

