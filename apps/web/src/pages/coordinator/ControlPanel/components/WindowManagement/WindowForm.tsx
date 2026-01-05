import { WindowForm as WindowFormType, WindowType, ProjectType, AssessmentType, Window } from '../../types';
import { SmartDateTimeInput } from '../../../../../components/ui/SmartDateTimeInput';

interface WindowFormProps {
  windowForm: WindowFormType;
  setWindowForm: (form: WindowFormType) => void;
  editingWindow: Window | null;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function WindowForm({ 
  windowForm, 
  setWindowForm, 
  editingWindow, 
  onSubmit, 
  onCancel, 
  loading
}: WindowFormProps) {
  // This is a simplified version - the full form implementation would be quite large
  // For now, this serves as a placeholder structure
  
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">
          {editingWindow ? 'Edit Window' : 'Create New Window'}
        </h3>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Current Time: </span>
          <span>{new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}</span>
        </div>
      </div>

      {/* Basic form structure - would need full implementation */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm font-medium">Window Type *</label>
          <select
            value={windowForm.windowTypes[0] || ''}
            onChange={(e) => setWindowForm({ 
              ...windowForm, 
              windowTypes: [e.target.value as WindowType] 
            })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Select...</option>
            <option value="proposal">Proposal</option>
            <option value="application">Application</option>
            <option value="submission">Submission</option>
            <option value="assessment">Assessment</option>
            <option value="grade_release">Grade Release</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Project Type *</label>
          <select
            value={windowForm.projectTypes[0] || ''}
            onChange={(e) => setWindowForm({ 
              ...windowForm, 
              projectTypes: [e.target.value as ProjectType] 
            })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Select...</option>
            <option value="IDP">IDP</option>
            <option value="UROP">UROP</option>
            <option value="CAPSTONE">CAPSTONE</option>
          </select>
        </div>

        {(windowForm.windowTypes.includes('submission') || windowForm.windowTypes.includes('assessment')) && (
          <div className="md:col-span-2">
            <label className="block mb-2 text-sm font-medium">Assessment Type</label>
            <select
              value={windowForm.assessmentType}
              onChange={(e) => setWindowForm({ 
                ...windowForm, 
                assessmentType: e.target.value as AssessmentType 
              })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Select...</option>
              <option value="CLA-1">CLA-1</option>
              <option value="CLA-2">CLA-2</option>
              <option value="CLA-3">CLA-3</option>
              <option value="External">External</option>
            </select>
          </div>
        )}

        <SmartDateTimeInput
          value={windowForm.startDate}
          onChange={(value: string) => setWindowForm({ ...windowForm, startDate: value })}
          label="Start Date & Time"
        />
        
        <SmartDateTimeInput
          value={windowForm.endDate}
          onChange={(value: string) => setWindowForm({ ...windowForm, endDate: value })}
          label="End Date & Time"
          minDateTime={windowForm.startDate}
        />
      </div>

      <div className="flex gap-4 mt-4">
        <button
          onClick={onSubmit}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (editingWindow ? 'Updating...' : 'Creating...') : (editingWindow ? 'Update Window' : 'Create Window')}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}