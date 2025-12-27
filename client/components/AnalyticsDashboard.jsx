import React, { useState, useEffect } from 'react';
import { useTheme } from '../src/contexts/ThemeContext';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import DateRangePicker from './DateRangePicker';
import ChartFilters from './ChartFilters';
import MetricCard from './MetricCard';
import SalesTrendChart from './charts/SalesTrendChart';
import ProductPerformanceChart from './charts/ProductPerformanceChart';
import RevenueChart from './charts/RevenueChart';
import WarehouseUtilizationChart from './charts/WarehouseUtilizationChart';
import InventoryTurnoverChart from './charts/InventoryTurnoverChart';
import CustomerAnalyticsChart from './charts/CustomerAnalyticsChart';
import SupplierAnalyticsChart from './charts/SupplierAnalyticsChart';

const AnalyticsDashboard = () => {
    const { isDark } = useTheme();
    const { error: showError } = useToast();
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [period, setPeriod] = useState('month');
    const [limit, setLimit] = useState(10);
    const [sortBy, setSortBy] = useState('revenue');
    const [days, setDays] = useState(30);
    const [activeTab, setActiveTab] = useState('overview');

    const cardBg = isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const borderColor = isDark ? '#334155' : '#e5e7eb';

    const tabs = [
        { id: 'overview', label: 'Tổng Quan', icon: Icons.Chart },
        { id: 'sales', label: 'Bán Hàng', icon: Icons.Chart },
        { id: 'products', label: 'Sản Phẩm', icon: Icons.Product },
        { id: 'inventory', label: 'Kho Hàng', icon: Icons.Package },
        { id: 'customers', label: 'Khách Hàng', icon: Icons.Users },
        { id: 'suppliers', label: 'Nhà Cung Cấp', icon: Icons.Supplier }
    ];

    useEffect(() => {
        // Reset error when component mounts
        setError(null);
    }, []);

    // Error boundary fallback
    if (error) {
        return (
            <div style={{ padding: '20px' }}>
                <div style={{
                    background: isDark ? '#1e293b' : 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                    textAlign: 'center'
                }}>
                    <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Lỗi khi tải Analytics Dashboard</h2>
                    <p style={{ color: isDark ? '#cbd5e1' : '#64748b', marginBottom: '16px' }}>
                        {error.message || 'Đã xảy ra lỗi không xác định'}
                    </p>
                    <button
                        onClick={() => {
                            setError(null);
                            window.location.reload();
                        }}
                        style={{
                            padding: '10px 20px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        Tải lại trang
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <h1 style={{ 
                    fontSize: '28px', 
                    fontWeight: '600', 
                    margin: 0,
                    color: 'var(--text-primary, #1a1a1a)'
                }}>
                    Analytics Dashboard
                </h1>
            </div>

            {/* Tabs */}
            <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginBottom: '24px',
                borderBottom: '2px solid var(--border-color, #e5e7eb)',
                flexWrap: 'wrap'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '12px 24px',
                            background: activeTab === tab.id 
                                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                                : 'transparent',
                            color: activeTab === tab.id ? 'white' : 'var(--text-secondary, #666)',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
                            borderRadius: '8px 8px 0 0',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === tab.id ? '600' : '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            marginBottom: '-2px'
                        }}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div style={{ 
                background: cardBg,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                border: `1px solid ${borderColor}`
            }}>
                <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                />
            </div>

            {/* Tab Content */}
            <div style={{ 
                background: cardBg,
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: `1px solid ${borderColor}`
            }}>
                {activeTab === 'overview' && (
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
                            Tổng Quan
                        </h2>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                            gap: '20px',
                            marginBottom: '32px'
                        }}>
                            <MetricCard
                                title="Doanh Thu Tổng"
                                value={0}
                                icon={Icons.Chart}
                                color="#3b82f6"
                                formatValue={(v) => new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND'
                                }).format(v)}
                            />
                            <MetricCard
                                title="Số Đơn Hàng"
                                value={0}
                                icon={Icons.Order}
                                color="#10b981"
                                formatValue={(v) => v.toLocaleString('vi-VN')}
                            />
                            <MetricCard
                                title="Sản Phẩm"
                                value={0}
                                icon={Icons.Product}
                                color="#f59e0b"
                                formatValue={(v) => v.toLocaleString('vi-VN')}
                            />
                            <MetricCard
                                title="Khách Hàng"
                                value={0}
                                icon={Icons.Users}
                                color="#8b5cf6"
                                formatValue={(v) => v.toLocaleString('vi-VN')}
                            />
                        </div>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
                            gap: '24px'
                        }}>
                            <div style={{
                                background: isDark ? '#1e293b' : 'white',
                                borderRadius: '12px',
                                padding: '24px',
                                border: `1px solid ${borderColor}`
                            }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                                    Xu Hướng Doanh Thu
                                </h3>
                                <ErrorBoundary>
                                    <RevenueChart period={period} startDate={startDate} endDate={endDate} />
                                </ErrorBoundary>
                            </div>
                            <div style={{
                                background: isDark ? '#1e293b' : 'white',
                                borderRadius: '12px',
                                padding: '24px',
                                border: `1px solid ${borderColor}`
                            }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                                    Top Sản Phẩm
                                </h3>
                                <ChartFilters
                                    limit={limit}
                                    onLimitChange={setLimit}
                                    sortBy={sortBy}
                                    onSortByChange={setSortBy}
                                />
                                <ErrorBoundary>
                                    <ProductPerformanceChart limit={limit} sortBy={sortBy} />
                                </ErrorBoundary>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sales' && (
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
                            Phân Tích Bán Hàng
                        </h2>
                        <ChartFilters
                            period={period}
                            onPeriodChange={setPeriod}
                        />
                        <div style={{
                            background: isDark ? '#1e293b' : 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            border: `1px solid ${borderColor}`,
                            marginBottom: '24px'
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                                Xu Hướng Bán Hàng
                            </h3>
                            <ErrorBoundary>
                                <SalesTrendChart period={period} startDate={startDate} endDate={endDate} />
                            </ErrorBoundary>
                        </div>
                        <div style={{
                            background: isDark ? '#1e293b' : 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            border: `1px solid ${borderColor}`
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                                Doanh Thu Theo Kỳ
                            </h3>
                            <RevenueChart period={period} startDate={startDate} endDate={endDate} />
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
                            Phân Tích Sản Phẩm
                        </h2>
                        <ChartFilters
                            limit={limit}
                            onLimitChange={setLimit}
                            sortBy={sortBy}
                            onSortByChange={setSortBy}
                        />
                        <div style={{
                            background: isDark ? '#1e293b' : 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            border: `1px solid ${borderColor}`
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                                Hiệu Suất Sản Phẩm
                            </h3>
                            <ProductPerformanceChart limit={limit} sortBy={sortBy} />
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
                            Phân Tích Kho Hàng
                        </h2>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
                            gap: '24px'
                        }}>
                            <div style={{
                                background: isDark ? '#1e293b' : 'white',
                                borderRadius: '12px',
                                padding: '24px',
                                border: `1px solid ${borderColor}`
                            }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                                    Sử Dụng Kho
                                </h3>
                                <ErrorBoundary>
                                    <WarehouseUtilizationChart />
                                </ErrorBoundary>
                            </div>
                            <div style={{
                                background: isDark ? '#1e293b' : 'white',
                                borderRadius: '12px',
                                padding: '24px',
                                border: `1px solid ${borderColor}`
                            }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                                    Tỷ Lệ Luân Chuyển Kho
                                </h3>
                                <ChartFilters
                                    days={days}
                                    onDaysChange={setDays}
                                />
                                <ErrorBoundary>
                                    <InventoryTurnoverChart days={days} />
                                </ErrorBoundary>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'customers' && (
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
                            Phân Tích Khách Hàng
                        </h2>
                        <ChartFilters
                            days={days}
                            onDaysChange={setDays}
                        />
                        <div style={{
                            background: isDark ? '#1e293b' : 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            border: `1px solid ${borderColor}`
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                                Top Khách Hàng
                            </h3>
                            <ErrorBoundary>
                                <CustomerAnalyticsChart days={days} />
                            </ErrorBoundary>
                        </div>
                    </div>
                )}

                {activeTab === 'suppliers' && (
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
                            Phân Tích Nhà Cung Cấp
                        </h2>
                        <div style={{
                            background: isDark ? '#1e293b' : 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            border: `1px solid ${borderColor}`
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                                Top Nhà Cung Cấp
                            </h3>
                            <ErrorBoundary>
                                <SupplierAnalyticsChart />
                            </ErrorBoundary>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Chart Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#64748b',
                    fontSize: '14px'
                }}>
                    <p>Không thể tải biểu đồ này</p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{
                            marginTop: '12px',
                            padding: '8px 16px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        Thử lại
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AnalyticsDashboard;

