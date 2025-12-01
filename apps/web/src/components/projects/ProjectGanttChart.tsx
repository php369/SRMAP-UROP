import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ProjectTimelineEvent } from '../../types';
import { GlassCard, Badge } from '../ui';
import { cn } from '../../utils/cn';

interface ProjectGanttChartProps {
  events: ProjectTimelineEvent[];
  startDate?: string;
  endDate?: string;
  onEventClick?: (event: ProjectTimelineEvent) => void;
  className?: string;
}

export function ProjectGanttChart({
  events,
  startDate,
  endDate,
  onEventClick,
  className,
}: ProjectGanttChartProps) {
  const [selectedEvent, setSelectedEvent] = useState<ProjectTimelineEvent | null>(null);
  const [viewMode, setViewMode] = useState<'days' | 'weeks' | 'months'>('weeks');

  // Calculate date range
  const dateRange = useMemo(() => {
    if (events.length === 0) {
      const now = new Date();
      return {
        start: startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1),
        end: endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 3, 0),
      };
    }

    const eventDates = events.map(e => new Date(e.date));
    const minDate = startDate ? new Date(startDate) : new Date(Math.min(...eventDates.map(d => d.getTime())));
    const maxDate = endDate ? new Date(endDate) : new Date(Math.max(...eventDates.map(d => d.getTime())));

    // Add some padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    return { start: minDate, end: maxDate };
  }, [events, startDate, endDate]);

  // Generate time periods based on view mode
  const timePeriods = useMemo(() => {
    const periods = [];
    const current = new Date(dateRange.start);
    
    while (current <= dateRange.end) {
      periods.push(new Date(current));
      
      if (viewMode === 'days') {
        current.setDate(current.getDate() + 1);
      } else if (viewMode === 'weeks') {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }
    
    return periods;
  }, [dateRange, viewMode]);

  const getEventTypeColor = (type: ProjectTimelineEvent['type']) => {
    switch (type) {
      case 'milestone':
        return 'bg-success';
      case 'task':
        return 'bg-info';
      case 'meeting':
        return 'bg-warning';
      case 'deadline':
        return 'bg-error';
      case 'note':
        return 'bg-secondary';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventTypeIcon = (type: ProjectTimelineEvent['type']) => {
    switch (type) {
      case 'milestone':
        return '🎯';
      case 'task':
        return '📋';
      case 'meeting':
        return '👥';
      case 'deadline':
        return '⏰';
      case 'note':
        return '📝';
      default:
        return '📌';
    }
  };

  const getStatusColor = (status: ProjectTimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'in-progress':
        return 'bg-info';
      case 'pending':
        return 'bg-warning';
      case 'cancelled':
        return 'bg-error';
      default:
        return 'bg-gray-500';
    }
  };

  const formatPeriodLabel = (date: Date) => {
    if (viewMode === 'days') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (viewMode === 'weeks') {
      const endOfWeek = new Date(date);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const getEventPosition = (eventDate: Date) => {
    const totalDuration = dateRange.end.getTime() - dateRange.start.getTime();
    const eventOffset = eventDate.getTime() - dateRange.start.getTime();
    return (eventOffset / totalDuration) * 100;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (events.length === 0) {
    return (
      <GlassCard variant="subtle" className={cn('p-8 text-center', className)}>
        <div className="text-4xl mb-4">📅</div>
        <h3 className="text-lg font-medium text-text mb-2">No Timeline Events</h3>
        <p className="text-textSecondary">No timeline events have been added to this project yet.</p>
      </GlassCard>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <GlassCard variant="elevated" className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-text">Project Timeline</h3>
            <Badge variant="glass" className="bg-primary">
              {events.length} events
            </Badge>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-surface border border-border rounded-lg p-1">
            {(['days', 'weeks', 'months'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize',
                  viewMode === mode
                    ? 'bg-primary text-textPrimary'
                    : 'text-textSecondary hover:text-text'
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Header */}
        <div className="mb-4 overflow-x-auto">
          <div className="min-w-max">
            <div className="grid grid-cols-12 gap-2 mb-2">
              {timePeriods.slice(0, 12).map((period, index) => (
                <div key={index} className="text-xs text-textSecondary text-center p-2">
                  {formatPeriodLabel(period)}
                </div>
              ))}
            </div>
            <div className="h-px bg-border mb-4" />
          </div>
        </div>

        {/* Timeline Events */}
        <div className="space-y-3 overflow-x-auto">
          <div className="min-w-max relative" style={{ width: '100%', minWidth: '800px' }}>
            {events.map((event, index) => {
              const position = getEventPosition(new Date(event.date));
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="relative mb-4"
                >
                  {/* Event Row */}
                  <div className="flex items-center space-x-4 p-3 bg-surface/30 rounded-lg hover:bg-surface/50 transition-colors">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                        <Badge 
                          variant="glass" 
                          size="sm"
                          className={getEventTypeColor(event.type)}
                        >
                          {event.type}
                        </Badge>
                        <Badge 
                          variant="glass" 
                          size="sm"
                          className={getStatusColor(event.status)}
                        >
                          {event.status}
                        </Badge>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-text truncate">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-textSecondary truncate">{event.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-textSecondary">
                      <span>{formatDate(event.date)}</span>
                      {event.duration && (
                        <span>{event.duration}h</span>
                      )}
                      {event.assignedTo && event.assignedTo.length > 0 && (
                        <div className="flex -space-x-1">
                          {event.assignedTo.slice(0, 3).map((userId, idx) => (
                            <div
                              key={userId}
                              className="w-6 h-6 rounded-full bg-primary/20 border border-surface flex items-center justify-center text-xs font-medium text-primary"
                              style={{ zIndex: 10 - idx }}
                            >
                              {userId.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {event.assignedTo.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-secondary/20 border border-surface flex items-center justify-center text-xs font-medium text-secondary">
                              +{event.assignedTo.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedEvent(selectedEvent?.id === event.id ? null : event);
                        onEventClick?.(event);
                      }}
                      className="p-2 text-textSecondary hover:text-primary transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* Timeline Bar */}
                  <div className="relative h-2 bg-border/30 rounded-full mt-2 overflow-hidden">
                    <motion.div
                      className={cn(
                        'absolute top-0 h-full rounded-full',
                        getEventTypeColor(event.type)
                      )}
                      style={{ 
                        left: `${Math.max(0, position - 1)}%`,
                        width: event.duration ? `${Math.min(10, event.duration / 24 * 100)}%` : '2%'
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: event.duration ? `${Math.min(10, event.duration / 24 * 100)}%` : '2%' }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                    
                    {/* Event marker */}
                    <div
                      className={cn(
                        'absolute top-0 w-1 h-full',
                        getStatusColor(event.status)
                      )}
                      style={{ left: `${position}%` }}
                    />
                  </div>

                  {/* Expanded Details */}
                  {selectedEvent?.id === event.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 p-4 bg-surface/50 rounded-lg border border-border"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-text mb-2">Event Details</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-textSecondary">Date:</span>
                              <span className="text-text">{formatDate(event.date)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-textSecondary">Time:</span>
                              <span className="text-text">{formatTime(event.date)}</span>
                            </div>
                            {event.duration && (
                              <div className="flex justify-between">
                                <span className="text-textSecondary">Duration:</span>
                                <span className="text-text">{event.duration} hours</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-textSecondary">Status:</span>
                              <Badge 
                                variant="glass" 
                                size="sm"
                                className={getStatusColor(event.status)}
                              >
                                {event.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {event.description && (
                          <div>
                            <h5 className="font-medium text-text mb-2">Description</h5>
                            <p className="text-sm text-textSecondary">{event.description}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-text mb-3">Legend</h4>
          <div className="flex flex-wrap gap-4">
            {(['milestone', 'task', 'meeting', 'deadline', 'note'] as const).map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <span className="text-sm">{getEventTypeIcon(type)}</span>
                <Badge variant="glass" size="sm" className={getEventTypeColor(type)}>
                  {type}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
