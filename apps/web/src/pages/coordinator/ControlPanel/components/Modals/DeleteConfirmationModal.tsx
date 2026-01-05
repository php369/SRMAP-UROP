import { Trash2 } from 'lucide-react';
import { Window } from '../../types';
import { formatDateForDisplay } from '../../utils/dateTimeUtils';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  window: Window | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({ 
  isOpen, 
  window, 
  onConfirm, 
  onCancel 
}: DeleteConfirmationModalProps) {
  if (!isOpen || !window) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Window</h3>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-amber-800">Critical Warning</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Deleting this window will <strong>permanently remove it from the database</strong> and may affect the workflow validation logic that has been implemented. 
                  This could impact the sequential window creation process and break the established workflow dependencies.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600 mb-2">You are about to delete:</p>
            <p className="font-medium text-gray-900">
              {window.windowType.replace('_', ' ')} - {window.projectType}
              {window.assessmentType && ` (${window.assessmentType})`}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {formatDateForDisplay(window.startDate)} - {formatDateForDisplay(window.endDate)}
            </p>
          </div>
          
          <p className="text-sm text-gray-600">
            <strong>Please continue only if you are fully aware of the implications.</strong> 
            If you are unsure about the impact on the workflow system, please contact the developer before proceeding.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Yes, Delete Window
          </button>
        </div>
      </div>
    </div>
  );
}