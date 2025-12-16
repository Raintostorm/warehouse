import { useState, useEffect } from 'react';
import { statisticsAPI } from '../services/api';
import { Icons } from '../src/utils/icons';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await statisticsAPI.getDashboardStats();
            if (response.success) {
                setStats(response.data);
            } else {
                setError(response.message || 'Failed to load statistics');
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '60px 20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                margin: '20px 0'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #475569',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>Loading statistics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '20px',
                backgroundColor: '#fee',
                border: '1px solid #64748b',
                borderRadius: '8px',
                margin: '20px 0',
                textAlign: 'center'
            }}>
                <p style={{ color: '#64748b', margin: 0 }}>{error}</p>
                <button
                    onClick={fetchStats}
                    style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            margin: '20px 0',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                paddingBottom: '20px',
                borderBottom: '2px solid #e5e7eb'
            }}>
                <div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '28px',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
                        }}>
                            <Icons.Chart size={22} color="white" />
                        </div>
                        Dashboard
                    </h1>
                    <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                        Tổng quan hệ thống và thống kê
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(71, 85, 105, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(71, 85, 105, 0.3)';
                    }}
                >
                    <Icons.Refresh size={18} /> Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                {/* Users Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Icons.Users size={20} color="white" />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Users</p>
                            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
                                {stats.counts?.users || 0}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Products Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Icons.Product size={20} color="white" />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Products</p>
                            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
                                {stats.counts?.products || 0}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Orders Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Icons.Order size={20} color="white" />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Đơn hàng</p>
                            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
                                {stats.counts?.orders || 0}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Warehouses Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Icons.Warehouse size={20} color="white" />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Warehouses</p>
                            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
                                {stats.counts?.warehouses || 0}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
                }}>
                    <p style={{ margin: 0, fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Tổng Doanh thu</p>
                    <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>
                        {formatCurrency(stats.revenue?.total || 0)}
                    </h2>
                </div>
                <div style={{
                    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(100, 116, 139, 0.3)'
                }}>
                    <p style={{ margin: 0, fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Doanh thu hôm nay</p>
                    <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>
                        {formatCurrency(stats.revenue?.today || 0)}
                    </h2>
                </div>
                <div style={{
                    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(100, 116, 139, 0.3)'
                }}>
                    <p style={{ margin: 0, fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Doanh thu tháng này</p>
                    <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>
                        {formatCurrency(stats.revenue?.thisMonth || 0)}
                    </h2>
                </div>
            </div>

            {/* Two Column Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '24px'
            }}>
                {/* Low Stock Products */}
                <div style={{
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #fecaca'
                }}>
                    <h3 style={{
                        margin: '0 0 20px 0',
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Icons.Warning size={20} color="#991b1b" />
                        Sản phẩm tồn kho thấp
                    </h3>
                    {stats.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {stats.lowStockProducts.map((product, index) => (
                                <div key={index} style={{
                                    padding: '12px',
                                    background: 'white',
                                    borderRadius: '8px',
                                    border: '1px solid #fecaca'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>{product.name}</p>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>ID: {product.id}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                                                {product.number} {product.unit}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ margin: 0, color: '#64748b' }}>No low stock products</p>
                    )}
                </div>

                {/* Top Products */}
                <div style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #bbf7d0'
                }}>
                    <h3 style={{
                        margin: '0 0 20px 0',
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#166534',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Icons.Success size={20} color="#166534" />
                        Top sản phẩm bán chạy
                    </h3>
                    {stats.topProducts && stats.topProducts.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {stats.topProducts.map((product, index) => (
                                <div key={index} style={{
                                    padding: '12px',
                                    background: 'white',
                                    borderRadius: '8px',
                                    border: '1px solid #bbf7d0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: '700',
                                            fontSize: '14px'
                                        }}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>{product.name}</p>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>{product.type}</p>
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '6px 12px',
                                        background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                        borderRadius: '6px',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: '14px'
                                    }}>
                                        {product.totalSold} sold
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ margin: 0, color: '#64748b' }}>No sales data available</p>
                    )}
                </div>
            </div>

            {/* Charts Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                gap: '24px',
                marginTop: '32px',
                marginBottom: '32px'
            }}>
                {/* Revenue Chart - Line Chart */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <h3 style={{
                        margin: '0 0 20px 0',
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Icons.Chart size={20} color="#475569" />
                        Doanh thu 7 ngày gần nhất
                    </h3>
                    {stats.revenueByDay && stats.revenueByDay.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={stats.revenueByDay.map(item => ({
                                ...item,
                                day: new Date(item.day).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
                            }))}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#475569" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip 
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#475569" 
                                    fillOpacity={1} 
                                    fill="url(#colorRevenue)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <p style={{ margin: 0, color: '#64748b', textAlign: 'center', padding: '40px' }}>
                            Chưa có dữ liệu doanh thu
                        </p>
                    )}
                </div>

                {/* Orders by Type - Pie Chart */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <h3 style={{
                        margin: '0 0 20px 0',
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Icons.Order size={20} color="#475569" />
                        Order Distribution by Type
                    </h3>
                    {stats.ordersByType && stats.ordersByType.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats.ordersByType}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {stats.ordersByType.map((entry, index) => {
                                        const colors = ['#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'];
                                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p style={{ margin: 0, color: '#64748b', textAlign: 'center', padding: '40px' }}>
                            No order data available
                        </p>
                    )}
                </div>
            </div>

            {/* More Charts */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
            }}>
                {/* Revenue by Month - Line Chart */}
                {stats.revenue?.byMonth && stats.revenue.byMonth.length > 0 && (
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h3 style={{
                            margin: '0 0 20px 0',
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Icons.Chart size={20} color="#475569" />
                            Doanh thu theo tháng (12 tháng)
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats.revenue.byMonth.map(item => ({
                                ...item,
                                month: item.month.split('-')[1] + '/' + item.month.split('-')[0]
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip 
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#475569" 
                                    strokeWidth={3}
                                    dot={{ fill: '#475569', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Top Products - Bar Chart */}
                {stats.topProducts && stats.topProducts.length > 0 && (
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h3 style={{
                            margin: '0 0 20px 0',
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Icons.Product size={20} color="#475569" />
                            Top Selling Products
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.topProducts.map(item => ({
                                name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
                                sold: item.totalSold
                            }))} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis type="number" stroke="#64748b" fontSize={12} />
                                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={120} />
                                <Tooltip 
                                    formatter={(value) => `${value} products`}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                                <Bar dataKey="sold" fill="#475569" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Recent Orders */}
            <div style={{
                marginTop: '32px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0'
            }}>
                <h3 style={{
                    margin: '0 0 20px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Icons.Order size={20} color="#475569" />
                    Đơn hàng gần đây
                </h3>
                {stats.recentOrders && stats.recentOrders.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {stats.recentOrders.map((order, index) => (
                            <div key={index} style={{
                                padding: '16px',
                                background: 'white',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>Đơn #{order.id}</p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                                        {order.customer_name} • {formatDate(order.date)} • {order.type}
                                    </p>
                                </div>
                                <div style={{
                                    padding: '8px 16px',
                                    background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontWeight: '600',
                                    fontSize: '16px'
                                }}>
                                    {formatCurrency(order.total || 0)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ margin: 0, color: '#64748b' }}>No orders available</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

