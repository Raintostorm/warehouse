/**
 * Helper function để lấy thông tin người thực hiện từ request
 * @param {Object} req - Express request object
 * @returns {string} - Email hoặc ID của user, hoặc 'System' nếu không có
 */
const getActor = (req) => {
    if (req.user) {
        // Ưu tiên email, sau đó là id
        return req.user.email || req.user.id || 'System';
    }
    return 'System';
};

module.exports = getActor;

