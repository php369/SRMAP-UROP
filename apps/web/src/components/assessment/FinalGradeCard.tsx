import { motion } from 'framer-motion';
import { Award, Trophy } from 'lucide-react';

interface FinalGradeCardProps {
  totalScore: number;
  maxScore?: number;
  isReleased: boolean;
  className?: string;
}

export function FinalGradeCard({ 
  totalScore, 
  maxScore = 100, 
  isReleased, 
  className = "" 
}: FinalGradeCardProps) {
  if (!isReleased) return null;

  // Calculate grade percentage and determine color
  const percentage = (totalScore / maxScore) * 100;
  const getGradeColor = () => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeBg = () => {
    if (percentage >= 90) return 'from-green-50 to-emerald-50 border-green-200';
    if (percentage >= 80) return 'from-blue-50 to-indigo-50 border-blue-200';
    if (percentage >= 70) return 'from-yellow-50 to-amber-50 border-yellow-200';
    if (percentage >= 60) return 'from-orange-50 to-red-50 border-orange-200';
    return 'from-red-50 to-pink-50 border-red-200';
  };

  const getGradeLabel = () => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Very Good';
    if (percentage >= 70) return 'Good';
    if (percentage >= 60) return 'Satisfactory';
    return 'Needs Improvement';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-6 bg-gradient-to-r ${getGradeBg()} rounded-lg border-2 ${className}`}
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          {percentage >= 80 ? (
            <Trophy className="w-8 h-8 text-yellow-500" />
          ) : (
            <Award className="w-8 h-8 text-blue-500" />
          )}
          <h4 className="text-2xl font-bold text-gray-800">Final Grade Released</h4>
        </div>
        
        <div className={`text-6xl font-bold ${getGradeColor()} mb-2`}>
          {totalScore}/{maxScore}
        </div>
        
        <div className="mb-4">
          <div className={`inline-block px-4 py-2 rounded-full text-lg font-semibold ${getGradeColor()} bg-white/50`}>
            {getGradeLabel()} ({percentage.toFixed(1)}%)
          </div>
        </div>
        
        <p className="text-gray-600">
          🎉 Congratulations! Your assessment has been completed and your final grade is now available.
        </p>
      </div>
    </motion.div>
  );
}