import { useState, useEffect } from 'react';
import { statisticsAPI } from '../../services/api';
import { useToast } from '../../src/contexts/ToastContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Icons } from '../../src/utils/icons';
import {
    LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const SalesTrendChart = ({ startDate, endDate, period = 'month' }) => {
    const { isDark } = useTheme();
    const { error: showError } = useToast();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [startDate, endDate, period]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const days = startDate && endDate 
                ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
                : 30;
            
            const response = await statisticsAPI.getSalesTrends(period, days);
            if (response.success) {
                setData(response.data || []);
            } else {
                showError('Failed to fetch sales trends: ' + response.message);
            }
        } catch (err) {
            showError('Error fetching sales trends: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const chartColors = {
        line: isDark ? '#60a5fa' : '#3b82f6',
        area: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
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
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors.line} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={chartColors.line} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
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
                    <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke={chartColors.line} 
                        fillOpacity={1} 
                        fill="url(#colorSales)"
                        name="Doanh Thu"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SalesTrendChart;

