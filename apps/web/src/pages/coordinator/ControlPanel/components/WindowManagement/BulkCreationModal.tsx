import { useState } from 'react';
import { XCircle, ChevronLeft, ChevronRight, CheckCircle, CalendarDays, Layers } from 'lucide-react';
import { WindowForm, ProjectType } from '../../types';
import { DateRangePicker } from "@heroui/date-picker";
import { parseZonedDateTime } from "@internationalized/date";

interface BulkCreationModalProps {
  isOpen: boolean;
  windowForm: WindowForm;
  setWindowForm: (form: WindowForm) => void;
  onSubmit: (selectedProjectType: ProjectType) => void;
  loading: boolean;
  onCancel: () => void;
}

export function BulkCreationModal({
  isOpen,
  windowForm,
  setWindowForm,
  onSubmit,
  loading,
  onCancel
}: BulkCreationModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | ''>('');

  if (!isOpen) return null;

  const tabs = [
    { id: 'projectType', label: 'Project Type', phase: 'projectType', icon: Layers },
    { id: 'proposal', label: 'Proposal', phase: 'proposal', icon: CalendarDays },
    { id: 'application', label: 'Application', phase: 'application', icon: CalendarDays },
    { id: 'cla1', label: 'CLA-1', phase: 'cla1', icon: CalendarDays },
    { id: 'cla2', label: 'CLA-2', phase: 'cla2', icon: CalendarDays },
    { id: 'cla3', label: 'CLA-3', phase: 'cla3', icon: CalendarDays },
    { id: 'external', label: 'External', phase: 'external', icon: CalendarDays },
    { id: 'gradeRelease', label: 'Grade Release', phase: 'gradeRelease', icon: CalendarDays }
  ];

  const updatePhaseSettings = (phase: string, startField: string, endField: string, value: any) => {
    if (!value || !value.start || !value.end) return;

    const format = (date: any) => {
      const year = date.year;
      const month = String(date.month).padStart(2, '0');
      const day = String(date.day).padStart(2, '0');
      const hour = String(date.hour).padStart(2, '0');
      const minute = String(date.minute).padStart(2, '0');
      return `${year}-${month}-${day}T${hour}:${minute}:00`;
    };

    setWindowForm({
      ...windowForm,
      bulkSettings: {
        ...windowForm.bulkSettings,
        [phase]: {
          ...windowForm.bulkSettings[phase as keyof typeof windowForm.bulkSettings],
          [startField]: format(value.start),
          [endField]: format(value.end)
        }
      }
    });
  };

  const getPhaseValue = (phase: string, startField: string, endField: string) => {
    const settings = windowForm.bulkSettings[phase as keyof typeof windowForm.bulkSettings] as any;
    try {
      if (settings[startField] && settings[endField]) {
        const startStr = settings[startField].replace('Z', '').replace(/\+.*$/, '');
        const endStr = settings[endField].replace('Z', '').replace(/\+.*$/, '');
        return {
          start: parseZonedDateTime(`${startStr}[Asia/Kolkata]`),
          end: parseZonedDateTime(`${endStr}[Asia/Kolkata]`)
        };
      }
    } catch (e) { console.error(e); }
    return null;
  };

  const renderTabContent = () => {
    const tab = tabs[activeTab];

    if (tab.phase === 'projectType') {
      return (
        <div className="space-y-8 animate-fade-in">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Select Project Type</h3>
            <p className="text-gray-500">
              Choose the academic project type to configure the semester schedule for.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {(['IDP', 'UROP', 'CAPSTONE'] as ProjectType[]).map((projectType) => (
              <button
                key={projectType}
                onClick={() => setSelectedProjectType(projectType)}
                className={`relative p-6 border-2 rounded-xl text-left transition-all duration-200 group hover:shadow-lg ${selectedProjectType === projectType
                  ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-500/10'
                  : 'border-gray-100 hover:border-blue-200 bg-white'
                  }`}
              >
                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="p-3 bg-white rounded-lg w-fit shadow-sm border border-gray-100 group-hover:border-blue-100 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-1">{projectType}</h4>
                    <p className="text-sm text-gray-500 group-hover:text-gray-600">
                      {projectType === 'IDP' && 'Interdisciplinary Project'}
                      {projectType === 'UROP' && 'Undergraduate Research'}
                      {projectType === 'CAPSTONE' && 'Capstone Project'}
                    </p>
                  </div>
                </div>
                {selectedProjectType === projectType && (
                  <div className="absolute top-4 right-4 text-blue-500">
                    <CheckCircle className="w-6 h-6 fill-blue-500 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Regular phase tabs
    if (tab.phase === 'proposal' || tab.phase === 'application' || tab.phase === 'gradeRelease') {
      return (
        <div className="space-y-6 animate-fade-in max-w-2xl">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{tab.label} Phase</h3>
            <p className="text-gray-500 text-sm">Set the duration for the {tab.label.toLowerCase()} window.</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <DateRangePicker
              value={getPhaseValue(tab.phase, 'startDate', 'endDate')}
              onChange={(val: any) => updatePhaseSettings(tab.phase, 'startDate', 'endDate', val)}
              label={`${tab.label} Duration`}
              variant="bordered"
              description={`Select start and end dates for ${tab.label}`}
              visibleMonths={1}
              hideTimeZone
              granularity="minute"
              className="max-w-md w-full"
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-8 animate-fade-in max-w-4xl">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{tab.label} Phase</h3>
            <p className="text-gray-500 text-sm">Configure submission and assessment timelines for {tab.label}.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Submission Window</h4>
              </div>
              <DateRangePicker
                value={getPhaseValue(tab.phase, 'submissionStart', 'submissionEnd')}
                onChange={(val: any) => updatePhaseSettings(tab.phase, 'submissionStart', 'submissionEnd', val)}
                label="Submission Duration"
                variant="bordered"
                hideTimeZone
                granularity="minute"
                className="w-full"
              />
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:border-amber-200 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <CalendarDays className="w-5 h-5 text-amber-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Assessment Window</h4>
              </div>
              <DateRangePicker
                value={getPhaseValue(tab.phase, 'assessmentStart', 'assessmentEnd')}
                onChange={(val: any) => updatePhaseSettings(tab.phase, 'assessmentStart', 'assessmentEnd', val)}
                label="Assessment Duration"
                variant="bordered"
                hideTimeZone
                granularity="minute"
                className="w-full"
              />
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mx-4 h-[85vh] overflow-hidden flex flex-col md:flex-row animate-scale-in">

        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-200 flex-shrink-0 flex flex-row md:flex-col overflow-x-auto md:overflow-visible scrollbar-hide">
          <div className="p-6 hidden md:block">
            <h2 className="font-bold text-gray-900">Semester Plan</h2>
            <p className="text-xs text-gray-500 mt-1">{selectedProjectType || 'Setup Wizard'}</p>
          </div>

          <div className="flex md:flex-col p-2 md:p-4 gap-1">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === index;
              const isCompleted = index < activeTab;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(index)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all min-w-max md:min-w-0
                                ${isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                            `}
                >
                  <div className={`p-1.5 rounded-md ${isActive ? 'bg-white/80' : 'bg-transparent'}`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  </div>
                  <span>{tab.label}</span>
                  {isCompleted && <CheckCircle className="w-4 h-4 text-green-500 ml-auto hidden md:block" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {activeTab === 0 ? 'Project Configuration' : 'Timeline Configuration'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Step {activeTab + 1} of {tabs.length}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white">
            {renderTabContent()}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <button
              onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
              disabled={activeTab === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-600 font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {activeTab < tabs.length - 1 ? (
              <button
                onClick={() => setActiveTab(activeTab + 1)}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 font-medium transition-all"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onSubmit(selectedProjectType as ProjectType)}
                disabled={loading || !selectedProjectType}
                className="flex items-center gap-2 px-8 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:shadow-none font-bold transition-all"
              >
                {loading ? 'Creating Schedule...' : 'Create Full Schedule'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}