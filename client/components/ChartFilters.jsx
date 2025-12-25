import { useState } from 'react';

const ChartFilters = ({ 
    period, 
    onPeriodChange,
    limit,
    onLimitChange,
    sortBy,
    onSortByChange,
    days,
    onDaysChange
}) => {
    return (
        <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
            padding: '16px',
            background: 'var(--bg-secondary, #f9fafb)',
            borderRadius: '8px',
            marginBottom: '20px'
        }}>
            {period !== undefined && onPeriodChange && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary, #1a1a1a)' }}>
                        Kỳ:
                    </label>
                    <select
                        value={period}
                        onChange={(e) => onPeriodChange(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid var(--border-color, #e5e7eb)',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    >
                        <option value="day">Ngày</option>
                        <option value="week">Tuần</option>
                        <option value="month">Tháng</option>
                        <option value="year">Năm</option>
                    </select>
                </div>
            )}

            {limit !== undefined && onLimitChange && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary, #1a1a1a)' }}>
                        Số lượng:
                    </label>
                    <select
                        value={limit}
                        onChange={(e) => onLimitChange(Number(e.target.value))}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid var(--border-color, #e5e7eb)',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    >
                        <option value={5}>Top 5</option>
                        <option value={10}>Top 10</option>
                        <option value={20}>Top 20</option>
                        <option value={50}>Top 50</option>
                    </select>
                </div>
            )}

            {sortBy !== undefined && onSortByChange && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary, #1a1a1a)' }}>
                        Sắp xếp:
                    </label>
                    <select
                        value={sortBy}
                        onChange={(e) => onSortByChange(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid var(--border-color, #e5e7eb)',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    >
                        <option value="revenue">Doanh Thu</option>
                        <option value="quantity">Số Lượng</option>
                        <option value="orders">Số Đơn</option>
                    </select>
                </div>
            )}

            {days !== undefined && onDaysChange && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary, #1a1a1a)' }}>
                        Số ngày:
                    </label>
                    <select
                        value={days}
                        onChange={(e) => onDaysChange(Number(e.target.value))}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid var(--border-color, #e5e7eb)',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    >
                        <option value={7}>7 ngày</option>
                        <option value={30}>30 ngày</option>
                        <option value={90}>90 ngày</option>
                        <option value={180}>180 ngày</option>
                        <option value={365}>1 năm</option>
                    </select>
                </div>
            )}
        </div>
    );
};

export default ChartFilters;

