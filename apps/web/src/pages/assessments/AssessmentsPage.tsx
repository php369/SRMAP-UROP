import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AssessmentsList, Assessment } from '../../components/assessments';

// Mock data - in real app this would come from API
const mockAssessments: Assessment[] = [
  {
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
  },
  {
    id: '2',
    title: 'Data Structures Project',
    description: 'Implement a balanced binary search tree with insertion, deletion, and search operations. Include comprehensive test cases.',
    dueDate: '2024-01-20T23:59:00Z',
    status: 'published',
    course: 'CS 1332 - Data Structures',
    cohort: 'Fall 2024',
    submissionCount: 8,
    totalStudents: 30,
    maxScore: 150,
    createdBy: 'Dr. Johnson',
    createdAt: '2024-01-05T14:30:00Z',
  },
  {
    id: '3',
    title: 'Database Design Assignment',
    description: 'Design a normalized database schema for an e-commerce platform. Include ER diagrams and SQL DDL statements.',
    dueDate: '2024-01-25T23:59:00Z',
    status: 'draft',
    course: 'CS 4400 - Database Systems',
    cohort: 'Fall 2024',
    submissionCount: 0,
    totalStudents: 28,
    maxScore: 120,
    createdBy: 'Dr. Wilson',
    createdAt: '2024-01-10T09:15:00Z',
  },
  {
    id: '4',
    title: 'Algorithm Analysis Exam',
    description: 'Comprehensive exam covering time complexity, space complexity, and algorithm design techniques.',
    dueDate: '2024-01-12T10:00:00Z',
    status: 'closed',
    course: 'CS 3510 - Algorithms',
    cohort: 'Fall 2024',
    meetUrl: 'https://meet.google.com/xyz-uvwx-rst',
    submissionCount: 22,
    totalStudents: 22,
    maxScore: 200,
    createdBy: 'Dr. Brown',
    createdAt: '2023-12-20T16:45:00Z',
  },
  {
    id: '5',
    title: 'Software Engineering Project',
    description: 'Develop a full-stack web application using modern frameworks. Include documentation and deployment.',
    dueDate: '2024-01-08T23:59:00Z',
    status: 'graded',
    course: 'CS 3300 - Software Engineering',
    cohort: 'Fall 2024',
    submissionCount: 18,
    totalStudents: 18,
    maxScore: 300,
    createdBy: 'Dr. Davis',
    createdAt: '2023-12-01T11:20:00Z',
  },
];

export function AssessmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading] = useState(false);

  const handleAssessmentClick = (assessment: Assessment) => {
    navigate(`/assessments/${assessment.id}`);
  };

  const handleJoinMeeting = (assessment: Assessment) => {
    if (assessment.meetUrl) {
      window.open(assessment.meetUrl, '_blank');
    }
  };

  const handleEditAssessment = (assessment: Assessment) => {
    navigate(`/assessments/${assessment.id}/edit`);
  };

  const handleDeleteAssessment = (assessment: Assessment) => {
    // In real app, this would show a confirmation dialog and call API
    console.log('Delete assessment:', assessment.id);
  };

  const handleCreateNew = () => {
    navigate('/assessments/new');
  };

  return (
    <AssessmentsList
      assessments={mockAssessments}
      userRole={user?.role || 'student'}
      loading={loading}
      onAssessmentClick={handleAssessmentClick}
      onJoinMeeting={handleJoinMeeting}
      onEditAssessment={handleEditAssessment}
      onDeleteAssessment={handleDeleteAssessment}
      onCreateNew={handleCreateNew}
    />
  );
}