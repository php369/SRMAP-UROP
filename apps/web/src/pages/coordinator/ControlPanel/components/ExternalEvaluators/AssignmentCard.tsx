import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, AlertTriangle, AlertCircle, X, Check, ChevronDown, UserCheck, Briefcase, Mail, Info, UserCircle } from 'lucide-react';
import { ExternalEvaluatorAssignment, ExternalEvaluator } from '../../types';
import { Window } from '../../../../../utils/windowChecker';
import { Button } from '../../../../../components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../../../components/ui/tooltip";
import { cn } from '../../../../../utils/cn';

interface AssignmentCardProps {
  assignment: ExternalEvaluatorAssignment;
  evaluators: ExternalEvaluator[];
  onAssignEvaluator: (assignmentId: string, evaluatorId: string, submissionType: 'group' | 'solo') => Promise<boolean>;
  onRemoveEvaluator: (assignmentId: string, submissionType: 'group' | 'solo') => Promise<boolean>;
  loading: boolean;
  windows: Window[];
}

export function AssignmentCard({
  assignment,
  evaluators,
  onAssignEvaluator,
  onRemoveEvaluator,
  loading,
  windows
}: AssignmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEvaluatorDropdown, setShowEvaluatorDropdown] = useState(false);
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState('');

  // Determine Project Type from Assignment
  const getProjectType = () => {
    if (assignment.submissionType === 'group' && assignment.groupId?.assignedProjectId) {
      return assignment.groupId.assignedProjectId.type;
    }
    if (assignment.submissionType === 'solo' && assignment.studentId?.assignedProjectId) {
      return assignment.studentId.assignedProjectId.type;
    }
    return null;
  };

  const projectType = getProjectType();

  // Check if Application Window is active for this specific project type
  const isApplicationWindowActive = windows.some(window =>
    window.windowType === 'application' &&
    window.projectType === projectType &&
    new Date() <= new Date(window.endDate)
  );

  const isModificationRestricted = isApplicationWindowActive || !projectType;

  const isGroup = assignment.submissionType === 'group';
  const assignmentId = isGroup ? assignment.groupId?._id : assignment.studentId?._id;
  const projectTitle = isGroup
    ? assignment.groupId?.assignedProjectId?.title
    : assignment.studentId?.assignedProjectId?.title;
  const internalFaculty = isGroup
    ? assignment.groupId?.assignedFacultyId
    : assignment.studentId?.assignedFacultyId;
  const externalEvaluator = isGroup
    ? assignment.groupId?.externalEvaluatorId
    : assignment.externalEvaluator;

  // Check for conflict
  const hasConflict = internalFaculty && externalEvaluator &&
    internalFaculty._id === externalEvaluator._id;

  const handleAssignEvaluator = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedEvaluatorId || !assignmentId) return;

    const success = await onAssignEvaluator(assignmentId, selectedEvaluatorId, assignment.submissionType);
    if (success) {
      setShowEvaluatorDropdown(false);
      setSelectedEvaluatorId('');
    }
  };

  const handleRemoveEvaluator = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!assignmentId) return;
    await onRemoveEvaluator(assignmentId, assignment.submissionType);
  };

  // Filter out internal faculty from evaluator options
  const availableEvaluators = evaluators.filter(evaluator =>
    evaluator._id !== internalFaculty?._id
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-background rounded-xl border transition-all duration-300 overflow-hidden group/card",
        "hover:border-primary/30 hover:bg-surface/30",
        hasConflict
          ? 'border-destructive/40 bg-destructive/5'
          : assignment.isAssigned
            ? 'border-success/40 bg-success/5'
            : 'border-border/60'
      )}
    >
      {/* Row Header (Always Visible) */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={cn(
            "p-2 rounded-lg flex-shrink-0",
            isGroup ? 'bg-cyan-500/10' : 'bg-fuchsia-500/10'
          )}>
            {isGroup ? (
              <Users className="w-4 h-4 text-cyan-600" />
            ) : (
              <User className="w-4 h-4 text-fuchsia-600" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-text truncate pr-4">
              {projectTitle || 'Untitled Project'}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-textSecondary/60">
                {isGroup ? 'GROUP' : 'SOLO'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border/40 text-textSecondary">
                {projectType}
              </span>
            </div>
          </div>

          {/* Compact Info Badges */}
          <div className="hidden md:flex items-center px-4 border-l border-border/40 ml-4">
            <div className="flex flex-col w-[150px]">
              <span className="text-[10px] text-textSecondary uppercase tracking-tighter">Internal</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs font-medium text-text truncate cursor-help">
                    {internalFaculty?.name || 'N/A'}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{internalFaculty?.name || 'Internal Faculty'}</p>
                  <p className="text-[10px] opacity-80">{internalFaculty?.email}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex flex-col w-[150px] ml-6">
              <span className="text-[10px] text-textSecondary uppercase tracking-tighter">External</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn(
                    "text-xs font-medium truncate cursor-help",
                    assignment.isAssigned ? 'text-text' : 'text-amber-600/70 italic'
                  )}>
                    {externalEvaluator?.name || 'Not assigned'}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {externalEvaluator ? (
                    <>
                      <p className="font-medium">{externalEvaluator.name}</p>
                      <p className="text-[10px] opacity-80">{externalEvaluator.email}</p>
                    </>
                  ) : (
                    <p>No external evaluator assigned yet</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <div className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter",
            hasConflict
              ? 'bg-destructive/10 text-destructive'
              : assignment.isAssigned
                ? 'bg-success/10 text-success'
                : 'bg-amber-500/10 text-amber-600'
          )}>
            {hasConflict ? 'Conflict' : assignment.isAssigned ? 'Assigned' : 'Pending'}
          </div>
          <div className={cn(
            "p-1.5 rounded-full transition-all group-hover/card:bg-primary/10",
            isExpanded ? "bg-primary/5" : ""
          )}>
            <ChevronDown className={cn(
              "w-4 h-4 text-textSecondary transition-transform duration-300",
              isExpanded && "rotate-180 text-primary"
            )} />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="border-t border-border/40"
          >
            <div className="p-6 bg-surface/30">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Details */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mb-1">Applicant Details</p>
                      <p className="text-sm font-medium text-text">
                        {isGroup ? `Group: ${assignment.groupId?.groupCode}` : `Student: ${assignment.studentId?.name}`}
                      </p>
                      {isGroup && assignment.groupId?.members && (
                        <p className="text-xs text-textSecondary mt-1">
                          Members: {assignment.groupId.members.map(m => m.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <UserCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mb-1">Direct Advisor</p>
                      <p className="text-sm font-medium text-text">{internalFaculty?.name || 'Not assigned'}</p>
                      <p className="text-xs text-textSecondary">{internalFaculty?.email}</p>
                    </div>
                  </div>

                  {hasConflict && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                      <p className="text-xs text-destructive font-medium">
                        Conflict detected: Internal faculty member cannot be assigned as the external evaluator for their own project.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Assignment Action */}
                <div className="bg-background/50 rounded-xl border border-border/40 p-5">
                  <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mb-4">External Assignment</p>

                  {assignment.isAssigned && externalEvaluator && !showEvaluatorDropdown ? (
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center border border-success/20">
                          <UserCheck className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text">{externalEvaluator.name}</p>
                          <p className="text-xs text-textSecondary flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {externalEvaluator.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowEvaluatorDropdown(true)}
                          disabled={loading || isModificationRestricted}
                          className="h-8 px-2 text-textSecondary hover:text-primary focus:ring-0"
                        >
                          Change
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveEvaluator}
                          disabled={loading || isModificationRestricted}
                          className="h-8 px-2 text-destructive hover:bg-destructive/5 focus:ring-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isModificationRestricted ? (
                        <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-center gap-3">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <p className="text-xs text-amber-700">Modification restricted during active application phase.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Select value={selectedEvaluatorId} onValueChange={setSelectedEvaluatorId}>
                            <SelectTrigger className="w-full bg-background">
                              <SelectValue placeholder="Select faculty member..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableEvaluators.map(evaluator => (
                                <SelectItem key={evaluator._id} value={evaluator._id}>
                                  <div className="flex items-center justify-between w-full gap-8">
                                    <span className="font-medium">{evaluator.name}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                      {evaluator.assignmentCount} projects
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="flex gap-2 justify-end pt-2 border-t border-border/40">
                            {assignment.isAssigned && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowEvaluatorDropdown(false)}
                                className="text-xs h-8"
                              >
                                Cancel
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={handleAssignEvaluator}
                              disabled={!selectedEvaluatorId || loading}
                              className="text-xs h-8 gap-2"
                            >
                              <Check className="w-3 h-3" />
                              {assignment.isAssigned ? 'Update Assignment' : 'Confirm Assignment'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
