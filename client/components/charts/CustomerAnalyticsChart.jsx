import { useState, useEffect } from 'react';
import { statisticsAPI } from '../../services/api';
import { useToast } from '../../src/contexts/ToastContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Icons } from '../../src/utils/icons';
import {
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const CustomerAnalyticsChart = ({ days = 30 }) => {
    const { isDark } = useTheme();
    const { error: showError } = useToast();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [days]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await statisticsAPI.getCustomerAnalytics(days);
            if (response.success) {
                setData(response.data || []);
            } else {
                showError('Failed to fetch customer analytics: ' + response.message);
            }
        } catch (err) {
            showError('Error fetching customer analytics: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const chartColors = {
        bar1: isDark ? '#8b5cf6' : '#7c3aed',
        bar2: isDark ? '#ec4899' : '#db2777',
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
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis 
                        dataKey="customerName" 
                        stroke={chartColors.text}
                        style={{ fontSize: '12px' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
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
                    />
                    <Legend 
                        wrapperStyle={{ color: chartColors.text }}
                    />
                    <Bar 
                        dataKey="orderCount" 
                        fill={chartColors.bar1}
                        name="Số Đơn"
                        radius={[8, 8, 0, 0]}
                    />
                    <Bar 
                        dataKey="totalSpent" 
                        fill={chartColors.bar2}
                        name="Tổng Chi Tiêu"
                        radius={[8, 8, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CustomerAnalyticsChart;

