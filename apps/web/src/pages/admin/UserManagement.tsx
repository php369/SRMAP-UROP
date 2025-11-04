import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserManagementFilter, BulkUserAction } from '../../types';
import { GlassCard, Badge, Input, LoadingSpinner, GlowButton } from '../../components/ui';


// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice.johnson@srmap.edu.in',
    role: 'student',
    profile: {
      department: 'Computer Science',
      year: 3,
      skills: [],
      interests: [],
      education: [],
      achievements: [],
    },
    preferences: { theme: 'dark', notifications: true },
    createdAt: '2023-08-01T00:00:00Z',
    updatedAt: '2024-01-28T00:00:00Z',
  },
  {
    id: '2',
    name: 'Dr. Bob Smith',
    email: 'bob.smith@srmap.edu.in',
    role: 'faculty',
    profile: {
      department: 'Computer Science',
      skills: [],
      interests: [],
      education: [],
      achievements: [],
    },
    preferences: { theme: 'light', notifications: true },
    createdAt: '2022-01-15T00:00:00Z',
    updatedAt: '2024-01-27T00:00:00Z',
  },
  {
    id: '3',
    name: 'Carol Davis',
    email: 'carol.davis@srmap.edu.in',
    role: 'admin',
    profile: {
      department: 'Administration',
      skills: [],
      interests: [],
      education: [],
      achievements: [],
    },
    preferences: { theme: 'dark', notifications: true },
    createdAt: '2021-06-01T00:00:00Z',
    updatedAt: '2024-01-28T00:00:00Z',
  },
  // Add more mock users...
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `user_${i + 4}`,
    name: `User ${i + 4}`,
    email: `user${i + 4}@srmap.edu.in`,
    role: ['student', 'faculty', 'admin'][Math.floor(Math.random() * 3)] as User['role'],
    profile: {
      department: ['Computer Science', 'Electronics', 'Mechanical', 'Civil'][Math.floor(Math.random() * 4)],
      year: Math.floor(Math.random() * 4) + 1,
      skills: [],
      interests: [],
      education: [],
      achievements: [],
    },
    preferences: { theme: 'dark' as const, notifications: true },
    createdAt: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    updatedAt: new Date(2024, 0, Math.floor(Math.random() * 28) + 1).toISOString(),
  })),
];

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<UserManagementFilter>({});
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter users based on current filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Role filter
      if (filters.role?.length && !filters.role.includes(user.role)) {
        return false;
      }

      // Department filter
      if (filters.department?.length && !filters.department.includes(user.profile.department || '')) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchableText = [
          user.name,
          user.email,
          user.profile.department,
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [users, filters]);

  // Paginate filtered users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
    }
  };

  const handleBulkAction = async (action: BulkUserAction) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update users based on action
      setUsers(prev => prev.map(user => {
        if (action.userIds.includes(user.id)) {
          switch (action.action) {
            case 'changeRole':
              return { ...user, role: action.parameters?.newRole || user.role };
            case 'activate':
            case 'deactivate':
            case 'suspend':
              // In a real app, this would update user status
              return user;
            default:
              return user;
          }
        }
        return user;
      }));

      if (action.action === 'delete') {
        setUsers(prev => prev.filter(user => !action.userIds.includes(user.id)));
      }

      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    console.log('Edit user:', user);
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'student':
        return 'bg-info';
      case 'faculty':
        return 'bg-success';
      case 'admin':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };

  const departments = [...new Set(users.map(u => u.profile.department).filter(Boolean))];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">User Management</h1>
            <p className="text-textSecondary">
              Manage users, roles, and permissions across the platform
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {selectedUsers.size > 0 && (
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-4 py-2 bg-warning/20 text-warning border border-warning/30 rounded-lg hover:bg-warning/30 transition-colors"
              >
                Bulk Actions ({selectedUsers.size})
              </button>
            )}
            
            <GlowButton>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </GlowButton>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <GlassCard variant="subtle" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <Input
                type="text"
                placeholder="Search users..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value || undefined }))}
              />

              {/* Role Filter */}
              <select
                value={filters.role?.[0] || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  role: e.target.value ? [e.target.value as User['role']] : undefined 
                }))}
                className="px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>

              {/* Department Filter */}
              <select
                value={filters.department?.[0] || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  department: e.target.value ? [e.target.value] : undefined 
                }))}
                className="px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              {/* Clear Filters */}
              <button
                onClick={() => setFilters({})}
                className="px-4 py-2 bg-error/20 text-error rounded-lg hover:bg-error/30 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {showBulkActions && selectedUsers.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 overflow-hidden"
            >
              <GlassCard variant="elevated" className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-text font-medium">
                    {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleBulkAction({
                        action: 'changeRole',
                        userIds: Array.from(selectedUsers),
                        parameters: { newRole: 'student' }
                      })}
                      className="px-3 py-1.5 bg-info/20 text-info rounded hover:bg-info/30 transition-colors text-sm"
                    >
                      Make Student
                    </button>
                    <button
                      onClick={() => handleBulkAction({
                        action: 'changeRole',
                        userIds: Array.from(selectedUsers),
                        parameters: { newRole: 'faculty' }
                      })}
                      className="px-3 py-1.5 bg-success/20 text-success rounded hover:bg-success/30 transition-colors text-sm"
                    >
                      Make Faculty
                    </button>
                    <button
                      onClick={() => handleBulkAction({
                        action: 'suspend',
                        userIds: Array.from(selectedUsers)
                      })}
                      className="px-3 py-1.5 bg-warning/20 text-warning rounded hover:bg-warning/30 transition-colors text-sm"
                    >
                      Suspend
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${selectedUsers.size} user(s)?`)) {
                          handleBulkAction({
                            action: 'delete',
                            userIds: Array.from(selectedUsers)
                          });
                        }
                      }}
                      className="px-3 py-1.5 bg-error/20 text-error rounded hover:bg-error/30 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassCard variant="elevated" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface/50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary focus:ring-2"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text">User</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text">Department</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text">Last Active</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-surface/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleUserSelect(user.id)}
                          className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-text">{user.name}</div>
                            <div className="text-sm text-textSecondary">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="glass" className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-text">
                        {user.profile.department || 'N/A'}
                        {user.profile.year && (
                          <div className="text-sm text-textSecondary">Year {user.profile.year}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-textSecondary">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-textSecondary">
                        {formatDate(user.updatedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 text-textSecondary hover:text-primary transition-colors"
                            title="Edit user"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                                handleBulkAction({
                                  action: 'delete',
                                  userIds: [user.id]
                                });
                              }
                            }}
                            className="p-2 text-textSecondary hover:text-error transition-colors"
                            title="Delete user"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-textSecondary">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 bg-surface border border-border rounded text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface/80 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1.5 text-text">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 bg-surface border border-border rounded text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface/80 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-white">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
