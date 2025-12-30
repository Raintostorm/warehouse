// Icon helper - tập trung tất cả icons ở đây để dễ quản lý
// Sử dụng Custom Icons - SVG tùy chỉnh, không dùng react-icons
import {
    UsersIcon,
    WarehouseIcon,
    OrderIcon,
    ProductIcon,
    PackageIcon,
    SupplierIcon,
    ChartIcon,
    EditIcon,
    DeleteIcon,
    SecurityIcon,
    RefreshIcon,
    AddIcon,
    SearchIcon,
    CloseIcon,
    LogoutIcon,
    EmailIcon,
    PasswordIcon,
    SuccessIcon,
    WarningIcon,
    InfoIcon,
    FileIcon,
    DownloadIcon,
    LoadingIcon,
    SettingsIcon,
    SunIcon,
    MoonIcon,
    HistoryIcon,
    EyeIcon
} from './customIcons';

// Export các custom icons - hoàn toàn tùy chỉnh, không phụ thuộc react-icons
export const Icons = {
    // Main navigation
    Users: UsersIcon,
    Warehouse: WarehouseIcon,
    Order: OrderIcon,
    Product: ProductIcon,
    Package: PackageIcon,
    Supplier: SupplierIcon,
    Chart: ChartIcon,

    // Actions
    Edit: EditIcon,
    Delete: DeleteIcon,
    Security: SecurityIcon,
    Refresh: RefreshIcon,
    RefreshCw: RefreshIcon, // Alias
    Add: AddIcon,
    Plus: AddIcon, // Alias
    Search: SearchIcon,
    Close: CloseIcon,
    X: CloseIcon, // Alias
    Logout: LogoutIcon,

    // Form
    Email: EmailIcon,
    Password: PasswordIcon,

    // Status
    Success: SuccessIcon,
    Warning: WarningIcon,
    AlertTriangle: WarningIcon, // Alias
    AlertCircle: WarningIcon, // Alias
    Info: InfoIcon,
    CheckCircle: SuccessIcon, // Alias
    XCircle: DeleteIcon, // Alias

    // Reports
    File: FileIcon,
    Download: DownloadIcon,
    Loading: LoadingIcon,
    Loader: LoadingIcon, // Alias

    // Settings
    Settings: SettingsIcon,

    // Theme
    Sun: SunIcon,
    Moon: MoonIcon,

    // Additional icons
    History: HistoryIcon,
    Clock: HistoryIcon, // Alias
    Eye: EyeIcon,
    ArrowRightLeft: RefreshIcon // Using RefreshIcon as placeholder
};

export default Icons;

