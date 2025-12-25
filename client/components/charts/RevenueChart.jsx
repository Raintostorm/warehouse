import { useState, useEffect } from 'react';
import { statisticsAPI } from '../../services/api';
import { useToast } from '../../src/contexts/ToastContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Icons } from '../../src/utils/icons';
import {
    LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const RevenueChart = ({ period = 'month', startDate = null, endDate = null }) => {
    const { isDark } = useTheme();
    const { error: showError } = useToast();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [period, startDate, endDate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await statisticsAPI.getRevenueByPeriod(period, startDate, endDate);
            if (response.success) {
                setData(response.data || []);
            } else {
                showError('Failed to fetch revenue: ' + response.message);
            }
        } catch (err) {
            showError('Error fetching revenue: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const chartColors = {
        line: isDark ? '#10b981' : '#059669',
        grid: isDark ? '#334155' : '#e2e8f0',
        text: isDark ? '#cbd5e1' : '#64748b'
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '300px',
                color: chartColors.text
            }}>
                <Icons.Loader className="animate-spin" size={32} />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                color: chartColors.text
            }}>
                Không có dữ liệu
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis 
                        dataKey="period" 
                        stroke={chartColors.text}
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                        stroke={chartColors.text}
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => value.toLocaleString('vi-VN')}
                    />
                    <Tooltip 
                        contentStyle={{
                            backgroundColor: isDark ? '#1e293b' : 'white',
                            border: `1px solid ${chartColors.grid}`,
                            borderRadius: '8px',
                            color: chartColors.text
                        }}
                        formatter={(value) => [
                            new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND'
                            }).format(value),
                            'Doanh Thu'
                        ]}
                    />
                    <Legend 
                        wrapperStyle={{ color: chartColors.text }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke={chartColors.line}
                        strokeWidth={2}
                        dot={{ fill: chartColors.line, r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Doanh Thu"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;

