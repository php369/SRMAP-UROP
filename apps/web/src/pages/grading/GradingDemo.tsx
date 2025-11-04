import { useState } from 'react';
import { GradingInterface } from '../../components/grading/GradingInterface';
import { 
  Submission, 
  RubricCriterion, 
  GradeHistory, 
  GradingData,
  SubmissionFile 
} from '../../types';

// Mock data for demonstration
const mockSubmissionFiles: SubmissionFile[] = [
  {
    id: '1',
    name: 'machine_learning_assignment.pdf',
    url: '/files/ml_assignment.pdf',
    size: 2048000,
    type: 'application/pdf',
    uploadedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'neural_network_implementation.py',
    url: '/files/nn_implementation.py',
    size: 15000,
    type: 'text/x-python-script',
    uploadedAt: '2024-01-15T10:32:00Z',
  },
  {
    id: '3',
    name: 'data_analysis_results.csv',
    url: '/files/analysis_results.csv',
    size: 50000,
    type: 'text/csv',
    uploadedAt: '2024-01-15T10:35:00Z',
  },
];

const mockSubmission: Submission = {
  id: 'sub_123',
  assessmentId: 'assess_456',
  assessmentTitle: 'Machine Learning Fundamentals - Final Project',
  studentId: 'student_789',
  studentName: 'Alex Johnson',
  studentEmail: 'alex.johnson@srmap.edu.in',
  submittedAt: '2024-01-15T10:35:00Z',
  status: 'submitted',
  files: mockSubmissionFiles,
  notes: 'I implemented a neural network from scratch using NumPy and tested it on the MNIST dataset. The model achieved 94% accuracy after 50 epochs. I also included a detailed analysis of the hyperparameter tuning process.',
  attempt: 1,
  maxAttempts: 2,
  dueDate: '2024-01-15T23:59:00Z',
  course: 'CS 4641 - Machine Learning',
  maxScore: 100,
};

const mockRubric: RubricCriterion[] = [
  {
    id: 'implementation',
    name: 'Implementation Quality',
    description: 'Code structure, efficiency, and correctness',
    maxPoints: 30,
    levels: [
      {
        id: 'excellent',
        name: 'Excellent',
        description: 'Clean, efficient, well-documented code with proper error handling',
        points: 30,
      },
      {
        id: 'good',
        name: 'Good',
        description: 'Well-structured code with minor issues',
        points: 24,
      },
      {
        id: 'satisfactory',
        name: 'Satisfactory',
        description: 'Functional code with some structural issues',
        points: 18,
      },
      {
        id: 'needs_improvement',
        name: 'Needs Improvement',
        description: 'Code works but has significant issues',
        points: 12,
      },
    ],
  },
  {
    id: 'algorithm_understanding',
    name: 'Algorithm Understanding',
    description: 'Demonstration of understanding of machine learning concepts',
    maxPoints: 25,
    levels: [
      {
        id: 'excellent',
        name: 'Excellent',
        description: 'Deep understanding with clear explanations and insights',
        points: 25,
      },
      {
        id: 'good',
        name: 'Good',
        description: 'Good understanding with mostly correct explanations',
        points: 20,
      },
      {
        id: 'satisfactory',
        name: 'Satisfactory',
        description: 'Basic understanding with some correct explanations',
        points: 15,
      },
      {
        id: 'needs_improvement',
        name: 'Needs Improvement',
        description: 'Limited understanding with unclear explanations',
        points: 10,
      },
    ],
  },
  {
    id: 'results_analysis',
    name: 'Results Analysis',
    description: 'Quality of experimental results and analysis',
    maxPoints: 25,
    levels: [
      {
        id: 'excellent',
        name: 'Excellent',
        description: 'Comprehensive analysis with meaningful insights',
        points: 25,
      },
      {
        id: 'good',
        name: 'Good',
        description: 'Good analysis with some insights',
        points: 20,
      },
      {
        id: 'satisfactory',
        name: 'Satisfactory',
        description: 'Basic analysis with limited insights',
        points: 15,
      },
      {
        id: 'needs_improvement',
        name: 'Needs Improvement',
        description: 'Minimal analysis with little to no insights',
        points: 10,
      },
    ],
  },
  {
    id: 'documentation',
    name: 'Documentation & Presentation',
    description: 'Quality of documentation, comments, and presentation',
    maxPoints: 20,
    levels: [
      {
        id: 'excellent',
        name: 'Excellent',
        description: 'Clear, comprehensive documentation with excellent presentation',
        points: 20,
      },
      {
        id: 'good',
        name: 'Good',
        description: 'Good documentation with clear presentation',
        points: 16,
      },
      {
        id: 'satisfactory',
        name: 'Satisfactory',
        description: 'Adequate documentation with acceptable presentation',
        points: 12,
      },
      {
        id: 'needs_improvement',
        name: 'Needs Improvement',
        description: 'Poor documentation with unclear presentation',
        points: 8,
      },
    ],
  },
];

