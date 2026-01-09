import { WindowForm as WindowFormType, WindowType, ProjectType, AssessmentType, Window } from '../../types';
import { DateRangePicker } from "@heroui/date-picker";
import { parseDateTime } from "@internationalized/date";

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

  // Helper to parse date strings for DateRangePicker
  const getDateRangeValue = () => {
    try {
      if (windowForm.startDate && windowForm.endDate) {
        return {
          start: parseDateTime(windowForm.startDate),
          end: parseDateTime(windowForm.endDate)
        };
      }
    } catch (e) {
      console.error("Invalid date format", e);
    }
    return null;
  };

  // Helper to handle date range changes
  const handleDateRangeChange = (value: any) => {
    if (value && value.start && value.end) {
      // Format: YYYY-MM-DDTHH:MM
      const format = (date: any) => {
        const year = date.year;
        const month = String(date.month).padStart(2, '0');
        const day = String(date.day).padStart(2, '0');
        const hour = String(date.hour).padStart(2, '0');
        const minute = String(date.minute).padStart(2, '0');
        return `${year}-${month}-${day}T${hour}:${minute}`;
      };

      setWindowForm({
        ...windowForm,
        startDate: format(value.start),
        endDate: format(value.end)
      });
    } else {
      setWindowForm({
        ...windowForm,
        startDate: '',
        endDate: ''
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            {editingWindow ? 'Edit Window' : 'Create New Window'}
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Configure the window details and schedule
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Current System Time</div>
          <div className="text-sm font-mono bg-gray-50 px-3 py-1 rounded-md text-gray-700">
            {new Date().toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
              hour12: true
            })}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Window Type <span className="text-red-500">*</span></label>
            <div className="relative">
              <select
                value={windowForm.windowTypes[0] || ''}
                onChange={(e) => setWindowForm({
                  ...windowForm,
                  windowTypes: [e.target.value as WindowType]
                })}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 disabled:opacity-50"
              >
                <option value="">Select Type...</option>
                <option value="proposal">Proposal</option>
                <option value="application">Application</option>
                <option value="submission">Submission</option>
                <option value="assessment">Assessment</option>
                <option value="grade_release">Grade Release</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Type <span className="text-red-500">*</span></label>
            <select
              value={windowForm.projectTypes[0] || ''}
              onChange={(e) => setWindowForm({
                ...windowForm,
                projectTypes: [e.target.value as ProjectType]
              })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800"
            >
              <option value="">Select Project...</option>
              <option value="IDP">IDP</option>
              <option value="UROP">UROP</option>
              <option value="CAPSTONE">CAPSTONE</option>
            </select>
          </div>

          {(windowForm.windowTypes.includes('submission') || windowForm.windowTypes.includes('assessment')) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Type <span className="text-red-500">*</span></label>
              <select
                value={windowForm.assessmentType}
                onChange={(e) => setWindowForm({
                  ...windowForm,
                  assessmentType: e.target.value as AssessmentType
                })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800"
              >
                <option value="">Select Assessment...</option>
                <option value="CLA-1">CLA-1</option>
                <option value="CLA-2">CLA-2</option>
                <option value="CLA-3">CLA-3</option>
                <option value="External">External</option>
              </select>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Duration <span className="text-red-500">*</span></span>
            <DateRangePicker
              value={getDateRangeValue()}
              onChange={handleDateRangeChange}
              label="Window Duration"
              variant="bordered"
              description="Select the start and end dates for this window"
              hideTimeZone
              visibleMonths={1}
              className="max-w-xs"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-600/20 transition-all"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              {editingWindow ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            editingWindow ? 'Update Window' : 'Create Window'
          )}
        </button>
      </div>
    </div>
  );
}