import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GradeHistory as GradeHistoryType } from '../../types';
import { GlassCard, Badge } from '../ui';
import { cn } from '../../utils/cn';

interface GradeHistoryProps {
  history: GradeHistoryType[];
  currentVersion: number;
  onRestoreVersion?: (version: number) => void;
  className?: string;
}

export function GradeHistory({
  history,
  currentVersion,
  onRestoreVersion,
  className,
}: GradeHistoryProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set([currentVersion]));

  const toggleVersion = (version: number) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
    } else {
      newExpanded.add(version);
    }
    setExpandedVersions(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return '✨';
      case 'updated':
        return '📝';
      case 'revised':
        return '🔄';
      default:
        return '📋';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-success';
      case 'updated':
        return 'bg-info';
      case 'revised':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };

  const getGradeColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-success';
    if (percentage >= 80) return 'text-info';
    if (percentage >= 70) return 'text-warning';
    return 'text-error';
  };

  if (history.length === 0) {
    return (
      <GlassCard variant="subtle" className={cn('p-6 text-center', className)}>
        <div className="text-textSecondary">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-text mb-2">No Grade History</h3>
          <p>This submission hasn't been graded yet.</p>
        </div>
      </GlassCard>
    );
  }

  // Sort history by version (newest first)
  const sortedHistory = [...history].sort((a, b) => b.version - a.version);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text">Grade History</h3>
        <Badge variant="glass" className="bg-info">
          {history.length} version{history.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-3">
        {sortedHistory.map((entry, index) => {
          const isExpanded = expandedVersions.has(entry.version);
          const isCurrent = entry.version === currentVersion;
          const isLatest = index === 0;

          return (
            <GlassCard 
              key={entry.id} 
              variant={isCurrent ? "elevated" : "subtle"}
              className={cn(
                'overflow-hidden transition-all',
                isCurrent && 'ring-2 ring-primary/20'
              )}
            >
              {/* History Entry Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-surface/50 transition-colors"
                onClick={() => toggleVersion(entry.version)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant="glass" 
                      className={getActionColor(entry.action)}
                    >
                      <span className="mr-1">{getActionIcon(entry.action)}</span>
                      Version {entry.version}
                    </Badge>
                    
                    {isCurrent && (
                      <Badge variant="glass" className="bg-primary">
                        Current
                      </Badge>
                    )}
                    
                    {isLatest && !isCurrent && (
                      <Badge variant="glass" className="bg-success">
                        Latest
                      </Badge>
                    )}

                    <div className={cn(
                      'text-lg font-semibold',
                      getGradeColor(entry.score, entry.maxScore)
                    )}>
                      {entry.score}/{entry.maxScore}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right text-sm">
                      <div className="text-text font-medium">{entry.gradedByName}</div>
                      <div className="text-textSecondary">{formatDate(entry.gradedAt)}</div>
                    </div>
                    
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="w-5 h-5 text-textSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* History Entry Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-border space-y-4">
                      {/* Score and Percentage */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-textSecondary mb-1">Score</div>
                          <div className={cn(
                            'text-2xl font-bold',
                            getGradeColor(entry.score, entry.maxScore)
                          )}>
                            {entry.score} / {entry.maxScore}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-textSecondary mb-1">Percentage</div>
                          <div className={cn(
                            'text-2xl font-bold',
                            getGradeColor(entry.score, entry.maxScore)
                          )}>
                            {Math.round((entry.score / entry.maxScore) * 100)}%
                          </div>
                        </div>
                      </div>

                      {/* Feedback */}
                      {entry.feedback && (
                        <div>
                          <div className="text-sm font-medium text-text mb-2">Feedback</div>
                          <div className="prose prose-sm max-w-none text-textSecondary bg-surface/30 p-3 rounded-lg">
                            {/* Safely render feedback as plain text to prevent XSS */}
                            <div className="whitespace-pre-wrap">{entry.feedback}</div>
                          </div>
                        </div>
                      )}

                      {/* Rubric Scores */}
                      {entry.rubricScores && entry.rubricScores.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-text mb-2">Rubric Scores</div>
                          <div className="space-y-2">
                            {entry.rubricScores.map((rubricScore, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-surface/30 rounded">
                                <span className="text-sm text-text">Criterion {idx + 1}</span>
                                <Badge variant="glass" className="bg-secondary">
                                  {rubricScore.customPoints ?? rubricScore.points} pts
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Changes */}
                      {entry.changes && entry.changes.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-text mb-2">Changes Made</div>
                          <div className="space-y-2">
                            {entry.changes.map((change, idx) => (
                              <div key={idx} className="p-2 bg-surface/30 rounded text-sm">
                                <div className="font-medium text-text capitalize">{change.field}</div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-error">From: {String(change.oldValue)}</span>
                                  <span className="text-textSecondary">→</span>
                                  <span className="text-success">To: {String(change.newValue)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="text-xs text-textSecondary">
                          Action: <span className="capitalize">{entry.action}</span>
                        </div>
                        
                        {!isCurrent && onRestoreVersion && (
                          <button
                            onClick={() => onRestoreVersion(entry.version)}
                            className="px-3 py-1.5 text-sm bg-warning/20 text-warning border border-warning/30 rounded hover:bg-warning/30 transition-colors"
                          >
                            Restore This Version
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
