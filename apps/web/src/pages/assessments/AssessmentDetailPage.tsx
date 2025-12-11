import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AssessmentDetail, Submission } from '../../components/assessments/AssessmentDetail';
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

  meetUrl: 'https://meet.google.com/abc-defg-hij',
  submissionCount: 15,
  totalStudents: 25,
  maxScore: 100,
  createdBy: 'Dr. Smith',
  createdAt: '2024-01-01T10:00:00Z',
};

const mockSubmissions: Submission[] = [
  {
    id: '1',
    studentId: 'student1',
    studentName: 'John Doe',
    studentEmail: 'john.doe@student.edu',
    submittedAt: '2024-01-14T15:30:00Z',
    status: 'graded',
    score: 85,
    feedback: 'Good understanding of concepts. Minor errors in implementation.',
    files: [
      { name: 'assignment.pdf', url: '/files/assignment1.pdf', size: 1024000 },
    ],
    attempts: 1,
  },
  {
    id: '2',
    studentId: 'student2',
    studentName: 'Jane Smith',
    studentEmail: 'jane.smith@student.edu',
    submittedAt: '2024-01-15T22:45:00Z',
    status: 'submitted',
    files: [
      { name: 'ml_quiz.pdf', url: '/files/ml_quiz2.pdf', size: 856000 },
      { name: 'code.py', url: '/files/code2.py', size: 15000 },
    ],
    attempts: 2,
  },
  {
    id: '3',
    studentId: 'student3',
    studentName: 'Mike Johnson',
    studentEmail: 'mike.johnson@student.edu',
    submittedAt: '2024-01-16T08:15:00Z',
    status: 'late',
    score: 78,
    feedback: 'Late submission. Good work overall but some concepts need clarification.',
    files: [
      { name: 'final_submission.pdf', url: '/files/final3.pdf', size: 1200000 },
    ],
    attempts: 1,
  },
];

export function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    // In real app, this would fetch assessment and submissions from API
    const fetchData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAssessment(mockAssessment);
        setSubmissions(mockSubmissions);
      } catch (error) {
        console.error('Error fetching assessment:', error);
        navigate('/dashboard/assessments');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    } else {
      navigate('/dashboard/assessments');
    }
  }, [id, navigate]);

  const handleJoinMeeting = () => {
    if (assessment?.meetUrl) {
      window.open(assessment.meetUrl, '_blank');
    }
  };

  const handleEdit = () => {
    navigate(`/assessments/${id}/edit`);
  };

  const handleDelete = () => {
    // In real app, this would show confirmation dialog and call API
    console.log('Delete assessment:', id);
  };

  const handleGradeSubmission = (submission: Submission) => {
    // In real app, this would open grading interface
    console.log('Grade submission:', submission.id);
  };

  const handleDownloadSubmissions = () => {
    // In real app, this would download all submissions as ZIP
    console.log('Download all submissions');
  };

  const handlePublishGrades = () => {
    // In real app, this would publish grades to students
    console.log('Publish grades');
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
      <AssessmentDetail
        assessment={assessment}
        submissions={submissions}
        userRole={user?.role || 'student'}
        onJoinMeeting={handleJoinMeeting}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onGradeSubmission={handleGradeSubmission}
        onDownloadSubmissions={handleDownloadSubmissions}
        onPublishGrades={handlePublishGrades}
      />
    </div>
  );
}
