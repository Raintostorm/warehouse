import { useState } from 'react';
import { exportAPI, importAPI } from '../services/api';
import { Icons } from '../src/utils/icons';
import { useRole } from '../src/hooks/useRole';
import { useToast } from '../src/contexts/ToastContext';

const ExportImportButtons = ({ tableName, tableLabel, onImportSuccess }) => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const { success: showSuccess, error: showError } = useToast();
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [importError, setImportError] = useState(null);
    const [importSuccess, setImportSuccess] = useState(null);

    if (!isAdmin) return null;

    const handleExportExcel = async () => {
        try {
            setExporting(true);
            const response = await exportAPI.exportToExcel(tableName);
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${tableName}_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            showSuccess(`Đã xuất dữ liệu ${tableLabel} ra file Excel thành công!`);
        } catch (error) {
            showError('Lỗi khi xuất file Excel: ' + (error.response?.data?.error || error.message));
        } finally {
            setExporting(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            setExporting(true);
            const response = await exportAPI.exportToCSV(tableName);
            
            // Create download link with proper encoding for CSV
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${tableName}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            showSuccess(`Đã xuất dữ liệu ${tableLabel} ra file CSV thành công!`);
        } catch (error) {
            showError('Lỗi khi xuất file CSV: ' + (error.response?.data?.error || error.message));
        } finally {
            setExporting(false);
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
            showError('Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV (.csv)');
            return;
        }

        try {
            setImporting(true);
            setImportError(null);
            setImportSuccess(null);

            const response = await importAPI.importData(tableName, file);

            if (response.success) {
                setImportSuccess(`Đã import thành công ${response.imported}/${response.total} bản ghi`);
                if (response.errors && response.errors.length > 0) {
                    console.warn('Import errors:', response.errors);
                    showError(`Import hoàn tất với ${response.errors.length} lỗi. Xem console để biết chi tiết.`);
                }
                if (onImportSuccess) {
                    onImportSuccess();
                }
            } else {
                setImportError(response.message || 'Import thất bại');
                showError('Lỗi khi import: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message || 'Import thất bại';
            setImportError(errorMsg);
            showError('Lỗi khi import: ' + errorMsg);
        } finally {
            setImporting(false);
            // Reset file input
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    return (
        <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
        }}>
            {/* Export Buttons */}
            <button
                onClick={handleExportExcel}
                disabled={exporting}
                style={{
                    padding: '10px 20px',
                    background: exporting 
                        ? '#94a3b8' 
                        : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: exporting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)',
                    transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                    if (!exporting) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(71, 85, 105, 0.4)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!exporting) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(71, 85, 105, 0.3)';
                    }
                }}
            >
                {exporting ? 'Đang xuất...' : 'Xuất Excel'}
            </button>
            <button
                onClick={handleExportCSV}
                disabled={exporting}
                style={{
                    padding: '10px 20px',
                    background: exporting 
                        ? '#94a3b8' 
                        : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: exporting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(100, 116, 139, 0.3)',
                    transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                    if (!exporting) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(100, 116, 139, 0.4)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!exporting) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(100, 116, 139, 0.3)';
                    }
                }}
            >
                {exporting ? 'Đang xuất...' : 'Xuất CSV'}
            </button>

            {/* Import Button */}
            <label
                style={{
                    padding: '10px 20px',
                    background: importing 
                        ? '#94a3b8' 
                        : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: importing ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(100, 116, 139, 0.3)',
                    transition: 'all 0.3s'
                }}
            >
                <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleImport}
                    disabled={importing}
                    style={{ display: 'none' }}
                />
                {importing ? 'Đang import...' : 'Import'}
            </label>

            {/* Messages */}
            {importSuccess && (
                <span style={{
                    padding: '8px 16px',
                    background: '#f0fdf4',
                    color: '#166534',
                    borderRadius: '6px',
                    fontSize: '13px',
                    border: '1px solid #bbf7d0'
                }}>
                    {importSuccess}
                </span>
            )}
            {importError && (
                <span style={{
                    padding: '8px 16px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    borderRadius: '6px',
                    fontSize: '13px',
                    border: '1px solid #fecaca'
                }}>
                    {importError}
                </span>
            )}
        </div>
    );
};

export default ExportImportButtons;

