import { useState } from 'react';
import { motion } from 'framer-motion';
import { RubricCriterion, RubricScore } from '../../types';
import { GlassCard, Badge } from '../ui';
import { cn } from '../../utils/cn';

interface RubricGradingProps {
  rubric: RubricCriterion[];
  scores: RubricScore[];
  onScoreChange: (scores: RubricScore[]) => void;
  disabled?: boolean;
  className?: string;
}

export function RubricGrading({
  rubric,
  scores,
  onScoreChange,
  disabled = false,
  className,
}: RubricGradingProps) {
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());

  const toggleCriterion = (criterionId: string) => {
    const newExpanded = new Set(expandedCriteria);
    if (newExpanded.has(criterionId)) {
      newExpanded.delete(criterionId);
    } else {
      newExpanded.add(criterionId);
    }
    setExpandedCriteria(newExpanded);
  };

  const updateScore = (criterionId: string, levelId: string, points: number) => {
    const newScores = scores.filter(s => s.criterionId !== criterionId);
    newScores.push({
      criterionId,
      levelId,
      points,
    });
    onScoreChange(newScores);
  };

  const updateCustomPoints = (criterionId: string, customPoints: number) => {
    const newScores = scores.map(score => 
      score.criterionId === criterionId 
        ? { ...score, customPoints }
        : score
    );
    onScoreChange(newScores);
  };

  const updateComments = (criterionId: string, comments: string) => {
    const newScores = scores.map(score => 
      score.criterionId === criterionId 
        ? { ...score, comments }
        : score
    );
    onScoreChange(newScores);
  };

  const getScoreForCriterion = (criterionId: string): RubricScore | undefined => {
    return scores.find(s => s.criterionId === criterionId);
  };

  const getTotalScore = (): number => {
    return scores.reduce((total, score) => {
      return total + (score.customPoints ?? score.points);
    }, 0);
  };

  const getMaxScore = (): number => {
    return rubric.reduce((total, criterion) => total + criterion.maxPoints, 0);
  };

  if (rubric.length === 0) {
    return (
      <GlassCard variant="subtle" className={cn('p-6 text-center', className)}>
        <div className="text-textSecondary">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-text mb-2">No Rubric Available</h3>
          <p>This assessment doesn't have a rubric. You can still provide a score and feedback.</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Rubric Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text">Grading Rubric</h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-textSecondary">
            Total: <span className="font-semibold text-text">{getTotalScore()}</span> / {getMaxScore()} points
          </div>
          <Badge 
            variant="glass" 
            className={cn(
              getTotalScore() >= getMaxScore() * 0.9 ? 'bg-success' :
              getTotalScore() >= getMaxScore() * 0.7 ? 'bg-info' :
              getTotalScore() >= getMaxScore() * 0.6 ? 'bg-warning' : 'bg-error'
            )}
          >
            {Math.round((getTotalScore() / getMaxScore()) * 100)}%
          </Badge>
        </div>
      </div>

      {/* Rubric Criteria */}
      <div className="space-y-3">
        {rubric.map((criterion) => {
          const score = getScoreForCriterion(criterion.id);
          const isExpanded = expandedCriteria.has(criterion.id);

          return (
            <GlassCard key={criterion.id} variant="subtle" className="overflow-hidden">
              {/* Criterion Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-surface/50 transition-colors"
                onClick={() => toggleCriterion(criterion.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-text">{criterion.name}</h4>
                      <Badge variant="glass" className="bg-secondary">
                        {criterion.maxPoints} pts
                      </Badge>
                      {score && (
                        <Badge 
                          variant="glass" 
                          className={cn(
                            (score.customPoints ?? score.points) >= criterion.maxPoints * 0.9 ? 'bg-success' :
                            (score.customPoints ?? score.points) >= criterion.maxPoints * 0.7 ? 'bg-info' :
                            (score.customPoints ?? score.points) >= criterion.maxPoints * 0.6 ? 'bg-warning' : 'bg-error'
                          )}
                        >
                          {score.customPoints ?? score.points} pts
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-textSecondary mt-1">{criterion.description}</p>
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

              {/* Criterion Details */}
              <motion.div
                initial={false}
                animate={{ height: isExpanded ? 'auto' : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 border-t border-border">
                  {/* Performance Levels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    {criterion.levels.map((level) => {
                      const isSelected = score?.levelId === level.id;
                      
                      return (
                        <button
                          key={level.id}
                          type="button"
                          onClick={() => updateScore(criterion.id, level.id, level.points)}
                          disabled={disabled}
                          className={cn(
                            'p-3 text-left border rounded-lg transition-all',
                            'hover:border-primary/50 hover:bg-primary/5',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            isSelected 
                              ? 'border-primary bg-primary/10 text-primary' 
                              : 'border-border bg-surface/50 text-text'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{level.name}</span>
                            <Badge 
                              variant="glass" 
                              size="sm"
                              className={isSelected ? 'bg-primary' : 'bg-secondary'}
                            >
                              {level.points} pts
                            </Badge>
                          </div>
                          <p className="text-xs text-textSecondary">{level.description}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Points */}
                  {score && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-text">
                          Custom Points (optional):
                        </label>
                        <input
                          type="number"
                          value={score.customPoints ?? ''}
                          onChange={(e) => updateCustomPoints(criterion.id, parseFloat(e.target.value) || 0)}
                          min="0"
                          max={criterion.maxPoints}
                          step="0.5"
                          disabled={disabled}
                          placeholder={`Default: ${score.points}`}
                          className="w-24 px-3 py-1 bg-surface border border-border rounded text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                        />
                        <span className="text-xs text-textSecondary">
                          Max: {criterion.maxPoints} pts
                        </span>
                      </div>

                      {/* Criterion Comments */}
                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          Comments for this criterion:
                        </label>
                        <textarea
                          value={score.comments || ''}
                          onChange={(e) => updateComments(criterion.id, e.target.value)}
                          disabled={disabled}
                          placeholder="Add specific feedback for this criterion..."
                          rows={2}
                          className="w-full px-3 py-2 bg-surface border border-border rounded text-text text-sm placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </GlassCard>
          );
        })}
      </div>

      {/* Summary */}
      <GlassCard variant="elevated" className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-text">Rubric Score Summary</h4>
            <p className="text-sm text-textSecondary">
              {scores.length} of {rubric.length} criteria graded
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-text">
              {getTotalScore()} / {getMaxScore()}
            </div>
            <div className="text-sm text-textSecondary">
              {Math.round((getTotalScore() / getMaxScore()) * 100)}% Score
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
