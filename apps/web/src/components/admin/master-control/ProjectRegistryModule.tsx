import { useState, useEffect } from 'react';
import {
    MoreHorizontal,
    Search,
    Briefcase,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    FileEdit,
    AlertTriangle,
    Eye,
    FileText,
    Calendar,
    User
} from 'lucide-react';
import { apiClient } from '@/utils/api';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Project {
    _id: string;
    title: string;
    description: string;
    department: string;
    status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
    type: 'IDP' | 'UROP' | 'CAPSTONE';
    faculty: {
        name: string;
        email: string;
        _id: string;
    };
    facultyId?: string | {
        _id: string;
        name: string;
        email: string;
    };
    facultyName?: string;
    brief?: string;
    prerequisites?: string;
    createdAt: string;
}

interface ProjectRegistryProps {
    searchQuery: string;
}

const ProjectRegistryModule = ({ searchQuery }: ProjectRegistryProps) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [localSearch, setLocalSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const [projectsRes, usersRes] = await Promise.all([
                apiClient.get<{ projects: Project[] }>('/projects'),
                apiClient.get<{ users: any[] }>('/users')
            ]);

            const users = usersRes.data?.users || [];
            // Create a map of ID -> Name
            const userMap = new Map(users.map((u: any) => [u._id, u.name]));

            let fetchedProjects = projectsRes.data?.projects || [];
            // @ts-ignore
            if (projectsRes.data && Array.isArray(projectsRes.data)) fetchedProjects = projectsRes.data;

            // Map faculty names if missing
            // Map faculty names from various possible sources
            const enrichedProjects = fetchedProjects.map(p => {
                let finalFacultyName = 'Unknown Faculty';

                // 1. Try p.facultyId (if it's an object with name)
                if (typeof p.facultyId === 'object' && p.facultyId?.name) { // @ts-ignore
                    finalFacultyName = p.facultyId.name;
                }
                // 2. Try p.facultyName (string field)
                else if (p.facultyName) {
                    finalFacultyName = p.facultyName.split('|')[0].trim();
                }
                // 3. Try p.faculty.name (if valid)
                else if (p.faculty?.name && p.faculty.name !== 'Unknown') {
                    finalFacultyName = p.faculty.name;
                }
                // 4. Try mapping by ID if facultyId is a string
                else if (typeof p.facultyId === 'string' && userMap.has(p.facultyId)) {
                    finalFacultyName = userMap.get(p.facultyId) || 'Unknown Faculty';
                }

                return {
                    ...p,
                    faculty: {
                        ...p.faculty,
                        name: finalFacultyName
                    }
                };
            });

            console.log('Enriched Projects:', enrichedProjects); // Debug log
            setProjects(enrichedProjects);
        } catch (error) {
            // If main endpoint fails, try /projects/public as fallback for demo
            try {
                const publicRes = await apiClient.get<Project[]>('/projects/public');
                // @ts-ignore
                setProjects(publicRes.data || []);
            } catch (e) {
                console.error("Failed to fetch projects");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (projectId: string, newStatus: string) => {
        if (!confirm(`Force update status to ${newStatus}?`)) return;
        try {
            // Admin override endpoint
            await apiClient.patch(`/admin/projects/${projectId}/status`, { status: newStatus });
            setProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: newStatus as any } : p));
        } catch (e) {
            alert('Failed to update status.');
        }
    };

    const filteredProjects = projects.filter(project => {
        const query = searchQuery || localSearch;
        const matchesSearch =
            project.title.toLowerCase().includes(query.toLowerCase()) ||
            project.faculty?.name?.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
        const matchesType = typeFilter === 'all' || project.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                {/* ... existing header ... */}
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-800">Project Registry</h2>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                        {filteredProjects.length} Projects
                    </Badge>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search projects..."
                            value={localSearch}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSearch(e.target.value)}
                            className="pl-9 w-64 h-10 bg-white"
                        />
                    </div>
                    {/* ... Selects ... */}
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[130px] h-10 bg-white">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="IDP">IDP</SelectItem>
                            <SelectItem value="UROP">UROP</SelectItem>
                            <SelectItem value="CAPSTONE">Capstone</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] h-10 bg-white">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <Table>
                    {/* ... Header ... */}
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="w-[30%] pl-6">Project Details</TableHead>
                            <TableHead className="w-[10%] text-center">Type</TableHead>
                            <TableHead className="w-[30%] text-center">Faculty Lead</TableHead>
                            <TableHead className="w-[15%] text-center">Status</TableHead>
                            <TableHead className="w-[15%] text-center pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-slate-400">Loading projects...</TableCell>
                            </TableRow>
                        ) : filteredProjects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-slate-400">No projects found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredProjects.map((project) => (
                                <TableRow key={project._id} className="group hover:bg-slate-50/50">
                                    <TableCell className="pl-6">
                                        <div className="space-y-1">
                                            <div className="font-bold text-slate-800 line-clamp-1 text-base">{project.title}</div>
                                            <div className="text-xs text-slate-500 line-clamp-1">{project.department}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            <Badge variant="outline" className={`font-bold tracking-wider border-0 ${project.type === 'IDP' ? 'bg-blue-50 text-blue-600' :
                                                project.type === 'UROP' ? 'bg-sky-100 text-sky-700' :
                                                    'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                {project.type}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 text-[10px] font-bold ring-1 ring-indigo-100">
                                                {project.faculty?.name?.charAt(0) || <User className="w-3 h-3" />}
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 capitalize">
                                                {project.faculty?.name?.toLowerCase() || 'Unknown'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-2 items-center">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(project.status)} capitalize flex items-center gap-1.5 w-fit shadow-sm`}>
                                                {project.status === 'published' && <CheckCircle2 className="w-3 h-3" />}
                                                {project.status === 'pending' && <Clock className="w-3 h-3" />}
                                                {project.status === 'rejected' && <XCircle className="w-3 h-3" />}
                                                {project.status}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center pr-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Admin Controls</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => { setSelectedProject(project); setIsDetailsOpen(true); }}>
                                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-rose-600">
                                                    <XCircle className="mr-2 h-4 w-4" /> Delete Project
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

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white rounded-3xl">
                    <div className="h-24 bg-[#154259] relative">
                        <div className="absolute -bottom-12 left-8 p-1.5 bg-white rounded-2xl shadow-sm">
                            <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center">
                                <Briefcase className="w-10 h-10 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    <div className="px-8 pt-16 pb-8">
                        <DialogHeader className="mb-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <DialogTitle className="text-2xl font-black text-slate-900 leading-tight">
                                        {selectedProject?.title}
                                    </DialogTitle>
                                    <DialogDescription className="text-base font-medium text-slate-500 mt-1 flex items-center gap-2">
                                        <span>{selectedProject?.department}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                        <span className="text-slate-400">Ref: {selectedProject?._id}</span>
                                    </DialogDescription>
                                </div>
                                <Badge className={`text-sm px-3 py-1 ${selectedProject?.type === 'IDP' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' :
                                    selectedProject?.type === 'UROP' ? 'bg-sky-100 text-sky-700 hover:bg-sky-200' :
                                        'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                    }`}>
                                    {selectedProject?.type}
                                </Badge>
                            </div>
                        </DialogHeader>

                        {selectedProject && (
                            <div className="grid grid-cols-3 gap-8">
                                <div className="col-span-2 space-y-6">
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <FileText className="w-3 h-3" /> Description
                                        </h4>
                                        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
                                            <p>{selectedProject.brief || selectedProject.description || "No description provided."}</p>
                                        </div>
                                    </div>

                                    {selectedProject.prerequisites && (
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Filter className="w-3 h-3" /> Prerequisites
                                            </h4>
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700">
                                                {selectedProject.prerequisites}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm space-y-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Faculty Lead</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold">
                                                {selectedProject.faculty?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm">{selectedProject.faculty?.name}</div>
                                                <div className="text-xs text-slate-500">{selectedProject.faculty?.email}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm space-y-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</h4>
                                        <div className={`px-3 py-2 rounded-xl text-sm font-bold border ${getStatusColor(selectedProject.status)} capitalize flex items-center gap-2 justify-center`}>
                                            {selectedProject.status}
                                        </div>
                                        <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400">
                                            <span>Created</span>
                                            <span>{new Date(selectedProject.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProjectRegistryModule;
