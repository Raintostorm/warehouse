import { useState } from 'react';
import { Icons } from '../src/utils/icons';

const AdvancedFilterPanel = ({ 
    filters, 
    onFiltersChange, 
    sortOptions = [],
    onSortChange,
    onClearFilters 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid #e2e8f0'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: isExpanded ? '16px' : '0'
            }}>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(71, 85, 105, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <Icons.Search size={18} />
                    {isExpanded ? 'Ẩn bộ lọc nâng cao' : 'Bộ lọc nâng cao'}
                </button>
                {isExpanded && onClearFilters && (
                    <button
                        onClick={onClearFilters}
                        style={{
                            padding: '8px 16px',
                            background: 'white',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f1f5f9';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                        }}
                    >
                        Xóa bộ lọc
                    </button>
                )}
            </div>

            {isExpanded && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    {/* Date Range Filter */}
                    {filters.dateRange && (
                        <>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: '#475569'
                                }}>
                                    Từ ngày
                                </label>
                                <input
                                    type="date"
                                    value={filters.dateRange.start || ''}
                                    onChange={(e) => onFiltersChange({
                                        ...filters,
                                        dateRange: { ...filters.dateRange, start: e.target.value }
                                    })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        background: 'white'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: '#475569'
                                }}>
                                    Đến ngày
                                </label>
                                <input
                                    type="date"
                                    value={filters.dateRange.end || ''}
                                    onChange={(e) => onFiltersChange({
                                        ...filters,
                                        dateRange: { ...filters.dateRange, end: e.target.value }
                                    })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        background: 'white'
                                    }}
                                />
                            </div>
                        </>
                    )}

                    {/* Custom Filters */}
                    {filters.custom && filters.custom.map((filter, index) => (
                        <div key={index}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#475569'
                            }}>
                                {filter.label}
                            </label>
                            {filter.type === 'select' ? (
                                <select
                                    value={filter.value || ''}
                                    onChange={(e) => {
                                        const newCustom = [...filters.custom];
                                        newCustom[index].value = e.target.value;
                                        onFiltersChange({ ...filters, custom: newCustom });
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        background: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Tất cả</option>
                                    {filter.options?.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={filter.type || 'text'}
                                    value={filter.value || ''}
                                    onChange={(e) => {
                                        const newCustom = [...filters.custom];
                                        newCustom[index].value = e.target.value;
                                        onFiltersChange({ ...filters, custom: newCustom });
                                    }}
                                    placeholder={filter.placeholder || ''}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        background: 'white'
                                    }}
                                />
                            )}
                        </div>
                    ))}

                    {/* Sorting */}
                    {sortOptions.length > 0 && (
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#475569'
                            }}>
                                Sắp xếp theo
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select
                                    value={filters.sortBy || ''}
                                    onChange={(e) => onFiltersChange({
                                        ...filters,
                                        sortBy: e.target.value
                                    })}
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        background: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Không sắp xếp</option>
                                    {sortOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={filters.sortOrder || 'asc'}
                                    onChange={(e) => onFiltersChange({
                                        ...filters,
                                        sortOrder: e.target.value
                                    })}
                                    style={{
                                        padding: '10px 14px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        background: 'white',
                                        cursor: 'pointer',
                                        minWidth: '100px'
                                    }}
                                >
                                    <option value="asc">Tăng dần</option>
                                    <option value="desc">Giảm dần</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdvancedFilterPanel;

