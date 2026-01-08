import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Users, AlertTriangle, X, Check, ChevronDown } from 'lucide-react';
import { ExternalEvaluatorAssignment, ExternalEvaluator } from '../../types';

interface AssignmentCardProps {
  assignment: ExternalEvaluatorAssignment;
  evaluators: ExternalEvaluator[];
  onAssignEvaluator: (assignmentId: string, evaluatorId: string, submissionType: 'group' | 'solo') => Promise<boolean>;
  onRemoveEvaluator: (assignmentId: string, submissionType: 'group' | 'solo') => Promise<boolean>;
  loading: boolean;
  isModificationRestricted?: boolean;
}

export function AssignmentCard({ 
  assignment, 
  evaluators, 
  onAssignEvaluator, 
  onRemoveEvaluator, 
  loading,
  isModificationRestricted = false
}: AssignmentCardProps) {
  const [showEvaluatorDropdown, setShowEvaluatorDropdown] = useState(false);
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState('');

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

  // Check for conflict (internal faculty same as external evaluator)
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border-2 p-6 ${
        hasConflict ? 'border-red-300 bg-red-50' : 
        assignment.isAssigned ? 'border-green-300 bg-green-50' : 
        'border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isGroup ? 'bg-blue-100' : 'bg-purple-100'
          }`}>
            {isGroup ? (
              <Users className={`w-5 h-5 ${isGroup ? 'text-blue-600' : 'text-purple-600'}`} />
            ) : (
              <User className={`w-5 h-5 ${isGroup ? 'text-blue-600' : 'text-purple-600'}`} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {isGroup ? assignment.groupId?.groupCode : assignment.studentId?.name}
            </h3>
            <p className="text-sm text-gray-600">
              {assignment.submissionType === 'group' ? 'Group Submission' : 'Solo Submission'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          hasConflict ? 'bg-red-100 text-red-800' :
          assignment.isAssigned ? 'bg-green-100 text-green-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          {hasConflict ? 'Conflict' : assignment.isAssigned ? 'Assigned' : 'Unassigned'}
        </div>
      </div>

      {/* Conflict Warning */}
      {hasConflict && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-800">
            Conflict: External evaluator is the same as internal faculty
          </span>
        </div>
      )}

      {/* Project Information */}
      <div className="mb-4 space-y-2">
        <div>
          <span className="text-sm font-medium text-gray-700">Project: </span>
          <span className="text-sm text-gray-900">{projectTitle || 'Not assigned'}</span>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700">Internal Faculty: </span>
          <span className="text-sm text-gray-900">{internalFaculty?.name || 'Not assigned'}</span>
        </div>
        {isGroup && assignment.groupId?.members && (
          <div>
            <span className="text-sm font-medium text-gray-700">Members: </span>
            <span className="text-sm text-gray-900">
              {assignment.groupId.members.map(member => member.name).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* External Evaluator Assignment */}
      <div className="border-t pt-4">
        {assignment.isAssigned && externalEvaluator ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">External Evaluator: </span>
              <span className="text-sm text-gray-900">{externalEvaluator.name}</span>
              <p className="text-xs text-gray-500">{externalEvaluator.email}</p>
            </div>
            <button
              onClick={handleRemoveEvaluator}
              disabled={loading || isModificationRestricted}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
              title={isModificationRestricted ? "Cannot modify during active evaluation window" : "Remove assignment"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Assign External Evaluator</span>
              <button
                onClick={() => setShowEvaluatorDropdown(!showEvaluatorDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                disabled={loading || isModificationRestricted || availableEvaluators.length === 0}
                title={isModificationRestricted ? "Cannot modify during active evaluation window" : "Assign external evaluator"}
              >
                Assign
                <ChevronDown className={`w-4 h-4 transition-transform ${
                  showEvaluatorDropdown ? 'rotate-180' : ''
                }`} />
              </button>
            </div>

            {showEvaluatorDropdown && (
              <div className="space-y-2">
                <select
                  value={selectedEvaluatorId}
                  onChange={(e) => setSelectedEvaluatorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select an evaluator...</option>
                  {availableEvaluators.map(evaluator => (
                    <option key={evaluator._id} value={evaluator._id}>
                      {evaluator.name} ({evaluator.assignmentCount} assignments)
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAssignEvaluator}
                    disabled={!selectedEvaluatorId || loading || isModificationRestricted}
                    className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      setShowEvaluatorDropdown(false);
                      setSelectedEvaluatorId('');
                    }}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {availableEvaluators.length === 0 && (
              <p className="text-sm text-gray-500">No available external evaluators</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}