import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/utils/api';
import {
    FileText,
    Search,
    Filter,
    Download,
    ShieldAlert,
    UserCog,
    Database,
    Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ActivityLog } from '@/types';

interface AuditLogsProps {
    searchQuery: string;
}

const SystemAuditLogsModule = ({ searchQuery }: AuditLogsProps) => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [localSearch, setLocalSearch] = useState('');

    useEffect(() => {
        // Simulation of fetching logs
        const fetchLogs = async () => {
            setLoading(true);
            try {
                // Try real endpoint first
                const res = await apiClient.get<ActivityLog[]>('/audit');
                setLogs(res.data || []);
            } catch (err) {
                console.error("Failed to fetch logs", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const query = (searchQuery || localSearch).toLowerCase();
        return (
            log.action.toLowerCase().includes(query) ||
            log.userName.toLowerCase().includes(query) ||
            log.resource.toLowerCase().includes(query)
        );
    });

    const getActionIcon = (action: string) => {
        if (action.includes('USER')) return <UserCog className="w-4 h-4 text-blue-500" />;
        if (action.includes('PROJECT')) return <Database className="w-4 h-4 text-emerald-500" />;
        if (action.includes('BACKUP') || action.includes('SYSTEM')) return <ShieldAlert className="w-4 h-4 text-rose-500" />;
        return <FileText className="w-4 h-4 text-slate-500" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-800">System Audit Logs</h2>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                        {logs.length} Events
                    </Badge>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search logs..."
                            value={localSearch}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSearch(e.target.value)}
                            className="pl-9 w-64 h-10 bg-white"
                        />
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" /> Export CSV
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Resource</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead className="text-right">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-slate-400">Loading logs...</TableCell>
                            </TableRow>
                        ) : filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-slate-400">No logs found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredLogs.map((log) => (
                                <TableRow key={log.id} className="group hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                                                {getActionIcon(log.action)}
                                            </div>
                                            <span className="font-mono text-xs font-bold text-slate-600">{log.action}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-900">{log.userName}</div>
                                        <div className="text-xs text-slate-400">ID: {log.userId}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                            {log.resource}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs font-mono text-slate-500">
                                        {log.ipAddress || '-'}
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-slate-500">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default SystemAuditLogsModule;
