import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssessmentForm, AssessmentFormData } from '../../components/assessments/AssessmentForm';

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
      navigate('/dashboard/assessments');
    } catch (error) {
      console.error('Error creating assessment:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/assessments');
  };

  return (
    <div className="min-h-screen py-8">
      <AssessmentForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        mode="create"
      />
    </div>
  );
}
