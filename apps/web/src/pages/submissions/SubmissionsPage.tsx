import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubmissionsList } from '../../components/submissions/SubmissionsList';
import { Submission, SubmissionFile } from '../../components/submissions/SubmissionCard';

// Mock data - in real app this would come from API
const mockSubmissions: Submission[] = [
  {
    id: '1',
    assessmentId: 'assessment1',
    assessmentTitle: 'Machine Learning Fundamentals Quiz',
    course: 'CS 4641 - Machine Learning',
    submittedAt: '2024-01-14T15:30:00Z',
    status: 'graded',
    score: 85,
    maxScore: 100,
    feedback: 'Good understanding of concepts. Minor errors in implementation. Consider reviewing the gradient descent algorithm.',
    files: [
      {
        id: 'file1',
        name: 'ml_quiz_answers.pdf',
        size: 1024000,
        type: 'application/pdf',
        url: '/files/ml_quiz_answers.pdf',
      },
    ],
    notes: 'I spent extra time on the neural networks section as it was challenging.',
    attempt: 1,
    maxAttempts: 2,
    dueDate: '2024-01-15T23:59:00Z',
  },
  {
    id: '2',
    assessmentId: 'assessment2',
    assessmentTitle: 'Data Structures Project',
    course: 'CS 1332 - Data Structures',
    submittedAt: '2024-01-20T22:45:00Z',
    status: 'submitted',
    files: [
      {
        id: 'file2',
        name: 'binary_tree.py',
        size: 15000,
        type: 'text/x-python-script',
        url: '/files/binary_tree.py',
      },
      {
        id: 'file3',
        name: 'test_cases.py',
        size: 8000,
        type: 'text/x-python-script',
        url: '/files/test_cases.py',
      },
      {
        id: 'file4',
        name: 'documentation.pdf',
        size: 856000,
        type: 'application/pdf',
        url: '/files/documentation.pdf',
      },
    ],
    notes: 'Implemented all required methods with comprehensive test cases. The tree balancing algorithm was particularly interesting to implement.',
    attempt: 1,
    maxAttempts: 3,
    dueDate: '2024-01-21T23:59:00Z',
  },
  {
    id: '3',
    assessmentId: 'assessment3',
    assessmentTitle: 'Database Design Assignment',
    course: 'CS 4400 - Database Systems',
    submittedAt: '2024-01-26T08:15:00Z',
    status: 'late',
    score: 78,
    maxScore: 120,
    feedback: 'Late submission penalty applied. Good ER diagram design but normalization could be improved.',
    files: [
      {
        id: 'file5',
        name: 'er_diagram.png',
        size: 245000,
        type: 'image/png',
        url: '/files/er_diagram.png',
      },
      {
        id: 'file6',
        name: 'schema.sql',
        size: 12000,
        type: 'text/plain',
        url: '/files/schema.sql',
      },
    ],
    attempt: 1,
    maxAttempts: 1,
    dueDate: '2024-01-25T23:59:00Z',
  },
  {
    id: '4',
    assessmentId: 'assessment4',
    assessmentTitle: 'Software Engineering Project Draft',
    course: 'CS 3300 - Software Engineering',
    submittedAt: '2024-01-10T16:20:00Z',
    status: 'draft',
    files: [
      {
        id: 'file7',
        name: 'project_proposal.docx',
        size: 45000,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        url: '/files/project_proposal.docx',
      },
    ],
    notes: 'Still working on the technical requirements section. Will submit final version soon.',
    attempt: 1,
    maxAttempts: 1,
    dueDate: '2024-01-30T23:59:00Z',
  },
];

export function SubmissionsPage() {
  const navigate = useNavigate();
  const [loading] = useState(false);

  const handleSubmissionClick = (submission: Submission) => {
    navigate(`/submissions/${submission.id}`);
  };

  const handleDownloadFile = (file: SubmissionFile) => {
    // In real app, this would download the file
    console.log('Downloading file:', file.name);
    // Simulate download
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  const handleResubmit = (submission: Submission) => {
    navigate(`/assessments/${submission.assessmentId}/submit`);
  };

  return (
    <SubmissionsList
      submissions={mockSubmissions}
      loading={loading}
      onSubmissionClick={handleSubmissionClick}
      onDownloadFile={handleDownloadFile}
      onResubmit={handleResubmit}
    />
  );
}