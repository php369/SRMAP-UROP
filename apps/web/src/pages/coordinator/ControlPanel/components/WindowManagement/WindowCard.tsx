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
      className={`relative p-4 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-md
        ${isActive ? 'border-l-[6px] border-l-green-500' : ''}
        ${isUpcoming ? 'border-l-[6px] border-l-blue-500' : ''}
        ${hasEnded ? 'border-l-[6px] border-l-slate-300 opacity-75' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-bold text-slate-900 capitalize text-lg">
              {window.windowType.replace('_', ' ')}
            </h3>

            {/* Project Type Badge */}
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-semibold border border-slate-200">
              {window.projectType}
            </span>

            {/* Assessment Type Badge */}
            {window.assessmentType && (
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold border border-indigo-100">
                {window.assessmentType}
              </span>
            )}

            {/* Status Pills */}
            {isActive && (
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-sm border border-green-200">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></span>
                Active
              </span>
            )}
            {isUpcoming && (
              <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide border border-blue-200">
                Upcoming
              </span>
            )}
            {hasEnded && (
              <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wide border border-slate-200">
                Closed
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-y-1 sm:gap-x-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start</span>
              <span className="font-medium">{formatDateForDisplay(window.startDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">End</span>
              <span className="font-medium">{formatDateForDisplay(window.endDate)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-slate-100 ml-4">
          <button
            onClick={() => onEdit(window)}
            disabled={hasEnded}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title={hasEnded ? 'Cannot edit ended window' : 'Edit window'}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(window)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Delete window"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}