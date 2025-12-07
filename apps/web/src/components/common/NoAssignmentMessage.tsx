import { Users } from 'lucide-react';
import { GlassCard } from '../ui';

interface NoAssignmentMessageProps {
  userType: 'faculty' | 'student';
}

export function NoAssignmentMessage({ userType }: NoAssignmentMessageProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <GlassCard variant="elevated" className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">
          {userType === 'faculty' ? 'No Students Assigned' : 'No Project Assigned'}
        </h2>
        <p className="text-textSecondary mb-4">
          {userType === 'faculty' 
            ? 'You haven\'t been assigned any students or groups yet. Meetings will be available once students are assigned to your projects.'
            : 'You haven\'t been assigned to a project yet. Meetings will be available once you\'re assigned to a faculty mentor.'
          }
        </p>
        <p className="text-sm text-textSecondary">
          {userType === 'faculty'
            ? 'Students will be assigned after the application review process.'
            : 'Check your application status on the dashboard.'
          }
        </p>
      </GlassCard>
    </div>
  );
}
