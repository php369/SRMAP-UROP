import { useState } from 'react';
import { XCircle, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { WindowForm, ProjectType } from '../../types';
import { SmartDateTimeInput } from '../../../../../components/ui/SmartDateTimeInput';

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
    { id: 'projectType', label: 'Project Type', phase: 'projectType' },
    { id: 'proposal', label: 'Proposal', phase: 'proposal' },
    { id: 'application', label: 'Application', phase: 'application' },
    { id: 'cla1', label: 'CLA-1', phase: 'cla1' },
    { id: 'cla2', label: 'CLA-2', phase: 'cla2' },
    { id: 'cla3', label: 'CLA-3', phase: 'cla3' },
    { id: 'external', label: 'External', phase: 'external' },
    { id: 'gradeRelease', label: 'Grade Release', phase: 'gradeRelease' }
  ];

  const updatePhaseSettings = (phase: string, field: string, value: string) => {
    setWindowForm({
      ...windowForm,
      bulkSettings: {
        ...windowForm.bulkSettings,
        [phase]: {
          ...windowForm.bulkSettings[phase as keyof typeof windowForm.bulkSettings],
          [field]: value
        }
      }
    });
  };

  const renderTabContent = () => {
    const tab = tabs[activeTab];

    if (tab.phase === 'projectType') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Select Project Type</h3>
          <p className="text-gray-600">
            Select the project type for which you want to create the entire semester windows.
          </p>
          
          <div className="grid grid-cols-1 gap-3">
            {(['IDP', 'UROP', 'CAPSTONE'] as ProjectType[]).map((projectType) => (
              <button
                key={projectType}
                onClick={() => setSelectedProjectType(projectType)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedProjectType === projectType
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{projectType}</h4>
                    <p className="text-sm text-gray-500">
                      {projectType === 'IDP' && 'Interdisciplinary Project'}
                      {projectType === 'UROP' && 'Undergraduate Research Opportunity Program'}
                      {projectType === 'CAPSTONE' && 'Capstone Project'}
                    </p>
                  </div>
                  {selectedProjectType === projectType && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Regular phase tabs
    const phaseSettings = windowForm.bulkSettings[tab.phase as keyof typeof windowForm.bulkSettings];

    if (tab.phase === 'proposal' || tab.phase === 'application' || tab.phase === 'gradeRelease') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">{tab.label} Phase</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <SmartDateTimeInput
              value={(phaseSettings as any).startDate}
              onChange={(value: string) => updatePhaseSettings(tab.phase, 'startDate', value)}
              label="Start Date & Time"
            />
            <SmartDateTimeInput
              value={(phaseSettings as any).endDate}
              onChange={(value: string) => updatePhaseSettings(tab.phase, 'endDate', value)}
              label="End Date & Time"
              minDateTime={(phaseSettings as any).startDate}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">{tab.label} Phase</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Submission Window</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <SmartDateTimeInput
                  value={(phaseSettings as any).submissionStart}
                  onChange={(value: string) => updatePhaseSettings(tab.phase, 'submissionStart', value)}
                  label="Submission Start"
                />
                <SmartDateTimeInput
                  value={(phaseSettings as any).submissionEnd}
                  onChange={(value: string) => updatePhaseSettings(tab.phase, 'submissionEnd', value)}
                  label="Submission End"
                  minDateTime={(phaseSettings as any).submissionStart}
                />
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Assessment Window</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <SmartDateTimeInput
                  value={(phaseSettings as any).assessmentStart}
                  onChange={(value: string) => updatePhaseSettings(tab.phase, 'assessmentStart', value)}
                  label="Assessment Start"
                  minDateTime={(phaseSettings as any).submissionEnd}
                />
                <SmartDateTimeInput
                  value={(phaseSettings as any).assessmentEnd}
                  onChange={(value: string) => updatePhaseSettings(tab.phase, 'assessmentEnd', value)}
                  label="Assessment End"
                  minDateTime={(phaseSettings as any).assessmentStart}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full mx-4 h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Create Entire Semester Windows</h2>
            <p className="text-gray-600 mt-1">Configure all workflow phases for {selectedProjectType || 'selected project type'}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Cancel"
            >
              <XCircle className="w-5 h-5" />
            </button>
            
            {activeTab > 0 && (
              <button
                onClick={() => setActiveTab(activeTab - 1)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                title="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            
            {activeTab < tabs.length - 1 ? (
              <button
                onClick={() => setActiveTab(activeTab + 1)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                title="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => onSubmit(selectedProjectType as ProjectType)}
                disabled={loading || !selectedProjectType}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create All Windows'}
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b bg-gray-50 flex-shrink-0">
          <div className="flex overflow-x-auto">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(index)}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap
                  ${activeTab === index 
                    ? 'border-blue-500 text-blue-600 bg-white' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className="w-4 h-4 mr-2 rounded-full border-2 border-gray-300" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}