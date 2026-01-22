import { useState, useEffect, useMemo } from 'react';
import { EvaluatorListSkeleton } from '../LoadingSkeletons';
import { Search, Users, RefreshCw, Zap, AlertCircle, ChevronDown, UserCheck, AlertTriangle, Layers } from 'lucide-react';
import { useExternalEvaluators } from '../../hooks/useExternalEvaluators';
import { AssignmentCard } from './AssignmentCard';
import { EvaluatorStats } from './EvaluatorStats';
import { ExternalEvaluatorsEmptyState } from './ExternalEvaluatorsEmptyState';
import { WorkloadDistributionModal } from './WorkloadDistributionModal';
import { useWindowStatus } from '../../../../../hooks/useWindowStatus';
import { ProjectType } from '../../types';
import { Button } from '../../../../../components/ui/Button';
import { Input } from '../../../../../components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../../components/ui/dropdown-menu";
import { toast } from 'sonner';
import { cn } from '../../../../../utils/cn';

export function ExternalEvaluatorsTab() {
  const { windows, loading: windowsLoading, isApplicationOpen } = useWindowStatus();

  // Check if any application window is currently active
  const anyApplicationWindowActive = useMemo(() => {
    return ['IDP', 'UROP', 'CAPSTONE'].some(type => isApplicationOpen(type));
  }, [isApplicationOpen]);

  // Check which project types have ended application windows
  const endedApplicationWindowTypes = useMemo(() => {
    return (['IDP', 'UROP', 'CAPSTONE'] as ProjectType[]).filter(type => {
      const hasEndedWindow = windows.some(
        w => w.windowType === 'application' &&
          w.projectType === type &&
          new Date() > new Date(w.endDate)
      );
      return hasEndedWindow;
    });
  }, [windows]);

  const {
    assignments,
    evaluators,
    loading,
    assignmentsLoading,
    evaluatorsLoading,
    validationResult,
    fetchAssignments,
    fetchEvaluators,
    validateAssignments,
    autoAssignEvaluators,
    assignEvaluatorToGroup,
    assignEvaluatorToSoloStudent,
    removeEvaluatorFromGroup,
    removeEvaluatorFromSoloStudent
  } = useExternalEvaluators();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [filterSubmissionType, setFilterSubmissionType] = useState<'all' | 'group' | 'solo'>('all');
  const [filterProjectType, setFilterProjectType] = useState<'all' | 'IDP' | 'UROP' | 'CAPSTONE'>('all');
  const [isWorkloadModalOpen, setIsWorkloadModalOpen] = useState(false);

  // Load data on component mount
  useEffect(() => {
    if (windowsLoading) return;
    if (anyApplicationWindowActive) return;

    const loadData = async () => {
      await Promise.all([fetchAssignments(), fetchEvaluators(), validateAssignments()]);
    };
    loadData();
  }, [fetchAssignments, fetchEvaluators, validateAssignments, windowsLoading, anyApplicationWindowActive]);

  // Filter assignments based on search and filters
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        (assignment.submissionType === 'group' &&
          (assignment.groupId?.groupCode?.toLowerCase().includes(searchLower) ||
            assignment.groupId?.assignedProjectId?.title?.toLowerCase().includes(searchLower) ||
            assignment.groupId?.members?.some(member =>
              member.name.toLowerCase().includes(searchLower)
            ))) ||
        (assignment.submissionType === 'solo' &&
          (assignment.studentId?.name?.toLowerCase().includes(searchLower) ||
            assignment.studentId?.assignedProjectId?.title?.toLowerCase().includes(searchLower)));

      // Status filter
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'assigned' && assignment.isAssigned) ||
        (filterStatus === 'unassigned' && !assignment.isAssigned);

      // Submission Type filter
      const matchesSubmissionType = filterSubmissionType === 'all' || assignment.submissionType === filterSubmissionType;

      // Project Type filter
      const getPType = () => {
        if (assignment.submissionType === 'group') return assignment.groupId?.assignedProjectId?.type;
        return assignment.studentId?.assignedProjectId?.type;
      };
      const matchesProjectType = filterProjectType === 'all' || getPType() === filterProjectType;

      return matchesSearch && matchesStatus && matchesSubmissionType && matchesProjectType;
    });
  }, [assignments, searchTerm, filterStatus, filterSubmissionType, filterProjectType]);

  const handleAssignEvaluator = async (assignmentId: string, evaluatorId: string, submissionType: 'group' | 'solo') => {
    if (submissionType === 'group') {
      return await assignEvaluatorToGroup(assignmentId, evaluatorId);
    } else {
      return await assignEvaluatorToSoloStudent(assignmentId, evaluatorId);
    }
  };

  const handleRemoveEvaluator = async (assignmentId: string, submissionType: 'group' | 'solo') => {
    if (submissionType === 'group') {
      return await removeEvaluatorFromGroup(assignmentId);
    } else {
      return await removeEvaluatorFromSoloStudent(assignmentId);
    }
  };

  const handleAutoAssign = async (type: ProjectType) => {
    const isAppWindowEnded = windows.some(window =>
      window.windowType === 'application' &&
      window.projectType === type &&
      new Date() > new Date(window.endDate)
    );

    if (!isAppWindowEnded) {
      toast.error(`Application phase for ${type} is still active. Cannot assign evaluators yet.`);
      return;
    }

    const validation = await validateAssignments(type);
    if (validation && !validation.isValid) {
      const proceed = window.confirm(
        `Assignment validation for ${type} found issues:\n${validation.issues.join('\n')}\n\nDo you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    const success = await autoAssignEvaluators(type);
    if (success) {
      await Promise.all([fetchAssignments(), fetchEvaluators(), validateAssignments()]);
      toast.success(`Auto-assignment process completed for ${type}`);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchAssignments(), fetchEvaluators(), validateAssignments()]);
    toast.success('Data refreshed');
  };

  if (windowsLoading) {
    return <EvaluatorListSkeleton />;
  }

  if (anyApplicationWindowActive) {
    return (
      <div className="flex items-center justify-center py-8">
        <ExternalEvaluatorsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text">External Evaluator Assignment</h2>
            <p className="text-sm text-textSecondary">
              Manage external evaluator assignments across project types
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={assignmentsLoading || evaluatorsLoading}
            className="gap-2 focus:ring-0 h-9"
          >
            <RefreshCw className={cn("w-4 h-4", (assignmentsLoading || evaluatorsLoading) && 'animate-spin')} />
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                disabled={loading || endedApplicationWindowTypes.length === 0 || evaluators.length === 0}
                className="gap-2 focus:ring-0 h-9"
              >
                <Zap className="w-4 h-4" />
                Auto Assign
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-textSecondary font-normal px-2 py-1.5">
                Run auto-assignment logic for:
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(['IDP', 'UROP', 'CAPSTONE'] as ProjectType[]).map((type) => {
                const isAppWindowEnded = windows.some(w =>
                  w.windowType === 'application' &&
                  w.projectType === type &&
                  new Date() > new Date(w.endDate)
                );
                return (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => handleAutoAssign(type)}
                    disabled={!isAppWindowEnded}
                    className="flex justify-between items-center cursor-pointer py-2 px-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{type}</span>
                      <span className="text-[10px] text-textSecondary">Fair distribution for {type} pool</span>
                    </div>
                    {isAppWindowEnded ? (
                      <UserCheck className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <span className="text-[9px] text-orange-500 font-bold px-1.5 py-0.5 bg-orange-500/10 rounded uppercase">Active</span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Validation Issues Warning */}
      {validationResult && !validationResult.isValid && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-amber-800 dark:text-amber-400 font-medium text-sm mb-2">Assignment Distribution Issues</h3>
              <ul className="text-amber-700 dark:text-amber-500 text-sm space-y-1">
                {validationResult.issues.map((issue: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <EvaluatorStats
        evaluators={evaluators}
        assignments={assignments}
        onOpenWorkload={() => setIsWorkloadModalOpen(true)}
      />

      {/* Filters and Search */}
      <div className="bg-background/50 rounded-xl border border-border/60 p-4">
        <div className="flex flex-col xl:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary w-4 h-4 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by project title, code, or faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-background border-border/60 focus:border-primary/40"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
              <SelectTrigger className="w-full sm:w-[130px] h-10 bg-background border-border/60">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterProjectType} onValueChange={(value) => setFilterProjectType(value as any)}>
              <SelectTrigger className="w-full sm:w-[130px] h-10 bg-background border-border/60">
                <div className="flex items-center gap-2 truncate">
                  <Layers className="w-3.5 h-3.5 text-textSecondary" />
                  <SelectValue placeholder="Project" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="IDP">IDP</SelectItem>
                <SelectItem value="UROP">UROP</SelectItem>
                <SelectItem value="CAPSTONE">Capstone</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSubmissionType} onValueChange={(value) => setFilterSubmissionType(value as any)}>
              <SelectTrigger className="w-full sm:w-[130px] h-10 bg-background border-border/60">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="group">Groups</SelectItem>
                <SelectItem value="solo">Solo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignmentsLoading || evaluatorsLoading ? (
          <EvaluatorListSkeleton />
        ) : filteredAssignments.length > 0 ? (
          <div className="grid gap-3">
            {filteredAssignments.map((assignment) => (
              <AssignmentCard
                key={`${assignment.submissionType}-${assignment.submissionType === 'group' ? assignment.groupId?._id : assignment.studentId?._id}`}
                assignment={assignment}
                evaluators={evaluators}
                onAssignEvaluator={handleAssignEvaluator}
                onRemoveEvaluator={handleRemoveEvaluator}
                loading={loading}
                windows={windows}
              />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-16 bg-background/50 rounded-xl border border-dashed border-border/60">
            <div className="w-14 h-14 bg-primary/5 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-primary/60" />
            </div>
            <h3 className="text-base font-medium text-text mb-2">No Projects Found</h3>
            <p className="text-textSecondary text-sm">No data available for the current selection.</p>
          </div>
        ) : (
          <div className="text-center py-16 bg-background/50 rounded-xl border border-border/60">
            <Search className="w-10 h-10 text-textSecondary mx-auto mb-4 opacity-20" />
            <h3 className="text-base font-medium text-text mb-2">No Matches</h3>
            <p className="text-textSecondary text-sm mb-6">Try adjusting your filters.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterSubmissionType('all');
                setFilterProjectType('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      <WorkloadDistributionModal
        isOpen={isWorkloadModalOpen}
        onClose={() => setIsWorkloadModalOpen(false)}
        evaluators={evaluators}
        totalProjects={assignments.length}
      />
    </div>
  );
}
