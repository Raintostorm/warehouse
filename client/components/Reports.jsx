import { useState } from 'react';
import { reportAPI } from '../services/api';
import { Icons } from '../src/utils/icons';
import { useRole } from '../src/hooks/useRole';
import { useToast } from '../src/contexts/ToastContext';

const Reports = () => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const { success: _showSuccess, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState('revenue');
    const [format, setFormat] = useState('pdf');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [orderType, setOrderType] = useState('');

    if (!isAdmin) {
        return (
            <div style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                margin: '20px 0',
                textAlign: 'center'
            }}>
                <p style={{ color: '#ef4444', fontSize: '16px' }}>
                    You do not have access to this feature. Only Admin users can create reports.
                </p>
            </div>
        );
    }

    const handleDownload = async () => {
        try {
            setLoading(true);
            let blob;
            let filename;

            switch (reportType) {
                case 'revenue':
                    blob = await reportAPI.generateRevenueReport(format, startDate || undefined, endDate || undefined);
                    filename = `RevenueReport_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
                    break;
                case 'inventory':
                    blob = await reportAPI.generateInventoryReport(format);
                    filename = `InventoryReport_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
                    break;
                case 'orders':
                    blob = await reportAPI.generateOrdersReport(format, startDate || undefined, endDate || undefined, orderType || undefined);
                    filename = `OrdersReport_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
                    break;
                default:
                    throw new Error('Invalid report type');
            }

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download report error:', error);
            showError('Failed to create report: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

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
                            <Icons.File size={22} color="white" />
                        </div>
                        Create Report
                    </h1>
                    <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                        Create and download PDF or Excel reports
                    </p>
                </div>
            </div>

            {/* Report Form */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
            }}>
                {/* Report Type */}
                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#334155'
                    }}>
                        Report Type
                    </label>
                    <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '12px',
                            fontSize: '14px',
                            color: '#334155',
                            background: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        <option value="revenue">Revenue Report</option>
                        <option value="inventory">Inventory Report</option>
                        <option value="orders">Orders Report</option>
                    </select>
                </div>

                {/* Format */}
                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#334155'
                    }}>
                        Format
                    </label>
                    <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '12px',
                            fontSize: '14px',
                            color: '#334155',
                            background: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel</option>
                    </select>
                </div>

                {/* Start Date */}
                {(reportType === 'revenue' || reportType === 'orders') && (
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#334155'
                        }}>
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '12px',
                                fontSize: '14px',
                                color: '#334155',
                                background: 'white'
                            }}
                        />
                    </div>
                )}

                {/* End Date */}
                {(reportType === 'revenue' || reportType === 'orders') && (
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#334155'
                        }}>
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '12px',
                                fontSize: '14px',
                                color: '#334155',
                                background: 'white'
                            }}
                        />
                    </div>
                )}

                {/* Order Type */}
                {reportType === 'orders' && (
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#334155'
                        }}>
                            Loại đơn hàng
                        </label>
                        <select
                            value={orderType}
                            onChange={(e) => setOrderType(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '12px',
                                fontSize: '14px',
                                color: '#334155',
                                background: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">All</option>
                            <option value="Sale">Sale</option>
                            <option value="Sell">Export</option>
                            <option value="Import">Import</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Generate Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                <button
                    onClick={handleDownload}
                    disabled={loading}
                    style={{
                        padding: '14px 32px',
                        background: loading 
                            ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                            : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)',
                        transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                        if (!loading) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(71, 85, 105, 0.4)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!loading) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(71, 85, 105, 0.3)';
                        }
                    }}
                >
                    {loading ? (
                        <>
                            <Icons.Loading size={18} /> Creating report...
                        </>
                    ) : (
                        <>
                            <Icons.Download size={18} /> Create and Download
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Reports;

