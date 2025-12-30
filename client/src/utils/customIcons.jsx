// Custom Icon Components - Thay thế hoàn toàn react-icons
// Tất cả icons được vẽ bằng SVG tùy chỉnh

import React from 'react';

// Base Icon Component
const Icon = ({ children, size = 24, color = 'currentColor', ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
        {...props}
    >
        {children}
    </svg>
);

// Users Icon
export const UsersIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
);

// Warehouse/Building Icon
export const WarehouseIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-4" />
        <line x1="9" y1="9" x2="9" y2="21" />
        <line x1="13" y1="13" x2="13" y2="21" />
    </Icon>
);

// Order/Cube Icon
export const OrderIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
    </Icon>
);

// Product/Shopping Bag Icon
export const ProductIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </Icon>
);

// Package/Box Icon (for Inventory)
export const PackageIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
        <line x1="7" y1="10" x2="12" y2="12" />
        <line x1="17" y1="10" x2="12" y2="12" />
    </Icon>
);

// Supplier/Building Icon (same as warehouse but different style)
export const SupplierIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
    </Icon>
);

// Chart Icon
export const ChartIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </Icon>
);

// Edit/Pencil Icon
export const EditIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Icon>
);

// Delete/Trash Icon
export const DeleteIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </Icon>
);

// Security/Lock Icon
export const SecurityIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Icon>
);

// Refresh Icon
export const RefreshIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </Icon>
);

// Add/Plus Icon
export const AddIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </Icon>
);

// Search Icon
export const SearchIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
    </Icon>
);

// Close/X Icon
export const CloseIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </Icon>
);

// Logout Icon
export const LogoutIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </Icon>
);

// Email Icon
export const EmailIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </Icon>
);

// Password/Key Icon
export const PasswordIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </Icon>
);

// Success/Check Circle Icon
export const SuccessIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </Icon>
);

// Warning Icon
export const WarningIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </Icon>
);

// Info Icon
export const InfoIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </Icon>
);

// File/Document Icon
export const FileIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </Icon>
);

// Download Icon
export const DownloadIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </Icon>
);

// Loading/Spinner Icon
export const LoadingIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props} style={{ animation: 'spin 1s linear infinite', ...props.style }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        <style>{`
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `}</style>
    </Icon>
);

// Settings/Cog Icon
export const SettingsIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
    </Icon>
);

// Sun Icon
export const SunIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </Icon>
);

// Moon Icon
export const MoonIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Icon>
);

// History/Clock Icon
export const HistoryIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </Icon>
);

// Eye/View Icon
export const EyeIcon = ({ size, color, ...props }) => (
    <Icon size={size} color={color} {...props}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </Icon>
);

