import { useNavigate } from 'react-router-dom';
import { useWindowManagement } from './hooks/useWindowManagement';
import { useGradeRelease } from './hooks/useGradeRelease';
import { ControlPanelLanding } from './components/Dashboard/ControlPanelLanding';
import { GradeReleaseSection } from './components/Dashboard/GradeReleaseSection';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { useState } from 'react';
import { ProjectType } from './types';
import toast from 'react-hot-toast';

export function ControlPanelHome() {
    const navigate = useNavigate();
    const { windows } = useWindowManagement();

    // Grade Release Logic
    const {
        releasedGrades,
        releaseGrades,
        isGradeReleaseWindowActive
    } = useGradeRelease();

    const [showGradeReleaseModal, setShowGradeReleaseModal] = useState(false);
    const [gradeReleaseProjectType, setGradeReleaseProjectType] = useState<ProjectType | null>(null);



    const handleReleaseFinalGrades = async (projectType: ProjectType) => {
        if (releasedGrades[projectType]) {
            toast.error(`Final grades for ${projectType} have already been released.`);
            return;
        }
        setGradeReleaseProjectType(projectType);
        setShowGradeReleaseModal(true);
    };

    const confirmGradeRelease = async () => {
        if (!gradeReleaseProjectType) return;
        await releaseGrades(gradeReleaseProjectType);
        setShowGradeReleaseModal(false);
        setGradeReleaseProjectType(null);
    };

    return (
        <div className="space-y-6">
            {/* Grade Release Section - Only when active */}
            {isGradeReleaseWindowActive(windows) && (
                <div className="mb-6">
                    <GradeReleaseSection
                        releasedGrades={releasedGrades}
                        onReleaseGrades={handleReleaseFinalGrades}
                    />
                </div>
            )}

            <ControlPanelLanding
                windows={windows}
                onManageWindows={() => navigate('windows')}
                onManageExternalEvaluators={() => navigate('external-evaluators')}
                isExternalEvaluatorsEnabled={true}
            />

            {/* Grade Release Confirmation Modal */}
            <ConfirmationModal
                isOpen={showGradeReleaseModal}
                onClose={() => {
                    setShowGradeReleaseModal(false);
                    setGradeReleaseProjectType(null);
                }}
                onConfirm={confirmGradeRelease}
                title="Release Final Grades"
                message={`Are you sure you want to release FINAL grades for ${gradeReleaseProjectType}?`}
                details="This will make all completed evaluations (CLA-1, CLA-2, CLA-3, and External) visible to students. This action cannot be undone."
                confirmText="Yes, Release Grades"
                cancelText="Cancel"
                type="warning"
            />
        </div>
    );
}
