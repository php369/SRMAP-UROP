import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Zap, AlertCircle } from 'lucide-react';
import { useExternalEvaluators } from '../../hooks/useExternalEvaluators';
import { AssignmentCard } from './AssignmentCard';
import { EvaluatorStats } from './EvaluatorStats';
import { useWindowStatus } from '../../../../../hooks/useWindowStatus';

export function ExternalEvaluatorsTab() {
  const { windows } = useWindowStatus();
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned' | 'conflicts'>('all');
  const [filterType, setFilterType] = useState<'all' | 'group' | 'solo'>('all');

  // Check if external evaluation window is active for any project type
  const isExternalEvaluationActive = windows.some(window => 
    window.windowType === 'assessment' && 
    window.assessmentType === 'External' &&
    new Date() >= new Date(window.startDate) && 
    new Date() <= new Date(window.endDate)
  );

  // Check if any assignment modification should be restricted
  const isModificationRestricted = isExternalEvaluationActive;

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchAssignments(), fetchEvaluators(), validateAssignments()]);
    };
    loadData();
  }, [fetchAssignments, fetchEvaluators, validateAssignments]);

  // Filter assignments based on search and filters
  const filteredAssignments = assignments.filter(assignment => {
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
      (filterStatus === 'unassigned' && !assignment.isAssigned) ||
      (filterStatus === 'conflicts' && assignment.hasConflict);

    // Type filter
    const matchesType = filterType === 'all' || assignment.submissionType === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

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

  const handleAutoAssign = async () => {
    // Validate before auto-assignment
    const validation = await validateAssignments();
    if (validation && !validation.isValid) {
      const proceed = window.confirm(
        `Assignment validation found issues:\n${validation.issues.join('\n')}\n\nDo you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    const success = await autoAssignEvaluators();
    if (success) {
      // Refresh data after successful auto-assignment
      await Promise.all([fetchAssignments(), fetchEvaluators(), validateAssignments()]);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchAssignments(), fetchEvaluators(), validateAssignments()]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">External Evaluator Assignment</h2>
          <p className="text-gray-600">Manage external evaluator assignments for projects</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={assignmentsLoading || evaluatorsLoading}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${(assignmentsLoading || evaluatorsLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleAutoAssign}
            disabled={loading || isModificationRestricted || assignments.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50"
            title={isModificationRestricted ? 'Cannot auto-assign during active external evaluation window' : 'Automatically assign external evaluators'}
          >
            <Zap className="w-4 h-4" />
            Auto Assign Evaluators
          </button>
        </div>
      </div>

      {/* Validation Issues Warning */}
      {validationResult && !validationResult.isValid && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-yellow-800 font-medium mb-2">Assignment Validation Issues</h3>
              <ul className="text-yellow-700 text-sm space-y-1 mb-3">
                {validationResult.issues.map((issue: string, index: number) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
              {validationResult.recommendations.length > 0 && (
                <>
                  <h4 className="text-yellow-800 font-medium mb-1">Recommendations:</h4>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    {validationResult.recommendations.map((rec: string, index: number) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warning for active external evaluation window */}
      {isExternalEvaluationActive && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-yellow-800 font-medium">External Evaluation Window Active</p>
            <p className="text-yellow-700 text-sm">
              Assignment modifications are restricted during active external evaluation windows.
            </p>
          </div>
        </div>
      )}

      {/* Statistics */}
      <EvaluatorStats evaluators={evaluators} assignments={assignments} />

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by group code, project title, or student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
              <option value="conflicts">Conflicts</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="group">Groups</option>
              <option value="solo">Solo Students</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignmentsLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading assignments...</p>
          </div>
        ) : filteredAssignments.length > 0 ? (
          <div className="grid gap-4">
            {filteredAssignments.map((assignment) => (
              <AssignmentCard
                key={`${assignment.submissionType}-${assignment.submissionType === 'group' ? assignment.groupId?._id : assignment.studentId?._id}`}
                assignment={assignment}
                evaluators={evaluators}
                onAssignEvaluator={handleAssignEvaluator}
                onRemoveEvaluator={handleRemoveEvaluator}
                loading={loading}
                isModificationRestricted={isModificationRestricted}
              />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
            <p className="text-gray-500">
              No groups or solo students are available for external evaluator assignment.
            </p>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-500">
              Try adjusting your search terms or filters to find assignments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}