import { useState } from 'react';
import { Icons } from '../src/utils/icons';

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, onApply }) => {
    const [localStartDate, setLocalStartDate] = useState(startDate || '');
    const [localEndDate, setLocalEndDate] = useState(endDate || '');

    const handleStartDateChange = (e) => {
        const value = e.target.value;
        setLocalStartDate(value);
        if (onStartDateChange) onStartDateChange(value);
    };

    const handleEndDateChange = (e) => {
        const value = e.target.value;
        setLocalEndDate(value);
        if (onEndDateChange) onEndDateChange(value);
    };

    const handleQuickSelect = (days) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        
        setLocalStartDate(startStr);
        setLocalEndDate(endStr);
        
        if (onStartDateChange) onStartDateChange(startStr);
        if (onEndDateChange) onEndDateChange(endStr);
        if (onApply) onApply(startStr, endStr);
    };

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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary, #1a1a1a)' }}>
                    Từ:
                </label>
                <input
                    type="date"
                    value={localStartDate}
                    onChange={handleStartDateChange}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid var(--border-color, #e5e7eb)',
                        borderRadius: '6px',
                        fontSize: '14px'
                    }}
                />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary, #1a1a1a)' }}>
                    Đến:
                </label>
                <input
                    type="date"
                    value={localEndDate}
                    onChange={handleEndDateChange}
                    min={localStartDate}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid var(--border-color, #e5e7eb)',
                        borderRadius: '6px',
                        fontSize: '14px'
                    }}
                />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                    onClick={() => handleQuickSelect(7)}
                    style={{
                        padding: '6px 12px',
                        background: 'var(--bg-tertiary, #f3f4f6)',
                        color: 'var(--text-primary, #1a1a1a)',
                        border: '1px solid var(--border-color, #e5e7eb)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                    }}
                >
                    7 ngày
                </button>
                <button
                    onClick={() => handleQuickSelect(30)}
                    style={{
                        padding: '6px 12px',
                        background: 'var(--bg-tertiary, #f3f4f6)',
                        color: 'var(--text-primary, #1a1a1a)',
                        border: '1px solid var(--border-color, #e5e7eb)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                    }}
                >
                    30 ngày
                </button>
                <button
                    onClick={() => handleQuickSelect(90)}
                    style={{
                        padding: '6px 12px',
                        background: 'var(--bg-tertiary, #f3f4f6)',
                        color: 'var(--text-primary, #1a1a1a)',
                        border: '1px solid var(--border-color, #e5e7eb)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                    }}
                >
                    90 ngày
                </button>
                <button
                    onClick={() => handleQuickSelect(365)}
                    style={{
                        padding: '6px 12px',
                        background: 'var(--bg-tertiary, #f3f4f6)',
                        color: 'var(--text-primary, #1a1a1a)',
                        border: '1px solid var(--border-color, #e5e7eb)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                    }}
                >
                    1 năm
                </button>
            </div>
            {onApply && (
                <button
                    onClick={() => onApply(localStartDate, localEndDate)}
                    style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Icons.Search size={16} />
                    Áp Dụng
                </button>
            )}
        </div>
    );
};

export default DateRangePicker;

