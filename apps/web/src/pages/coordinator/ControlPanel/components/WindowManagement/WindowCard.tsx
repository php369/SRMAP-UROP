import { Edit2, Trash2 } from 'lucide-react';
import { Window } from '../../types';
import { getWindowStatus } from '../../utils/windowHelpers';
import { formatDateForDisplay } from '../../utils/dateTimeUtils';

interface WindowCardProps {
  window: Window;
  onEdit: (window: Window) => void;
  onDelete: (window: Window) => void;
}

export function WindowCard({ window, onEdit, onDelete }: WindowCardProps) {
  const { isActive, hasEnded, isUpcoming } = getWindowStatus(window);

  return (
    <div
      className={`p-4 border-2 rounded-lg transition-all duration-200 hover:shadow-md ${
        isActive 
          ? 'border-green-500 bg-green-50 hover:bg-green-100' 
          : hasEnded 
          ? 'border-gray-300 bg-gray-50 hover:bg-gray-100' 
          : 'border-blue-300 bg-blue-50 hover:bg-blue-100'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold capitalize">
              {window.windowType.replace('_', ' ')}
            </h3>
            {window.assessmentType && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                {window.assessmentType}
              </span>
            )}
            {isActive && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Active
              </span>
            )}
            {hasEnded && (
              <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-sm font-medium">
                Inactive
              </span>
            )}
            {isUpcoming && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                Upcoming
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            <p>Start: {formatDateForDisplay(window.startDate)}</p>
            <p>End: {formatDateForDisplay(window.endDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(window)}
            disabled={hasEnded}
            className="p-2 text-blue-500 hover:bg-blue-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            title={hasEnded ? 'Cannot edit ended window' : 'Edit window'}
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(window)}
            className="p-2 text-red-500 hover:bg-red-100 rounded transition-colors duration-200"
            title="Delete window"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}