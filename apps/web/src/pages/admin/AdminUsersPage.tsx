import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, GlowButton, Badge } from '../../components/ui';
import { fadeUp, staggerContainer, staggerItem } from '../../utils/animations';
import { apiClient } from '../../utils/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  profile: {
    department?: string;
    year?: number;
  };
  lastSeen: string;
  createdAt: string;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    role: '',
    department: '',
    search: ''
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<'student' | 'faculty' | 'admin'>('student');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {};
      if (filters.role) params.role = filters.role;
      if (filters.department) params.department = filters.department;
      if (filters.search) params.search = filters.search;

      const response = await apiClient.get('/admin/users', params);

      if (response.success && response.data) {
        setUsers(response.data.users || []);
      } else {
        setError(response.error?.message || 'Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    setUpdating(true);
    try {
      const response = await apiClient.patch(`/admin/users/${selectedUser._id}/role`, {
        role: newRole
      });

      if (response.success) {
        await fetchUsers();
        setShowRoleModal(false);
        setSelectedUser(null);
      } else {
        setError(response.error?.message || 'Failed to update role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);

      if (response.success) {
        await fetchUsers();
      } else {
        setError(response.error?.message || 'Failed to delete user');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-error/20 text-error border-error/30';
      case 'faculty': return 'bg-secondary/20 text-secondary border-secondary/30';
      case 'student': return 'bg-primary/20 text-primary border-primary/30';
      default: return 'bg-white/10 text-textSecondary border-white/20';
    }
  };

  return (
    <div className="min-h-screen p-8">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeUp}>
          <h1 className="text-3xl font-bold text-text mb-2">User Management</h1>
          <p className="text-textSecondary">Manage users and their roles</p>
        </motion.div>

        {/* Filters */}
        <motion.div variants={staggerItem}>
          <GlassCard variant="elevated" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Roles</option>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Department</label>
                <input
                  type="text"
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  placeholder="Filter by department"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search by name or email"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div variants={staggerItem}>
            <GlassCard variant="elevated" className="p-4 bg-error/10 border-error/30">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-error">{error}</p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Users Table */}
        <motion.div variants={staggerItem}>
          <GlassCard variant="elevated" className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-textSecondary mt-4">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-textSecondary">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text">Department</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text">Last Seen</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-text">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-text">{user.name}</td>
                        <td className="py-3 px-4 text-textSecondary text-sm">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-textSecondary text-sm">{user.profile?.department || '-'}</td>
                        <td className="py-3 px-4 text-textSecondary text-sm">
                          {new Date(user.lastSeen).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.role);
                                setShowRoleModal(true);
                              }}
                              className="px-3 py-1 text-sm bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                            >
                              Change Role
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="px-3 py-1 text-sm bg-error/20 text-error rounded-lg hover:bg-error/30 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Role Update Modal */}
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface border border-white/10 rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-text mb-4">Update User Role</h3>
              <p className="text-textSecondary mb-4">
                Change role for <span className="font-semibold text-text">{selectedUser.name}</span>
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-text mb-2">New Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-white/5 text-text rounded-lg hover:bg-white/10 transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRole}
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
