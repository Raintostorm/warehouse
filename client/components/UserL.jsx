import { useState, useEffect, useMemo } from 'react';
import { userAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import UUser from './UUser';
import UserRoleManager from './UserRoleManager';
import Pagination from '../src/components/Pagination';
import ExportImportButtons from './ExportImportButtons';
import AdvancedFilterPanel from './AdvancedFilterPanel';
import BulkActions from './BulkActions';
import ConfirmationModal from '../src/components/ConfirmationModal';

const UserL = () => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const { success: showSuccess, error: showError } = useToast();
    // State để lưu danh sách users
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingUserId, setEditingUserId] = useState(null);
    const [managingRolesUserId, setManagingRolesUserId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, data: null });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    // Advanced filters state
    const [advancedFilters, setAdvancedFilters] = useState({
        dateRange: { start: '', end: '' },
        custom: [],
        sortBy: '',
        sortOrder: 'asc'
    });

    // Bulk selection state
    const [selectedUsers, setSelectedUsers] = useState(new Set());

    // Fetch users khi component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userAPI.getAllUsers();

            if (response.success) {
                setUsers(response.data);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch users');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            action: 'delete',
            data: { id }
        });
    };

    const confirmDelete = async () => {
        const { id } = confirmModal.data;
        try {
            const response = await userAPI.deleteUser(id);
            if (response.success) {
                fetchUsers();
                showSuccess('User deleted successfully!');
            } else {
                showError('Lỗi khi xóa: ' + (response.message || 'Unknown error'));
            }
        } catch (err) {
            showError('Delete user error: ' + (err.response?.data?.error || err.message));
        }
    };

    // Filter and sort users
    const filteredUsers = useMemo(() => {
        let result = [...users];

        // Text search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(user =>
                user.id?.toLowerCase().includes(term) ||
                user.fullname?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term) ||
                user.number?.toLowerCase().includes(term) ||
                user.address?.toLowerCase().includes(term)
            );
        }

        // Date range filter
        if (advancedFilters.dateRange.start) {
            const startDate = new Date(advancedFilters.dateRange.start);
            result = result.filter(user => {
                const userDate = new Date(user.created_at);
                return userDate >= startDate;
            });
        }
        if (advancedFilters.dateRange.end) {
            const endDate = new Date(advancedFilters.dateRange.end);
            endDate.setHours(23, 59, 59, 999); // Include entire end date
            result = result.filter(user => {
                const userDate = new Date(user.created_at);
                return userDate <= endDate;
            });
        }

        // Custom filters
        if (advancedFilters.custom && advancedFilters.custom.length > 0) {
            advancedFilters.custom.forEach(filter => {
                if (filter.value) {
                    const field = filter.field;
                    result = result.filter(user => {
                        const value = String(user[field] || '').toLowerCase();
                        return value.includes(filter.value.toLowerCase());
                    });
                }
            });
        }

        // Sorting
        if (advancedFilters.sortBy) {
            result.sort((a, b) => {
                let aVal = a[advancedFilters.sortBy];
                let bVal = b[advancedFilters.sortBy];

                // Handle dates
                if (advancedFilters.sortBy.includes('date') || advancedFilters.sortBy.includes('created') || advancedFilters.sortBy.includes('updated')) {
                    aVal = new Date(aVal || 0);
                    bVal = new Date(bVal || 0);
                }

                // Handle strings
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = String(bVal || '').toLowerCase();
                }

                // Handle numbers
                if (typeof aVal === 'number' || !isNaN(aVal)) {
                    aVal = parseFloat(aVal) || 0;
                    bVal = parseFloat(bVal) || 0;
                }

                if (aVal < bVal) return advancedFilters.sortOrder === 'asc' ? -1 : 1;
                if (aVal > bVal) return advancedFilters.sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [users, searchTerm, advancedFilters]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    // Reset to page 1 when search or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, advancedFilters]);

    // Clear selection when page changes
    useEffect(() => {
        setSelectedUsers(new Set());
    }, [currentPage]);

    const handleClearFilters = () => {
        setAdvancedFilters({
            dateRange: { start: '', end: '' },
            custom: [],
            sortBy: '',
            sortOrder: 'asc'
        });
        setSearchTerm('');
    };

    // Bulk operations handlers
    const handleSelectUser = (userId) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const handleSelectAll = () => {
        setSelectedUsers(new Set(currentUsers.map(u => u.id)));
    };

    const handleDeselectAll = () => {
        setSelectedUsers(new Set());
    };

    const handleBulkDelete = () => {
        if (selectedUsers.size === 0) return;
        setConfirmModal({
            isOpen: true,
            action: 'bulkDelete',
            data: { count: selectedUsers.size, ids: Array.from(selectedUsers) }
        });
    };

    const confirmBulkDelete = async () => {
        const { ids } = confirmModal.data;
        try {
            const response = await userAPI.bulkDeleteUsers(ids);
            if (response.success) {
                showSuccess(`Successfully deleted ${response.count} users!`);
                setSelectedUsers(new Set());
                fetchUsers();
            } else {
                showError('Lỗi khi xóa: ' + (response.message || 'Unknown error'));
            }
        } catch (err) {
            showError('Lỗi khi xóa: ' + (err.response?.data?.error || err.message));
        }
    };

    const isAllSelected = currentUsers.length > 0 && currentUsers.every(u => selectedUsers.has(u.id));

    // Hiển thị loading
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
                        borderTop: '4px solid #007bff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    // Hiển thị error
    if (error) {
        return (
            <div style={{
                padding: '20px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c33',
                margin: '20px 0'
            }}>
                <strong>Lỗi:</strong> {error}
            </div>
        );
    }

    // Kiểm tra quyền admin
    if (!isAdmin) {
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                border: '1px solid #dc3545',
                borderRadius: '8px',
                backgroundColor: '#fee',
                margin: '20px'
            }}>
                <h2 style={{ color: '#dc3545' }}>No access permission</h2>
                <p>Only admin users can manage the user list.</p>
            </div>
        );
    }

    // Hiển thị danh sách users
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
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px'
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
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
                        }}>
                            <Icons.Users size={24} color="white" />
                        </div>
                        User Management
                    </h1>
                    <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                        Total: <strong>{filteredUsers.length}</strong> users
                    </p>
                </div>
                <button
                    onClick={fetchUsers}
                    style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                <ExportImportButtons
                    tableName="users"
                    tableLabel="Users"
                    onImportSuccess={fetchUsers}
                />
            </div>

            {/* Advanced Filter Panel */}
            <AdvancedFilterPanel
                filters={advancedFilters}
                onFiltersChange={setAdvancedFilters}
                sortOptions={[
                    { value: 'id', label: 'ID' },
                    { value: 'fullname', label: 'Họ tên' },
                    { value: 'email', label: 'Email' },
                    { value: 'created_at', label: 'Created Date' },
                    { value: 'number', label: 'Số điện thoại' }
                ]}
                onSortChange={(sortBy, sortOrder) => setAdvancedFilters({ ...advancedFilters, sortBy, sortOrder })}
                onClearFilters={handleClearFilters}
            />

            {/* Search and Filter */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af',
                            zIndex: 1
                        }}>
                            <Icons.Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by ID, name, email, phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 16px 14px 48px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '12px',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'all 0.3s',
                                backgroundColor: 'white',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#475569';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(71, 85, 105, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                </div>
                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '14px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        outline: 'none',
                        backgroundColor: 'white',
                        fontWeight: '500',
                        color: '#374151',
                        transition: 'all 0.3s'
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#667eea';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <option value={5}>5 / trang</option>
                    <option value={10}>10 / trang</option>
                    <option value={20}>20 / trang</option>
                    <option value={50}>50 / trang</option>
                </select>
            </div>

            {/* Table */}
            {filteredUsers.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#999'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                    <p style={{ fontSize: '16px', margin: 0 }}>
                        {searchTerm ? 'No results found' : 'No users yet'}
                    </p>
                </div>
            ) : (
                <>
                    {/* Bulk Actions */}
                    <BulkActions
                        selectedCount={selectedUsers.size}
                        onBulkDelete={handleBulkDelete}
                        onSelectAll={handleSelectAll}
                        onDeselectAll={handleDeselectAll}
                        isAllSelected={isAllSelected}
                        totalItems={currentUsers.length}
                        isAdmin={isAdmin}
                    />

                    <div style={{
                        overflowX: 'auto',
                        borderRadius: '16px',
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                    }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            backgroundColor: 'white'
                        }}>
                            <thead>
                                <tr style={{
                                    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                                    borderBottom: '2px solid #e5e7eb'
                                }}>
                                    {isAdmin && (
                                        <th style={{
                                            padding: '16px 20px',
                                            textAlign: 'center',
                                            fontWeight: '600',
                                            color: '#374151',
                                            fontSize: '14px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            borderBottom: '2px solid #e5e7eb',
                                            width: '50px'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={isAllSelected ? handleDeselectAll : handleSelectAll}
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                        </th>
                                    )}
                                    <th style={{
                                        padding: '16px 20px',
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '14px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        borderBottom: '2px solid #e5e7eb'
                                    }}>ID</th>
                                    <th style={{
                                        padding: '16px 20px',
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '14px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Họ tên</th>
                                    <th style={{
                                        padding: '16px 20px',
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '14px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Email</th>
                                    <th style={{
                                        padding: '16px 20px',
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '14px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Số điện thoại</th>
                                    <th style={{
                                        padding: '16px 20px',
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '14px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Địa chỉ</th>
                                    <th style={{
                                        padding: '16px 20px',
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '14px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.map((user, index) => (
                                    <tr
                                        key={user.id}
                                        style={{
                                            borderBottom: '1px solid #e9ecef',
                                            transition: 'background-color 0.2s',
                                            backgroundColor: selectedUsers.has(user.id) ? '#fef3c7' : 'white'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!selectedUsers.has(user.id)) {
                                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!selectedUsers.has(user.id)) {
                                                e.currentTarget.style.backgroundColor = 'white';
                                            }
                                        }}
                                    >
                                        {isAdmin && (
                                            <td style={{
                                                padding: '16px 20px',
                                                textAlign: 'center'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.has(user.id)}
                                                    onChange={() => handleSelectUser(user.id)}
                                                    style={{
                                                        width: '18px',
                                                        height: '18px',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                            </td>
                                        )}
                                        <td style={{
                                            padding: '16px 20px',
                                            color: '#1f2937',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}>{user.id}</td>
                                        <td style={{
                                            padding: '16px 20px',
                                            color: '#1f2937',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}>{user.fullname}</td>
                                        <td style={{
                                            padding: '16px 20px',
                                            color: '#6b7280',
                                            fontSize: '14px'
                                        }}>{user.email}</td>
                                        <td style={{
                                            padding: '16px 20px',
                                            color: '#6b7280',
                                            fontSize: '14px'
                                        }}>{user.number || <span style={{ color: '#9ca3af' }}>-</span>}</td>
                                        <td style={{
                                            padding: '16px 20px',
                                            color: '#6b7280',
                                            fontSize: '14px',
                                            maxWidth: '200px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>{user.address || <span style={{ color: '#9ca3af' }}>-</span>}</td>
                                        <td style={{
                                            padding: '16px 20px'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                gap: '10px',
                                                flexWrap: 'wrap'
                                            }}>
                                                <button
                                                    onClick={() => setEditingUserId(user.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        transition: 'all 0.3s',
                                                        boxShadow: '0 2px 4px rgba(71, 85, 105, 0.2)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(71, 85, 105, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(71, 85, 105, 0.2)';
                                                    }}
                                                >
                                                    <Icons.Edit size={16} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => setManagingRolesUserId(user.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        transition: 'all 0.3s',
                                                        boxShadow: '0 2px 4px rgba(71, 85, 105, 0.2)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(71, 85, 105, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(71, 85, 105, 0.2)';
                                                    }}
                                                >
                                                    <Icons.Security size={16} /> Quyền
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        transition: 'all 0.3s',
                                                        boxShadow: '0 2px 4px rgba(71, 85, 105, 0.2)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(71, 85, 105, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(71, 85, 105, 0.2)';
                                                    }}
                                                >
                                                    <Icons.Delete size={16} /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </>
            )}

            {/* Form update user */}
            {editingUserId && (
                <UUser
                    userId={editingUserId}
                    onUserUpdated={() => {
                        fetchUsers();
                        setEditingUserId(null);
                    }}
                />
            )}

            {/* User Role Manager */}
            <UserRoleManager
                isOpen={!!managingRolesUserId}
                onClose={() => setManagingRolesUserId(null)}
                userId={managingRolesUserId}
                userName={users.find(u => u.id === managingRolesUserId)?.fullname}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, action: null, data: null })}
                onConfirm={() => {
                    if (confirmModal.action === 'delete') {
                        confirmDelete();
                    } else if (confirmModal.action === 'bulkDelete') {
                        confirmBulkDelete();
                    }
                    setConfirmModal({ isOpen: false, action: null, data: null });
                }}
                title="Confirm Delete"
                message={
                    confirmModal.action === 'delete'
                        ? 'Are you sure you want to delete this user?'
                        : confirmModal.action === 'bulkDelete'
                            ? `Are you sure you want to delete ${confirmModal.data?.count || 0} selected users?`
                            : ''
                }
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
};

export default UserL;