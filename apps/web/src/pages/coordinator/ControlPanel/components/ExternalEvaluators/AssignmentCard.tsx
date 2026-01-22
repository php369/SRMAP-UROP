import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Users, AlertTriangle, X, Check, ChevronDown, UserCheck, Briefcase, Mail } from 'lucide-react';
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

  const handleAssignEvaluator = async () => {
    if (!selectedEvaluatorId || !assignmentId) return;

    const success = await onAssignEvaluator(assignmentId, selectedEvaluatorId, assignment.submissionType);
    if (success) {
      setShowEvaluatorDropdown(false);
      setSelectedEvaluatorId('');
    }
  };

  const handleRemoveEvaluator = async () => {
    if (!assignmentId) return;
    await onRemoveEvaluator(assignmentId, assignment.submissionType);
  };

  // Filter out internal faculty from evaluator options
  const availableEvaluators = evaluators.filter(evaluator =>
    evaluator._id !== internalFaculty?._id
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-background rounded-xl border p-5 transition-all",
        hasConflict
          ? 'border-destructive/40 bg-destructive/5'
          : assignment.isAssigned
            ? 'border-success/40 bg-success/5'
            : 'border-border/60 hover:border-border'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-lg",
            isGroup ? 'bg-primary/10' : 'bg-violet-500/10'
          )}>
            {isGroup ? (
              <Users className={cn("w-5 h-5", isGroup ? 'text-primary' : 'text-violet-600')} />
            ) : (
              <User className="w-5 h-5 text-violet-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-text">
              {isGroup ? assignment.groupId?.groupCode : assignment.studentId?.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                isGroup ? 'bg-primary/10 text-primary' : 'bg-violet-500/10 text-violet-600'
              )}>
                {isGroup ? 'Group' : 'Solo'}
              </span>
              {projectType && (
                <span className="text-xs text-textSecondary">{projectType}</span>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={cn(
          "px-2.5 py-1 rounded-full text-xs font-medium",
          hasConflict
            ? 'bg-destructive/10 text-destructive'
            : assignment.isAssigned
              ? 'bg-success/10 text-success'
              : 'bg-amber-500/10 text-amber-600'
        )}>
          {hasConflict ? 'Conflict' : assignment.isAssigned ? 'Assigned' : 'Pending'}
        </div>
      </div>

      {/* Conflict Warning */}
      {hasConflict && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <span className="text-sm text-destructive">
            External evaluator cannot be the same as internal faculty
          </span>
        </div>
      )}

      {/* Project Information */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <Briefcase className="w-3.5 h-3.5 text-textSecondary" />
          <span className="text-sm text-textSecondary">Project:</span>
          <span className="text-sm font-medium text-text">{projectTitle || 'Not assigned'}</span>
        </div>
        <div className="flex items-center gap-2">
          <UserCheck className="w-3.5 h-3.5 text-textSecondary" />
          <span className="text-sm text-textSecondary">Internal Faculty:</span>
          <span className="text-sm font-medium text-text">{internalFaculty?.name || 'Not assigned'}</span>
        </div>
        {isGroup && assignment.groupId?.members && (
          <div className="flex items-start gap-2">
            <Users className="w-3.5 h-3.5 text-textSecondary mt-0.5" />
            <span className="text-sm text-textSecondary">Members:</span>
            <span className="text-sm text-text">
              {assignment.groupId.members.map(member => member.name).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* External Evaluator Assignment */}
      <div className="border-t border-border/60 pt-4">
        {assignment.isAssigned && externalEvaluator ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-text">{externalEvaluator.name}</p>
                <p className="text-xs text-textSecondary flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {externalEvaluator.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveEvaluator}
              disabled={loading || isModificationRestricted}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 focus:ring-0 focus:outline-none"
              title={isModificationRestricted ? "Cannot modify during active application window" : "Remove assignment"}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {!showEvaluatorDropdown ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-textSecondary">No external evaluator assigned</span>
                <Button
                  size="sm"
                  onClick={() => setShowEvaluatorDropdown(true)}
                  disabled={loading || isModificationRestricted || availableEvaluators.length === 0}
                  className="gap-2 focus:ring-0 focus:outline-none"
                  title={isModificationRestricted ? "Application phase active. Cannot assign." : "Assign external evaluator"}
                >
                  <UserCheck className="w-4 h-4" />
                  Assign Evaluator
                </Button>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={selectedEvaluatorId} onValueChange={setSelectedEvaluatorId}>
                    <SelectTrigger className="flex-1 bg-background border-border/60">
                      <SelectValue placeholder="Select an evaluator..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEvaluators.map(evaluator => (
                        <SelectItem key={evaluator._id} value={evaluator._id}>
                          <div className="flex items-center justify-between gap-2">
                            <span>{evaluator.name}</span>
                            <span className="text-xs text-textSecondary">
                              ({evaluator.assignmentCount} assigned)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowEvaluatorDropdown(false);
                      setSelectedEvaluatorId('');
                    }}
                    className="focus:ring-0 focus:outline-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAssignEvaluator}
                    disabled={!selectedEvaluatorId || loading || isModificationRestricted}
                    className="gap-2 bg-success hover:bg-success/90 text-white focus:ring-0 focus:outline-none"
                  >
                    <Check className="w-4 h-4" />
                    Confirm
                  </Button>
                </div>
              </div>
            )}

            {availableEvaluators.length === 0 && !showEvaluatorDropdown && (
              <p className="text-xs text-textSecondary">No available external evaluators</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}