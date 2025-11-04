import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EducationEntry } from '../../types';
import { GlassCard, Badge } from '../ui';
import { cn } from '../../utils/cn';

interface EducationTimelineProps {
  education: EducationEntry[];
  onEdit?: (entry: EducationEntry) => void;
  onDelete?: (entryId: string) => void;
  editable?: boolean;
  className?: string;
}

export function EducationTimeline({
  education,
  onEdit,
  onDelete,
  editable = false,
  className,
}: EducationTimelineProps) {
  const [selectedEntry, setSelectedEntry] = useState<EducationEntry | null>(null);
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    if (months < 12) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) {
        return `${years} year${years !== 1 ? 's' : ''}`;
      } else {
        return `${years}y ${remainingMonths}m`;
      }
    }
  };

  const getGradeColor = (gpa?: number) => {
    if (!gpa) return 'text-textSecondary';
    if (gpa >= 3.7) return 'text-success';
    if (gpa >= 3.0) return 'text-info';
    if (gpa >= 2.5) return 'text-warning';
    return 'text-error';
  };

  const sortedEducation = [...education].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  if (education.length === 0) {
    return (
      <GlassCard variant="subtle" className={cn('p-8 text-center', className)}>
        <div className="text-4xl mb-4">🎓</div>
        <h3 className="text-lg font-medium text-text mb-2">No Education History</h3>
        <p className="text-textSecondary">Add your educational background to see it visualized on a timeline.</p>
      </GlassCard>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <GlassCard variant="elevated" className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-text">Education Timeline</h3>
            <Badge variant="glass" className="bg-primary">
              {education.length} entries
            </Badge>
          </div>

          {editable && (
            <button className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors text-sm">
              Add Education
            </button>
          )}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-primary opacity-30" />

          <div className="space-y-8">
            {sortedEducation.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div className="absolute left-6 w-4 h-4 bg-primary rounded-full border-4 border-surface shadow-lg z-10" />

                {/* Content */}
                <div className="ml-16">
                  <motion.div
                    className={cn(
                      'cursor-pointer transition-all duration-200',
                      hoveredEntry === entry.id && 'transform scale-105'
                    )}
                    onMouseEnter={() => setHoveredEntry(entry.id)}
                    onMouseLeave={() => setHoveredEntry(null)}
                    onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <GlassCard 
                      variant={selectedEntry?.id === entry.id ? "elevated" : "subtle"}
                      className={cn(
                        'p-6 transition-all duration-200',
                        selectedEntry?.id === entry.id && 'ring-2 ring-primary/20',
                        hoveredEntry === entry.id && 'shadow-lg'
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-text mb-1">
                            {entry.degree} in {entry.field}
                          </h4>
                          <p className="text-primary font-medium mb-2">{entry.institution}</p>
                          <div className="flex items-center space-x-4 text-sm text-textSecondary">
                            <span>
                              {formatDate(entry.startDate)} - {entry.endDate ? formatDate(entry.endDate) : 'Present'}
                            </span>
                            <span>•</span>
                            <span>{calculateDuration(entry.startDate, entry.endDate)}</span>
                            {entry.gpa && (
                              <>
                                <span>•</span>
                                <span className={getGradeColor(entry.gpa)}>
                                  GPA: {entry.gpa.toFixed(2)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {editable && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit?.(entry);
                              }}
                              className="p-2 text-textSecondary hover:text-primary transition-colors"
                              title="Edit entry"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this education entry?')) {
                                  onDelete?.(entry.id);
                                }
                              }}
                              className="p-2 text-textSecondary hover:text-error transition-colors"
                              title="Delete entry"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {entry.description && (
                        <p className="text-textSecondary mb-4 leading-relaxed">
                          {entry.description}
                        </p>
                      )}

                      {/* Achievements */}
                      {entry.achievements && entry.achievements.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-text mb-2">Key Achievements</h5>
                          <ul className="space-y-1">
                            {entry.achievements.map((achievement, idx) => (
                              <li key={idx} className="text-sm text-textSecondary flex items-start space-x-2">
                                <span className="text-success mt-1">•</span>
                                <span>{achievement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Expand indicator */}
                      <div className="flex items-center justify-center pt-2">
                        <motion.div
                          animate={{ rotate: selectedEntry?.id === entry.id ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg className="w-4 h-4 text-textSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </div>
                    </GlassCard>
                  </motion.div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {selectedEntry?.id === entry.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 overflow-hidden"
                      >
                        <GlassCard variant="subtle" className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Academic Details */}
                            <div>
                              <h5 className="font-medium text-text mb-3">Academic Details</h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-textSecondary">Institution:</span>
                                  <span className="text-text">{entry.institution}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-textSecondary">Degree:</span>
                                  <span className="text-text">{entry.degree}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-textSecondary">Field:</span>
                                  <span className="text-text">{entry.field}</span>
                                </div>
                                {entry.gpa && (
                                  <div className="flex justify-between">
                                    <span className="text-textSecondary">GPA:</span>
                                    <span className={getGradeColor(entry.gpa)}>
                                      {entry.gpa.toFixed(2)} / 4.0
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Timeline Details */}
                            <div>
                              <h5 className="font-medium text-text mb-3">Timeline</h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-textSecondary">Start Date:</span>
                                  <span className="text-text">{formatDate(entry.startDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-textSecondary">End Date:</span>
                                  <span className="text-text">
                                    {entry.endDate ? formatDate(entry.endDate) : 'Present'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-textSecondary">Duration:</span>
                                  <span className="text-text">
                                    {calculateDuration(entry.startDate, entry.endDate)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-textSecondary">Status:</span>
                                  <Badge 
                                    variant="glass" 
                                    size="sm"
                                    className={entry.endDate ? 'bg-success' : 'bg-info'}
                                  >
                                    {entry.endDate ? 'Completed' : 'In Progress'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-text">{education.length}</div>
              <div className="text-sm text-textSecondary">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text">
                {education.filter(e => !e.endDate).length}
              </div>
              <div className="text-sm text-textSecondary">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text">
                {education.filter(e => e.gpa && e.gpa >= 3.5).length}
              </div>
              <div className="text-sm text-textSecondary">High GPA (≥3.5)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text">
                {education.reduce((total, e) => total + (e.achievements?.length || 0), 0)}
              </div>
              <div className="text-sm text-textSecondary">Achievements</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
