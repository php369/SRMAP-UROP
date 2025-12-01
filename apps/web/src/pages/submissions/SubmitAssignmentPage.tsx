import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SubmissionForm, SubmissionFormData } from '../../components/submissions/SubmissionForm';
import { Assessment } from '../../components/assessments';
import { LoadingSpinner } from '../../components/ui';

// Mock data - in real app this would come from API
const mockAssessment: Assessment = {
  id: '1',
  title: 'Machine Learning Fundamentals Quiz',
  description: 'Test your understanding of basic ML concepts including supervised learning, unsupervised learning, and neural networks.',
  dueDate: '2024-01-15T23:59:00Z',
  status: 'published',
  course: 'CS 4641 - Machine Learning',
  cohort: 'Fall 2024',
  meetUrl: 'https://meet.google.com/abc-defg-hij',
  submissionCount: 15,
  totalStudents: 25,
  maxScore: 100,
  createdBy: 'Dr. Smith',
  createdAt: '2024-01-01T10:00:00Z',
};

export function SubmitAssignmentPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    // In real app, this would fetch assessment from API
    const fetchAssessment = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAssessment(mockAssessment);
      } catch (error) {
        console.error('Error fetching assessment:', error);
        navigate('/assessments');
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) {
      fetchAssessment();
    } else {
      navigate('/assessments');
    }
  }, [assessmentId, navigate]);

  const handleSubmit = async (data: SubmissionFormData) => {
    setSubmitting(true);
    
    try {
      // In real app, this would call the API to submit the assignment
      console.log('Submitting assignment:', { assessmentId, data });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Navigate to submissions page with success message
      navigate('/submissions', { 
        state: { 
          message: 'Assignment submitted successfully!',
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Error submitting assignment:', error);
      // Handle error (show toast, etc.)
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async (data: SubmissionFormData) => {
    try {
      // In real app, this would call the API to save draft
      console.log('Saving draft:', { assessmentId, data });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      // Handle error
    }
  };

  const handleCancel = () => {
    navigate(`/assessments/${assessmentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text mb-2">Assessment Not Found</h2>
          <p className="text-textSecondary mb-4">The assessment you're trying to submit to doesn't exist.</p>
          <button
            onClick={() => navigate('/assessments')}
            className="px-6 py-3 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <SubmissionForm
        assessment={assessment}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        onCancel={handleCancel}
        loading={submitting}
      />
    </div>
  );
}
