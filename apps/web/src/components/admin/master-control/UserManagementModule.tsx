import { useState, useEffect } from 'react';
import {
    MoreHorizontal,
    Search,
    Shield,
    User,
    Mail,
    Check,
    X,
    Loader2,
    Trash2,
    Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/utils/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface UserData {
    _id: string;
    name: string;
    email: string;
    role: string;
    isCoordinator?: boolean; // Added per user request
    googleId?: string;
    createdAt?: string;
}

interface UserManagementModuleProps {
    searchQuery: string;
}

const UserManagementModule = ({ searchQuery }: UserManagementModuleProps) => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [localSearch, setLocalSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [newRole, setNewRole] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get<{ users: UserData[] }>('/users');
            if (response.data?.users) {
                setUsers(response.data.users);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!currentUser || !newRole) return;
        try {
            await apiClient.patch(`/admin/users/${currentUser._id}/role`, { role: newRole });

            // update local state
            setUsers(prev => prev.map(u => u._id === currentUser._id ? { ...u, role: newRole } : u));
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Failed to update role:", error);
            // Fallback: try the generic update endpoint if admin specific one fails (depends on backend imp)
            // But usually admin endpoint is preferred.
            alert("Failed to update user role.");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm("Are you sure? This action is irreversible.")) return;
        try {
            await apiClient.delete(`/admin/users/${userId}`);
            setUsers(prev => prev.filter(u => u._id !== userId));
        } catch (error) {
            console.error("Failed to delete user:", error);
            alert("Failed to delete user.");
        }
    };

    const filteredUsers = users.filter(user => {
        const query = searchQuery || localSearch;
        const matchesSearch =
            user.name?.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase());

        let matchesRole = true;
        if (selectedRole === 'student') {
            matchesRole = ['student', 'idp-student', 'urop-student', 'capstone-student'].includes(user.role);
        } else if (selectedRole !== 'all') {
            matchesRole = user.role === selectedRole;
        }

        return matchesSearch && matchesRole;
    });

    const getRoleColor = (user: UserData) => {
        // Coordinator logic: role='faculty' + isCoordinator=true
        if (user.role === 'faculty' && user.isCoordinator) {
            return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        }

        switch (user.role) {
            case 'admin': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'faculty': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            // Student roles
            case 'student': return 'bg-blue-100 text-blue-700 border-blue-200'; // Fallback
            case 'idp-student': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'urop-student': return 'bg-sky-100 text-sky-700 border-sky-200';
            case 'capstone-student': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    // Helper for proper casing
    const formatRole = (role: string) => {
        if (!role) return '';
        if (role === 'idp-student') return 'IDP Student';
        if (role === 'urop-student') return 'UROP Student';
        if (role === 'capstone-student') return 'Capstone Student';
        return role.charAt(0).toUpperCase() + role.slice(1);
    }

    const getDisplayRole = (user: UserData) => {
        if (user.role === 'faculty' && user.isCoordinator) return 'Coordinator';
        return formatRole(user.role);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-800">System Users</h2>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                        {filteredUsers.length} Total
                    </Badge>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Filter list..."
                            value={localSearch}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSearch(e.target.value)}
                            className="pl-9 w-64 h-10 bg-white"
                        />
                    </div>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="w-[160px] h-10 bg-white">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <SelectValue placeholder="Role" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="student">Any Student</SelectItem>
                            <SelectItem value="idp-student">IDP Student</SelectItem>
                            <SelectItem value="urop-student">UROP Student</SelectItem>
                            <SelectItem value="capstone-student">Capstone Student</SelectItem>
                            <SelectItem value="faculty">Faculty</SelectItem>
                            <SelectItem value="coordinator">Coordinator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="w-[30%]">User Profile</TableHead>
                            <TableHead className="w-[20%] text-center">Role</TableHead>
                            <TableHead className="w-[20%] text-center">Email Status</TableHead>
                            <TableHead className="w-[15%] text-center">Joined Date</TableHead>
                            <TableHead className="w-[15%] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                        <p>Loading users...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-slate-400">
                                    No users found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">
                                                {user.name?.charAt(0) || <User className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{user.name || 'Unknown User'}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                                    <Mail className="w-3 h-3" /> {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getRoleColor(user)} capitalize shadow-sm`}>
                                                {getDisplayRole(user)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-fit border border-emerald-100">
                                                <Check className="w-3.5 h-3.5" /> Verified
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm font-medium text-center">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => { setCurrentUser(user); setNewRole(user.role); setIsEditModalOpen(true); }}>
                                                    <Shield className="mr-2 h-4 w-4" /> Manage Role
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>
                                                    <Mail className="mr-2 h-4 w-4" /> Copy Email
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-rose-600 focus:bg-rose-50" onClick={() => handleDeleteUser(user._id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Role Dialog */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User Role</DialogTitle>
                        <DialogDescription>
                            Change access permissions for <span className="font-bold text-slate-800">{currentUser?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Role</label>
                            <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="idp-student">IDP Student</SelectItem>
                                    <SelectItem value="urop-student">UROP Student</SelectItem>
                                    <SelectItem value="capstone-student">Capstone Student</SelectItem>
                                    <SelectItem value="faculty">Faculty</SelectItem>
                                    <SelectItem value="coordinator">Coordinator</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500">
                                Warning: Changing to 'student' will revoke all administrative privileges.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateRole} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            Update Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserManagementModule;
