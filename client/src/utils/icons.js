// Icon helper - tập trung tất cả icons ở đây để dễ quản lý
// Sử dụng Custom Icons - SVG tùy chỉnh, không dùng react-icons
import {
    UsersIcon,
    WarehouseIcon,
    OrderIcon,
    ProductIcon,
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
    MoonIcon
} from './customIcons';

// Export các custom icons - hoàn toàn tùy chỉnh, không phụ thuộc react-icons
export const Icons = {
    // Main navigation
    Users: UsersIcon,
    Warehouse: WarehouseIcon,
    Order: OrderIcon,
    Product: ProductIcon,
    Supplier: SupplierIcon,
    Chart: ChartIcon,

    // Actions
    Edit: EditIcon,
    Delete: DeleteIcon,
    Security: SecurityIcon,
    Refresh: RefreshIcon,
    Add: AddIcon,
    Search: SearchIcon,
    Close: CloseIcon,
    Logout: LogoutIcon,

    // Form
    Email: EmailIcon,
    Password: PasswordIcon,

    // Status
    Success: SuccessIcon,
    Warning: WarningIcon,
    Info: InfoIcon,

    // Reports
    File: FileIcon,
    Download: DownloadIcon,
    Loading: LoadingIcon,

    // Settings
    Settings: SettingsIcon,

    // Theme
    Sun: SunIcon,
    Moon: MoonIcon
};

export default Icons;

