import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SubmissionDetail } from '../../components/submissions/SubmissionDetail';
import { Submission, SubmissionFile } from '../../components/submissions/SubmissionCard';
import { LoadingSpinner } from '../../components/ui';

// Mock data - in real app this would come from API
const mockSubmission: Submission = {
  id: '1',
  assessmentId: 'assessment1',
  assessmentTitle: 'Machine Learning Fundamentals Quiz',
  course: 'CS 4641 - Machine Learning',
  submittedAt: '2024-01-14T15:30:00Z',
  status: 'graded',
  score: 85,
  maxScore: 100,
  feedback: 'Good understanding of concepts. Minor errors in implementation. Consider reviewing the gradient descent algorithm and regularization techniques. Your explanation of overfitting was particularly well done.',
  files: [
    {
      id: 'file1',
      name: 'ml_quiz_answers.pdf',
      size: 1024000,
      type: 'application/pdf',
      url: '/files/ml_quiz_answers.pdf',
    },
    {
      id: 'file2',
      name: 'code_implementation.py',
      size: 15000,
      type: 'text/x-python-script',
      url: '/files/code_implementation.py',
    },
  ],
  notes: 'I spent extra time on the neural networks section as it was challenging. I also implemented additional test cases to verify my understanding of the algorithms.',
  attempt: 1,
  maxAttempts: 2,
  dueDate: '2024-01-15T23:59:00Z',
};

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    // In real app, this would fetch submission from API
    const fetchSubmission = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSubmission(mockSubmission);
      } catch (error) {
        console.error('Error fetching submission:', error);
        navigate('/submissions');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSubmission();
    } else {
      navigate('/submissions');
    }
  }, [id, navigate]);

  const handleDownloadFile = (file: SubmissionFile) => {
    // In real app, this would download the file
    console.log('Downloading file:', file.name);
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  const handleDownloadAll = () => {
    // In real app, this would download all files as ZIP
    console.log('Downloading all files');
  };

  const handleResubmit = () => {
    if (submission) {
      navigate(`/assessments/${submission.assessmentId}/submit`);
    }
  };

  const handleEdit = () => {
    if (submission) {
      navigate(`/assessments/${submission.assessmentId}/submit?edit=${submission.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text mb-2">Submission Not Found</h2>
          <p className="text-textSecondary mb-4">The submission you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/submissions')}
            className="px-6 py-3 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Submissions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <SubmissionDetail
        submission={submission}
        onDownloadFile={handleDownloadFile}
        onDownloadAll={handleDownloadAll}
        onResubmit={handleResubmit}
        onEdit={handleEdit}
      />
    </div>
  );
}
