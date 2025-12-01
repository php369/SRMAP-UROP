import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SubmissionForm } from '../../components/submissions/SubmissionForm';
import { SubmissionCard } from '../../components/submissions/SubmissionCard';
import { SubmissionService } from '../../services/submissionService';
import { GroupService } from '../../services/groupService';
import { GroupSubmission, Group, SubmissionEligibility } from '../../types';
import { 
  Upload, 
  FileText, 
  Users, 
  AlertCircle, 
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

export const SubmissionsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [submissions, setSubmissions] = useState<GroupSubmission[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [eligibility, setEligibility] = useState<Record<string, SubmissionEligibility>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load user's groups and submissions in parallel
      const [groupsData, submissionsData] = await Promise.all([
        GroupService.getMyGroups(),
        SubmissionService.getMySubmissions()
      ]);

      setGroups(groupsData);
      setSubmissions(submissionsData);

      // Check submission eligibility for each approved group
      const approvedGroups = groupsData.filter(group => group.status === 'approved');
      const eligibilityPromises = approvedGroups.map(async (group: Group) => {
        try {
          const eligibilityData = await SubmissionService.checkSubmissionEligibility(group._id);
          return { groupId: group._id, eligibility: eligibilityData };
        } catch (error) {
          return { groupId: group._id, eligibility: { canSubmit: false, reason: 'Error checking eligibility' } };
        }
      });

      const eligibilityResults = await Promise.all(eligibilityPromises);
      const eligibilityMap = eligibilityResults.reduce((acc: Record<string, SubmissionEligibility>, result: { groupId: string; eligibility: SubmissionEligibility }) => {
        acc[result.groupId] = result.eligibility;
        return acc;
      }, {} as Record<string, SubmissionEligibility>);

      setEligibility(eligibilityMap);
    } catch (error: any) {
      setError(error.message || 'Failed to load submissions data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmissionCreated = () => {
    setShowSubmissionForm(false);
    setSelectedGroup(null);
    loadData(); // Reload data to show new submission
  };

  const handleSubmissionUpdated = (updatedSubmission: GroupSubmission) => {
    setSubmissions(prev => 
      prev.map(sub => 
        sub._id === updatedSubmission._id ? updatedSubmission : sub
      )
    );
  };

  const getGroupSubmission = (groupId: string) => {
    return submissions.find(sub => sub.groupId === groupId);
  };

  const getStatusBadge = (group: Group) => {
    const submission = getGroupSubmission(group._id);
    
    if (submission) {
      return <Badge variant="success">Submitted</Badge>;
    }
    
    if (group.status === 'approved') {
      const groupEligibility = eligibility[group._id];
      if (groupEligibility?.canSubmit) {
        return <Badge variant="warning">Pending Submission</Badge>;
      } else {
        return <Badge variant="secondary">Cannot Submit</Badge>;
      }
    }
    
    return <Badge variant="secondary">{group.status}</Badge>;
  };

  const canSubmitForGroup = (group: Group) => {
    return group.status === 'approved' && 
           eligibility[group._id]?.canSubmit && 
           !getGroupSubmission(group._id);
  };

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
          <h2 className="text-xl font-semibold text-textPrimary mb-2">Error Loading Submissions</h2>
          <p className="text-textSecondary mb-4">{error}</p>
          <Button onClick={loadData}>Try Again</Button>
        </Card>
      </div>
    );
  }

  if (showSubmissionForm && selectedGroup) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SubmissionForm
          groupId={selectedGroup._id}
          onSubmissionCreated={handleSubmissionCreated}
          onCancel={() => {
            setShowSubmissionForm(false);
            setSelectedGroup(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-textPrimary mb-2">Project Submissions</h1>
        <p className="text-textSecondary">
          Submit your project files and track submission status for your groups.
        </p>
      </div>

      {groups.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="w-16 h-16 text-textSecondary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-textPrimary mb-2">No Groups Found</h2>
          <p className="text-textSecondary mb-4">
            You need to be part of a group with an approved project to submit.
          </p>
          <Button variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            Go to Groups
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Groups Overview */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-textPrimary mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Your Groups
            </h2>
            
            <div className="space-y-4">
              {groups.map((group) => {
                const submission = getGroupSubmission(group._id);
                const groupEligibility = eligibility[group._id];
                
                return (
                  <div
                    key={group._id}
                    className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-textPrimary">
                          Group {group.code}
                        </h3>
                        {getStatusBadge(group)}
                        <Badge variant="outline">{group.type}</Badge>
                      </div>
                      
                      <div className="text-sm text-textSecondary space-y-1">
                        <p>Members: {group.memberIds.length}</p>
                        {group.projectId && (
                          <p>Project: {(group.projectId as any)?.title || 'Assigned'}</p>
                        )}
                        {!groupEligibility?.canSubmit && groupEligibility?.reason && (
                          <p className="text-red-500 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {groupEligibility.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {submission ? (
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Submitted</span>
                        </div>
                      ) : canSubmitForGroup(group) ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedGroup(group);
                            setShowSubmissionForm(true);
                          }}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Submit
                        </Button>
                      ) : (
                        <div className="flex items-center space-x-2 text-sm text-textSecondary">
                          <Clock className="w-4 h-4" />
                          <span>Not Ready</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Submissions */}
          {submissions.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-textPrimary mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Your Submissions
              </h2>
              
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <SubmissionCard
                    key={submission._id}
                    submission={submission}
                    onUpdate={handleSubmissionUpdated}
                    showGroupInfo={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};