import { Plus } from 'lucide-react';

interface CreationModeModalProps {
  isOpen: boolean;
  creationMode: 'individual' | 'bulk';
  onModeChange: (mode: 'individual' | 'bulk') => void;
  onContinue: () => void;
  onCancel: () => void;
}

export function CreationModeModal({ 
  isOpen, 
  creationMode, 
  onModeChange, 
  onContinue, 
  onCancel 
}: CreationModeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Choose Window Creation Method</h3>
            <p className="text-sm text-gray-500">Select how you want to create windows</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Individual Creation */}
          <div 
            className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
              creationMode === 'individual' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onModeChange('individual')}
          >
            <div className="flex items-center mb-4">
              <input
                type="radio"
                name="creationMode"
                checked={creationMode === 'individual'}
                onChange={() => onModeChange('individual')}
                className="text-blue-600 focus:ring-blue-500 mr-3"
              />
              <h4 className="text-lg font-semibold text-gray-900">Create Individually</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Create specific windows manually with full control over timing and selection.
            </p>
            <div className="text-xs text-gray-500">
              <strong>Best for:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Creating specific windows as needed</li>
                <li>Custom timing requirements</li>
                <li>Partial semester scheduling</li>
                <li>Testing or special cases</li>
              </ul>
            </div>
          </div>

          {/* Bulk Creation */}
          <div 
            className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
              creationMode === 'bulk' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onModeChange('bulk')}
          >
            <div className="flex items-center mb-4">
              <input
                type="radio"
                name="creationMode"
                checked={creationMode === 'bulk'}
                onChange={() => onModeChange('bulk')}
                className="text-green-600 focus:ring-green-500 mr-3"
              />
              <h4 className="text-lg font-semibold text-gray-900">Create Entire Semester</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Automatically create all windows for the entire semester with proper sequencing.
            </p>
            <div className="text-xs text-gray-500">
              <strong>Best for:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Beginning of semester setup</li>
                <li>Complete workflow automation</li>
                <li>Consistent timing across all projects</li>
                <li>Set-and-forget scheduling</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-amber-800">Sequential Window Order</h4>
              <p className="text-sm text-amber-700 mt-1">
                {creationMode === 'bulk' ? (
                  <>
                    <strong>Bulk creation follows this sequence:</strong><br />
                    1. IDP Proposal → 2. UROP/CAPSTONE Proposals → 3. All Applications → 
                    4. CLA-1 (Submission + Assessment) → 5. CLA-2 → 6. CLA-3 → 7. External → 8. Grade Release
                  </>
                ) : (
                  <>
                    <strong>Individual creation enforces:</strong><br />
                    • Proposal must come first • Application after proposal ends • 
                    Submissions in CLA order • Assessments after submissions • Grade release at the end
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              creationMode === 'individual' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            Continue with {creationMode === 'individual' ? 'Individual' : 'Bulk'} Creation
          </button>
        </div>
      </div>
    </div>
  );
}