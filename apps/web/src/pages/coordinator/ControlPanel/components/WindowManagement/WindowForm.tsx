import { useMemo, useCallback } from 'react';
import { WindowForm as WindowFormType, WindowType, ProjectType, AssessmentType, Window } from '../../types';
import { CompactDateRangePicker } from "../../../../../components/ui/CompactDateRangePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select";
import { Label } from "../../../../../components/ui/label";
import { Layers, Calendar, ClipboardList, CheckCircle2 } from 'lucide-react';

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

  const dateRangeValue = useMemo(() => {
    return windowForm.startDate && windowForm.endDate
      ? { start: windowForm.startDate, end: windowForm.endDate }
      : null;
  }, [windowForm.startDate, windowForm.endDate]);

  const handleDateChange = useCallback((val: { start: string; end: string }) => {
    setWindowForm({
      ...windowForm,
      startDate: val.start,
      endDate: val.end
    });
  }, [windowForm, setWindowForm]);

  return (
    <div className="space-y-6">
      {!editingWindow && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Pro Tip</p>
            <p className="text-sm text-blue-700">
              You are creating a single window. Ensure previous phases (like Proposal/Application) are completed before opening subsequent ones.
            </p>
          </div>
        </div>
      )}

      {editingWindow ? (
        /* EDIT MODE UI */
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Window Type</label>
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <Calendar className="w-4 h-4 text-slate-500" />
                {windowForm.windowTypes[0]?.charAt(0).toUpperCase() + windowForm.windowTypes[0]?.slice(1)}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Project Type</label>
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <Layers className="w-4 h-4 text-slate-500" />
                {windowForm.projectTypes[0]}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <CompactDateRangePicker
              label="Duration"
              isRequired
              value={dateRangeValue}
              onChange={handleDateChange}
            />
          </div>
        </div>
      ) : (
        /* CREATE MODE UI */
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="windowType" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                Window Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={windowForm.windowTypes[0] || ''}
                onValueChange={(value: string) => setWindowForm({
                  ...windowForm,
                  windowTypes: [value as WindowType]
                })}
              >
                <SelectTrigger id="windowType" className="w-full">
                  <SelectValue placeholder="Select Type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="application">Application</SelectItem>
                  <SelectItem value="submission">Submission</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="grade_release">Grade Release</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectType" className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500" />
                Project Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={windowForm.projectTypes[0] || ''}
                onValueChange={(value: string) => setWindowForm({
                  ...windowForm,
                  projectTypes: [value as ProjectType]
                })}
              >
                <SelectTrigger id="projectType" className="w-full">
                  <SelectValue placeholder="Select Project..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDP">IDP</SelectItem>
                  <SelectItem value="UROP">UROP</SelectItem>
                  <SelectItem value="CAPSTONE">CAPSTONE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(windowForm.windowTypes.includes('submission') || windowForm.windowTypes.includes('assessment')) && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="assessmentType" className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-slate-500" />
                  Assessment Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={windowForm.assessmentType}
                  onValueChange={(value: string) => setWindowForm({
                    ...windowForm,
                    assessmentType: value as AssessmentType
                  })}
                >
                  <SelectTrigger id="assessmentType" className="w-full">
                    <SelectValue placeholder="Select Assessment..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLA-1">CLA-1</SelectItem>
                    <SelectItem value="CLA-2">CLA-2</SelectItem>
                    <SelectItem value="CLA-3">CLA-3</SelectItem>
                    <SelectItem value="External">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <CompactDateRangePicker
                label="Duration"
                isRequired
                value={dateRangeValue}
                onChange={handleDateChange}
              />
              <p className="text-xs text-slate-500 px-1">
                Select start and end dates/times in IST.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-all"
        >
          {loading ? 'Processing...' : (editingWindow ? 'Update Window' : 'Create Window')}
        </button>
      </div>
    </div>
  );
}