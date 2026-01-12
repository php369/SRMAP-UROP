import type { LucideProps } from 'lucide-react';
import {
    Home,
    FileText,
    FolderOpen,
    Upload,
    Award,
    User,
    Users,
    BookOpen,
    BarChart3,
    Settings,
    CheckCircle,
    Calendar,
    Bell,
    Inbox,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Sun,
    Moon,
    AlertTriangle,
    Info,
    CheckCircle2,
    Menu,
    X,
    ChevronsLeft,
    ChevronsRight,
    Search,
    Plus,
    Trash2,
    Edit2,
    Eye,
    Download,
    Filter,
    MoreVertical,
    ArrowRight,
    ArrowLeft,
    Zap,
    Lock,
    RefreshCw,
    UserCheck,
    Maximize2,
} from 'lucide-react';

// Helper to enforce defaults while allowing overrides
const withDefaults = (Icon: React.ComponentType<LucideProps>) => (props: LucideProps) => (
    <Icon strokeWidth={1.5} size={24} {...props} />
);

// Navigation & Sidebar Icons
export const HomeIcon = withDefaults(Home);
export const FileTextIcon = withDefaults(FileText);
export const FolderOpenIcon = withDefaults(FolderOpen);
export const UploadIcon = withDefaults(Upload);
export const AwardIcon = withDefaults(Award);
export const UserIcon = withDefaults(User);
export const UsersIcon = withDefaults(Users);
export const BookOpenIcon = withDefaults(BookOpen);
export const BarChart3Icon = withDefaults(BarChart3);
export const SettingsIcon = withDefaults(Settings);
export const CheckCircleIcon = withDefaults(CheckCircle);
export const CalendarIcon = withDefaults(Calendar);

// UI Elements
export const BellIcon = withDefaults(Bell);
export const InboxIcon = withDefaults(Inbox);
export const ChevronDownIcon = withDefaults(ChevronDown);
export const ChevronLeftIcon = withDefaults(ChevronLeft);
export const ChevronRightIcon = withDefaults(ChevronRight);
export const ChevronsLeftIcon = withDefaults(ChevronsLeft);
export const ChevronsRightIcon = withDefaults(ChevronsRight);
export const LogOutIcon = withDefaults(LogOut);
export const SunIcon = withDefaults(Sun);
export const MoonIcon = withDefaults(Moon);
export const MenuIcon = withDefaults(Menu);
export const XIcon = withDefaults(X);
export const SearchIcon = withDefaults(Search);
export const PlusIcon = withDefaults(Plus);
export const Trash2Icon = withDefaults(Trash2);
export const Edit2Icon = withDefaults(Edit2);
export const EyeIcon = withDefaults(Eye);
export const DownloadIcon = withDefaults(Download);
export const FilterIcon = withDefaults(Filter);
export const MoreVerticalIcon = withDefaults(MoreVertical);
export const ArrowRightIcon = withDefaults(ArrowRight);
export const ArrowLeftIcon = withDefaults(ArrowLeft);

export const ZapIcon = withDefaults(Zap);
export const LockIcon = withDefaults(Lock);
export const RefreshCwIcon = withDefaults(RefreshCw);
export const UserCheckIcon = withDefaults(UserCheck);
export const Maximize2Icon = withDefaults(Maximize2);

// Status Icons
export const AlertTriangleIcon = withDefaults(AlertTriangle);
export const InfoIcon = withDefaults(Info);
export const CheckCircle2Icon = withDefaults(CheckCircle2); // Often used for success
export const WarningIcon = withDefaults(AlertTriangle); // Alias
export const SuccessIcon = withDefaults(CheckCircle2); // Alias
