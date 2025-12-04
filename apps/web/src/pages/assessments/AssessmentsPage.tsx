import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EvaluationCard } from '../../components/assessments/EvaluationCard';
import { EvaluationService, StudentEvaluationView } from '../../services/evaluationService';
import { api } from '../../utils/api';
import {
  Award,
  Users,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  FileText,
  Calendar,
  Video
} from 'lucide-react';

export const AssessmentsPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<StudentEvaluationView[]>([]);
  const [meetingLogs, setMeetingLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    loadEvaluations();
    loadMeetingLogs();
  }, []);

  const loadEvaluations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const evaluationsData = await EvaluationService.getMyEvaluations();
      setEvaluations(evaluationsData);
    } catch (error: any) {
      setError(error.message || 'Failed to load assessments');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMeetingLogs = async () => {
    try {
      const response = await api.get('/meetings/student');
      if (response.success && response.data) {
        // Filter only approved/completed meetings with logs
        const logsWithMinutes = (response.data as any[]).filter(
          m => (m.status === 'approved' || m.status === 'completed') && (m.minutesOfMeeting || m.mom)
        );
        setMeetingLogs(logsWithMinutes);
      }
    } catch (error) {
      console.error('Error loading meeting logs:', error);
    }
  };

  const handleJoinMeeting = (meetUrl: string) => {
    window.open(meetUrl, '_blank', 'noopener,noreferrer');
  };

  const getOverallStats = () => {
    const total = evaluations.length;
    const published = evaluations.filter(e => e.evaluation?.isPublished).length;
    const submitted = evaluations.filter(e => e.hasSubmission).length;
    const inProgress = evaluations.filter(e =>
      e.evaluation && !e.evaluation.isPublished &&
      EvaluationService.getEvaluationProgress(e.evaluation) > 0
    ).length;

    return { total, published, submitted, inProgress };
  };

  const stats = getOverallStats();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-textPrimary mb-2">Error Loading Assessments</h2>
          <p className="text-textSecondary mb-4">{error}</p>
          <Button onClick={loadEvaluations}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-textPrimary mb-2">Assessments & Grades</h1>
            <p className="text-textSecondary">
              View your project evaluations and grades. Scores are visible only after publication by coordinators.
            </p>
          </div>

          <Button variant="outline" onClick={loadEvaluations}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-accent" />
              <div>
                <div className="text-2xl font-bold text-textPrimary">{stats.total}</div>
                <div className="text-sm text-textSecondary">Total Groups</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-textPrimary">{stats.submitted}</div>
                <div className="text-sm text-textSecondary">Submitted</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-textPrimary">{stats.inProgress}</div>
                <div className="text-sm text-textSecondary">In Progress</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <Eye className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-textPrimary">{stats.published}</div>
                <div className="text-sm text-textSecondary">Published</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {evaluations.length === 0 ? (
        <Card className="p-8 text-center">
          <Award className="w-16 h-16 text-textSecondary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-textPrimary mb-2">No Assessments Found</h2>
          <p className="text-textSecondary mb-4">
            You need to be part of a group with an approved project to see assessments.
          </p>
          <Button variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            Go to Groups
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Grade Visibility Notice */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <EyeOff className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Grade Visibility</h3>
                <p className="text-sm text-blue-700">
                  Assessment scores are hidden until published by coordinators. You'll see detailed breakdowns
                  including A1, A2, A3 internal assessments and external evaluation scores once published.
                </p>
              </div>
            </div>
          </Card>

          {/* Evaluations List */}
          <div className="space-y-6">
            {evaluations.map((evaluationView) => (
              <EvaluationCard
                key={evaluationView.groupId}
                evaluationView={evaluationView}
                onJoinMeeting={handleJoinMeeting}
              />
            ))}
          </div>

          {/* Meeting Logs Section */}
          {meetingLogs.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-textPrimary mb-4">Meeting Logs</h2>
              <div className="space-y-4">
                {meetingLogs.map((log) => (
                  <Card key={log._id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {log.mode === 'online' ? (
                            <Video className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Users className="w-5 h-5 text-green-600" />
                          )}
                          <h3 className="font-semibold text-textPrimary">
                            {log.projectId?.title || 'Project Meeting'}
                          </h3>
                          {log.status === 'approved' && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Approved
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-textSecondary mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(log.meetingDate).toLocaleString()}
                          </div>
                          <div>
                            Faculty: {log.facultyId?.name || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-medium text-sm text-textPrimary mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Minutes of Meeting
                          </h4>
                          <p className="text-sm text-textSecondary whitespace-pre-wrap line-clamp-3">
                            {log.minutesOfMeeting || log.mom}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="ml-4"
                      >
                        View Full
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <Card className="p-4 mt-6">
            <h3 className="font-medium text-textPrimary mb-3">Assessment Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-textPrimary mb-2">Internal Assessments (50 marks)</h4>
                <ul className="space-y-1 text-textSecondary">
                  <li>• A1 - Project Proposal (20 → 10 marks)</li>
                  <li>• A2 - Progress Review (30 → 15 marks)</li>
                  <li>• A3 - Final Implementation (50 → 25 marks)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-textPrimary mb-2">External Assessment (50 marks)</h4>
                <ul className="space-y-1 text-textSecondary">
                  <li>• Final Presentation & Report (100 → 50 marks)</li>
                  <li>• Evaluated by external faculty</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Meeting Log Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-textPrimary mb-2">
                  {selectedLog.projectId?.title || 'Meeting Log'}
                </h2>
                <div className="flex items-center gap-4 text-sm text-textSecondary">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedLog.meetingDate).toLocaleString()}
                  </div>
                  <div>Faculty: {selectedLog.facultyId?.name}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-textPrimary mb-2">Meeting Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-textSecondary">Mode:</span>
                    <span className="ml-2 text-textPrimary capitalize">{selectedLog.mode}</span>
                  </div>
                  <div>
                    <span className="text-textSecondary">Status:</span>
                    <span className="ml-2 text-textPrimary capitalize">{selectedLog.status}</span>
                  </div>
                  {selectedLog.location && (
                    <div className="col-span-2">
                      <span className="text-textSecondary">Location:</span>
                      <span className="ml-2 text-textPrimary">{selectedLog.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-textPrimary mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Minutes of Meeting
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-textSecondary whitespace-pre-wrap">
                    {selectedLog.minutesOfMeeting || selectedLog.mom}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};