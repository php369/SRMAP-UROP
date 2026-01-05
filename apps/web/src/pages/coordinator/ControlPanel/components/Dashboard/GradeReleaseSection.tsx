import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import { ProjectType } from '../../types';

interface GradeReleaseSectionProps {
  releasedGrades: Record<ProjectType, boolean>;
  onReleaseGrades: (projectType: ProjectType) => void;
}

export function GradeReleaseSection({ releasedGrades, onReleaseGrades }: GradeReleaseSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 mb-8"
    >
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Award className="w-6 h-6" />
        Release Final Grades
      </h2>
      <p className="text-gray-600 mb-6">
        Release final grades to students. This will make all completed evaluations (CLA-1, CLA-2, CLA-3, and External) visible to students as their total score out of 100.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {(['IDP', 'UROP', 'CAPSTONE'] as ProjectType[]).map((projectType) => {
          const isReleased = releasedGrades[projectType];
          return (
            <div key={projectType} className="p-6 border-2 border-gray-200 rounded-lg text-center">
              <h3 className="font-bold text-lg mb-4">{projectType}</h3>
              <button
                onClick={() => onReleaseGrades(projectType)}
                disabled={isReleased}
                className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                  isReleased 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isReleased ? 'Grades Released' : 'Release Final Grades'}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                {isReleased 
                  ? 'Final grades have been released to students' 
                  : 'Students will see their total score out of 100'
                }
              </p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}