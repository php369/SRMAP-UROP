import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AssessmentForm, AssessmentFormData } from '../../components/assessments/AssessmentForm';
import { LoadingSpinner } from '../../components/ui';

// Mock data - in real app this would come from API
const mockCourses = [
  'CS 1332 - Data Structures',
  'CS 3510 - Algorithms',
  'CS 4400 - Database Systems',
  'CS 4641 - Machine Learning',
  'CS 3300 - Software Engineering',
];

const mockCohorts = [
  'Fall 2024',
  'Spring 2024',
  'Summer 2024',
  'Fall 2023',
];

const mockAssessmentData: Partial<AssessmentFormData> = {
  title: 'Machine Learning Fundamentals Quiz',
  description: 'Test your understanding of basic ML concepts including supervised learning, unsupervised learning, and neural networks.',
  course: 'CS 4641 - Machine Learning',
  cohort: 'Fall 2024',
  dueDate: '2024-01-15',
  dueTime: '23:59',
  timezone: 'America/New_York',
  maxScore: 100,
  instructions: 'This quiz covers chapters 1-5 of the textbook. You have 60 minutes to complete it. Make sure to show your work for partial credit.',
  allowLateSubmissions: true,
  latePenalty: 10,
  maxAttempts: 2,
  showScoreImmediately: false,
  requireMeetingAttendance: true,
  tags: ['quiz', 'machine-learning', 'fundamentals'],
};

export function EditAssessmentPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [assessmentData, setAssessmentData] = useState<Partial<AssessmentFormData> | null>(null);

  useEffect(() => {
    // In real app, this would fetch the assessment data from API
    const fetchAssessment = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAssessmentData(mockAssessmentData);
      } catch (error) {
        console.error('Error fetching assessment:', error);
        // Handle error (show toast, navigate back, etc.)
        navigate('/dashboard/assessments');
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      fetchAssessment();
    } else {
      navigate('/dashboard/assessments');
    }
  }, [id, navigate]);

  const handleSubmit = async (data: AssessmentFormData) => {
    setLoading(true);
    
    try {
      // In real app, this would call the API to update the assessment
      console.log('Updating assessment:', { id, data });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate back to assessment detail or list
      navigate(`/assessments/${id}`);
    } catch (error) {
      console.error('Error updating assessment:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/assessments/${id}`);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!assessmentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text mb-2">Assessment Not Found</h2>
          <p className="text-textSecondary mb-4">The assessment you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard/assessments')}
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
      <AssessmentForm
        initialData={assessmentData}
        availableCourses={mockCourses}
        availableCohorts={mockCohorts}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        mode="edit"
      />
    </div>
  );
}
