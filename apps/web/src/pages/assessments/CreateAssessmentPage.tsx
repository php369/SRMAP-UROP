import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssessmentForm, AssessmentFormData } from '../../components/assessments/AssessmentForm';

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

export function CreateAssessmentPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: AssessmentFormData) => {
    setLoading(true);
    
    try {
      // In real app, this would call the API to create the assessment
      console.log('Creating assessment:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate back to assessments list
      navigate('/assessments');
    } catch (error) {
      console.error('Error creating assessment:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/assessments');
  };

  return (
    <div className="min-h-screen py-8">
      <AssessmentForm
        availableCourses={mockCourses}
        availableCohorts={mockCohorts}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        mode="create"
      />
    </div>
  );
}
