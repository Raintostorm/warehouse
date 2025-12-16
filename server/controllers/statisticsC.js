const StatisticsS = require('../services/statisticsS');

const StatisticsC = {
    getDashboardStats: async (req, res) => {
        try {
            const result = await StatisticsS.getDashboardStats();
            
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(500).json(result);
            }
        } catch (error) {
            console.error('Statistics controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = StatisticsC;

