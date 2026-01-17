import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Database,
    ShieldAlert,
    Activity,
    Search,
    Settings,
    FileText,
    Briefcase,
    Layers,
    UserCog,
    Loader2
} from 'lucide-react';
import { useEffect } from 'react';
import { apiClient } from '@/utils/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import UserManagementModule from '@/components/admin/master-control/UserManagementModule';
import ProjectRegistryModule from '@/components/admin/master-control/ProjectRegistryModule';
import SystemAuditLogsModule from '@/components/admin/master-control/SystemAuditLogsModule';

const CountUp = ({ value, prefix = "", suffix = "" }: { value: string | number, prefix?: string, suffix?: string }) => {
    const [count, setCount] = useState(0);
    const numericValue = parseInt(value.toString().replace(/[^0-9]/g, '')) || 0;

    useEffect(() => {
        let start = 0;
        const end = numericValue;
        const duration = 2000;
        const incrementTime = 20; // 50fps
        const totalSteps = duration / incrementTime;
        const increment = end / totalSteps;

        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, incrementTime);

        return () => clearInterval(timer);
    }, [numericValue]);

    return <span>{prefix}{count}{suffix}</span>;
}

const MasterControlPage = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [globalSearch, setGlobalSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [stats, setStats] = useState({ users: 0, projects: 0, applications: 0, systemHealth: 98 });
    const [searchResults, setSearchResults] = useState<{ users: any[], projects: any[] }>({ users: [], projects: [] });



    useEffect(() => {
        if (!globalSearch) {
            setIsSearching(false);
            setSearchResults({ users: [], projects: [] });
            return;
        }

        setIsSearching(true);
        const delayDebounce = setTimeout(async () => {
            try {
                // In a real app, use a dedicated search endpoint. 
                // For now, filtering client-side or parallel fetching for demo results
                const [usersRes, projectsRes] = await Promise.all([
                    apiClient.get<{ users: any[] }>('/users'),
                    apiClient.get<{ projects: any[] }>('/projects')
                ]);

                const query = globalSearch.toLowerCase();
                const matchedUsers = (usersRes.data?.users || []).filter((u: any) =>
                    u.name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query)
                ).slice(0, 5); // Limit

                const matchedProjects = (projectsRes.data?.projects || []).filter((p: any) =>
                    p.title?.toLowerCase().includes(query)
                ).slice(0, 5); // Limit

                setSearchResults({ users: matchedUsers, projects: matchedProjects });

            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [globalSearch]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersRes, projectsRes] = await Promise.all([
                    apiClient.get<{ users: any[] }>('/users'),
                    apiClient.get<{ projects: any[] }>('/projects')
                ]);

                setStats({
                    users: usersRes.data?.users?.length || 0,
                    projects: projectsRes.data?.projects?.length || 0,
                    applications: 0, // Placeholder as no endpoint confirmed yet
                    systemHealth: 100
                });
            } catch (error) {
                console.error("Stats fetch error", error);
            }
        };
        fetchStats();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="min-h-screen p-6 space-y-8 max-w-[1600px] mx-auto pb-20"
        >
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-[#154259] rounded-2xl shadow-lg shadow-[#154259]/20">
                            <Activity className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight font-heading">
                                Master Control
                            </h1>
                            <p className="text-slate-500 font-medium">System-wide Administration & Database Control</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative group w-full md:w-96">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#154259] transition-colors" />
                        </div>
                        <Input
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            placeholder="Global Search (Users, Projects)..."
                            className="pl-12 h-12 bg-white/80 backdrop-blur-xl border-slate-200 focus:border-[#154259] rounded-2xl shadow-sm text-base transition-all hover:bg-white"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center">
                            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-slate-50 px-2 font-mono text-[10px] font-medium text-slate-500">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </div>
                    </div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Users', value: stats.users, icon: Users, color: 'sky' },
                    { label: 'Active Projects', value: stats.projects, icon: Briefcase, color: 'cyan' },
                    { label: 'Pending Applications', value: 0, icon: FileText, color: 'indigo' },
                    { label: 'System Health', value: 100, suffix: '%', icon: ShieldAlert, color: 'emerald' },
                ].map((stat, idx) => (
                    <GlassCard key={idx} className="p-6 flex items-center justify-between group hover:border-[#154259]/20 transition-all cursor-default">
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">
                                <CountUp value={stat.value} suffix={stat.suffix} />
                            </h3>
                        </div>
                        <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                    </GlassCard>
                ))}
            </motion.div>

            {/* Main Control Interface */}
            <motion.div variants={itemVariants} className="flex-1">
                <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="h-full space-y-6">
                    {!globalSearch && (
                        <TabsList className="bg-white/50 p-1.5 h-auto gap-2 rounded-[20px] border border-slate-200/60 backdrop-blur-md w-full md:w-fit flex-wrap justify-start">
                            {[
                                { id: 'users', label: 'User Management', icon: UserCog },
                                { id: 'projects', label: 'Project Registry', icon: Database },
                                { id: 'applications', label: 'Applications', icon: Layers },
                                { id: 'groups', label: 'Groups', icon: Users },
                                { id: 'meetings', label: 'Meetings', icon: Activity },
                                { id: 'audit', label: 'Audit Logs', icon: FileText },
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className="px-6 py-3 rounded-2xl text-sm font-bold gap-2.5 data-[state=active]:bg-[#154259] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#154259]/30 transition-all duration-300"
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    )}

                    <GlassCard className="min-h-[600px] p-6 md:p-8 bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/50">

                        {/* Global Search Overlay View */}
                        {globalSearch ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-2 mb-6">
                                    {isSearching ? (
                                        <Loader2 className="w-6 h-6 text-[#154259] animate-spin" />
                                    ) : (
                                        <Search className="w-6 h-6 text-slate-400" />
                                    )}
                                    <h2 className="text-xl font-bold text-slate-800">
                                        {isSearching ? 'Searching...' : 'Search Results'}
                                    </h2>
                                    {!isSearching && <span className="text-slate-400 font-medium">for "{globalSearch}"</span>}
                                </div>

                                {isSearching ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#154259]/50" />
                                        <p>Searching database...</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* User Results */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                <Users className="w-4 h-4" /> Users Found ({searchResults.users.length})
                                            </h3>
                                            {searchResults.users.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {searchResults.users.map((user: any) => (
                                                        <div key={user._id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                                                            <div>
                                                                <div className="font-bold text-slate-800">{user.name}</div>
                                                                <div className="text-xs text-slate-500">{user.email}</div>
                                                            </div>
                                                            <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md capitalize">{user.role}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-slate-400 text-sm italic">No users found.</p>
                                            )}
                                        </div>

                                        <div className="border-t border-slate-100 my-6" />

                                        {/* Project Results */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                <Database className="w-4 h-4" /> Projects Found ({searchResults.projects.length})
                                            </h3>
                                            {searchResults.projects.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {searchResults.projects.map((project: any) => (
                                                        <div key={project._id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                                                            <div>
                                                                <div className="font-bold text-slate-800">{project.title}</div>
                                                                <div className="text-xs text-slate-500 line-clamp-1">{project.description}</div>
                                                            </div>
                                                            <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-md">{project.status}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-slate-400 text-sm italic">No projects found.</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                <TabsContent value="users" className="mt-0 h-full focus-visible:outline-none">
                                    <UserManagementModule searchQuery={globalSearch} />
                                </TabsContent>

                                <TabsContent value="projects" className="mt-0 h-full focus-visible:outline-none">
                                    <ProjectRegistryModule searchQuery={globalSearch} />
                                </TabsContent>

                                <TabsContent value="applications" className="mt-0 h-full focus-visible:outline-none">
                                    <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 space-y-4">
                                        <div className="p-6 bg-slate-50 rounded-full">
                                            <Layers className="w-12 h-12 text-slate-300" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-xl font-bold text-slate-600">Application Management</h3>
                                            <p className="max-w-md mx-auto mt-2">Global application tracking and status overrides coming in the next module update.</p>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="groups" className="mt-0 h-full focus-visible:outline-none">
                                    <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 space-y-4">
                                        <div className="p-6 bg-slate-50 rounded-full">
                                            <Users className="w-12 h-12 text-slate-300" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-xl font-bold text-slate-600">Group Management</h3>
                                            <p className="max-w-md mx-auto mt-2">Manage student teams and group assignments globally.</p>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="meetings" className="mt-0 h-full focus-visible:outline-none">
                                    <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 space-y-4">
                                        <div className="p-6 bg-slate-50 rounded-full">
                                            <Activity className="w-12 h-12 text-slate-300" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-xl font-bold text-slate-600">Meeting Schedules</h3>
                                            <p className="max-w-md mx-auto mt-2">Review and manage all scheduled meetings and evaluations.</p>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="audit" className="mt-0 h-full focus-visible:outline-none">
                                    <SystemAuditLogsModule searchQuery={globalSearch} />
                                </TabsContent>
                            </>
                        )}
                    </GlassCard>
                </Tabs>
            </motion.div>
        </motion.div >
    );
};

export default MasterControlPage;