const mockGradeHistory: GradeHistory[] = [
  {
    id: 'grade_v2',
    gradedAt: '2024-01-16T14:30:00Z',
    gradedBy: 'faculty_123',
    gradedByName: 'Dr. Sarah Chen',
    score: 88,
    maxScore: 100,
    feedback: '<p>Excellent work on the neural network implementation! Your code is well-structured and demonstrates a solid understanding of the underlying concepts.</p><p><strong>Strengths:</strong></p><ul><li>Clean, readable code with good documentation</li><li>Proper implementation of backpropagation</li><li>Thorough testing and validation</li></ul><p><strong>Areas for improvement:</strong></p><ul><li>Consider adding more sophisticated regularization techniques</li><li>The hyperparameter tuning could be more systematic</li></ul>',
    rubricScores: [
      { criterionId: 'implementation', levelId: 'excellent', points: 30 },
      { criterionId: 'algorithm_understanding', levelId: 'good', points: 20 },
      { criterionId: 'results_analysis', levelId: 'good', points: 20 },
      { criterionId: 'documentation', levelId: 'good', points: 16, customPoints: 18 },
    ],
    privateNotes: 'Student showed great improvement from previous assignments. Consider for advanced ML course.',
    version: 2,
    action: 'updated',
    changes: [
      {
        field: 'score',
        oldValue: 85,
        newValue: 88,
      },
      {
        field: 'documentation_points',
        oldValue: 16,
        newValue: 18,
      },
    ],
  },
  {
    id: 'grade_v1',
    gradedAt: '2024-01-16T10:15:00Z',
    gradedBy: 'faculty_123',
    gradedByName: 'Dr. Sarah Chen',
    score: 85,
    maxScore: 100,
    feedback: '<p>Good work on the neural network implementation. Your understanding of the concepts is evident.</p><p>The code is functional and produces correct results. Consider improving documentation and adding more analysis of the results.</p>',
    rubricScores: [
      { criterionId: 'implementation', levelId: 'excellent', points: 30 },
      { criterionId: 'algorithm_understanding', levelId: 'good', points: 20 },
      { criterionId: 'results_analysis', levelId: 'good', points: 20 },
      { criterionId: 'documentation', levelId: 'satisfactory', points: 16 },
    ],
    privateNotes: 'Initial grading. May need to adjust documentation score.',
    version: 1,
    action: 'created',
  },
];

export function GradingDemo() {
  const [loading, setLoading] = useState(false);

  const handleSubmitGrade = async (gradingData: GradingData) => {
    setLoading(true);
    console.log('Submitting grade:', gradingData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(false);
    alert('Grade submitted successfully!');
  };

  const handleSaveDraft = async (gradingData: GradingData) => {
    console.log('Saving draft:', gradingData);
    alert('Draft saved!');
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      alert('Cancelled');
    }
  };

  const handleRestoreVersion = (version: number) => {
    console.log('Restoring version:', version);
    alert(`Restored to version ${version}`);
  };

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Grading Interface Demo</h1>
          <p className="text-textSecondary">
            This demo showcases the enhanced grading interface with rubric support, 
            rich text editing, and grade history tracking.
          </p>
        </div>

        <GradingInterface
          submission={mockSubmission}
          rubric={mockRubric}
          gradeHistory={mockGradeHistory}
          onSubmitGrade={handleSubmitGrade}
          onSaveDraft={handleSaveDraft}
          onCancel={handleCancel}
          onRestoreVersion={handleRestoreVersion}
          loading={loading}
        />
      </div>
    </div>
  );
}
