import { ReactNode } from 'react';
import { Badge } from '../components/ui/Badge';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  User, 
  Users, 
  Crown, 
  BookOpen, 
  Microscope, 
  GraduationCap,
  Eye,
  FileText,
  Snowflake,
  Target,
  AlertCircle
} from 'lucide-react';

// Application Status Badges
export const ApplicationStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    approved: {
      variant: 'approved' as const,
      icon: <CheckCircle className="w-3 h-3" />,
      text: 'Approved'
    },
    pending: {
      variant: 'pending' as const,
      icon: <Clock className="w-3 h-3" />,
      text: 'Pending'
    },
    rejected: {
      variant: 'rejected' as const,
      icon: <XCircle className="w-3 h-3" />,
      text: 'Rejected'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  return (
    <Badge variant={config.variant} size="sm">
      {config.icon}
      {config.text}
    </Badge>
  );
};

// Group Status Badges
export const GroupStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    approved: {
      variant: 'approved' as const,
      icon: <CheckCircle className="w-3 h-3" />,
      text: 'Approved'
    },
    applied: {
      variant: 'info' as const,
      icon: <FileText className="w-3 h-3" />,
      text: 'Applied'
    },
    complete: {
      variant: 'success' as const,
      icon: <Target className="w-3 h-3" />,
      text: 'Complete'
    },
    forming: {
      variant: 'warning' as const,
      icon: <Users className="w-3 h-3" />,
      text: 'Forming'
    },
    frozen: {
      variant: 'frozen' as const,
      icon: <Snowflake className="w-3 h-3" />,
      text: 'Frozen'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  return (
    <Badge variant={config.variant} size="sm">
      {config.icon}
      {config.text}
    </Badge>
  );
};

// Project Status Badges
export const ProjectStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    published: {
      variant: 'published' as const,
      icon: <Eye className="w-3 h-3" />,
      text: 'Published'
    },
    assigned: {
      variant: 'assigned' as const,
      icon: <CheckCircle className="w-3 h-3" />,
      text: 'Assigned'
    },
    draft: {
      variant: 'draft' as const,
      icon: <FileText className="w-3 h-3" />,
      text: 'Draft'
    },
    frozen: {
      variant: 'frozen' as const,
      icon: <Snowflake className="w-3 h-3" />,
      text: 'Frozen'
    },
    ended: {
      variant: 'ended' as const,
      icon: <AlertCircle className="w-3 h-3" />,
      text: 'Ended'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  return (
    <Badge variant={config.variant} size="sm">
      {config.icon}
      {config.text}
    </Badge>
  );
};

// Project Type Badges
export const ProjectTypeBadge = ({ type }: { type: string }) => {
  const typeConfig = {
    IDP: {
      variant: 'idp' as const,
      icon: <BookOpen className="w-3 h-3" />,
      text: 'IDP'
    },
    UROP: {
      variant: 'urop' as const,
      icon: <Microscope className="w-3 h-3" />,
      text: 'UROP'
    },
    CAPSTONE: {
      variant: 'capstone' as const,
      icon: <GraduationCap className="w-3 h-3" />,
      text: 'CAPSTONE'
    }
  };

  const config = typeConfig[type as keyof typeof typeConfig];
  if (!config) return null;

  return (
    <Badge variant={config.variant} size="sm">
      {config.icon}
      {config.text}
    </Badge>
  );
};

// User Role Badges
export const UserRoleBadge = ({ role, isCurrentUser = false }: { role: string; isCurrentUser?: boolean }) => {
  const roleConfig = {
    solo: {
      variant: 'solo' as const,
      icon: <User className="w-3 h-3" />,
      text: 'Solo Student'
    },
    leader: {
      variant: 'leader' as const,
      icon: <Crown className="w-3 h-3" />,
      text: 'Leader'
    },
    member: {
      variant: 'info' as const,
      icon: <Users className="w-3 h-3" />,
      text: 'Member'
    },
    you: {
      variant: 'success' as const,
      icon: <User className="w-3 h-3" />,
      text: 'You'
    }
  };

  if (isCurrentUser) {
    const config = roleConfig.you;
    return (
      <Badge variant={config.variant} size="sm">
        {config.icon}
        {config.text}
      </Badge>
    );
  }

  const config = roleConfig[role as keyof typeof roleConfig];
  if (!config) return null;

  return (
    <Badge variant={config.variant} size="sm">
      {config.icon}
      {config.text}
    </Badge>
  );
};

// Meeting Status Badge
export const MeetingStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    completed: {
      variant: 'pending' as const,
      icon: <Clock className="w-3 h-3" />,
      text: 'Pending'
    },
    submitted: {
      variant: 'pending' as const,
      icon: <Clock className="w-3 h-3" />,
      text: 'Pending'
    },
    approved: {
      variant: 'approved' as const,
      icon: <CheckCircle className="w-3 h-3" />,
      text: 'Approved'
    },
    rejected: {
      variant: 'rejected' as const,
      icon: <XCircle className="w-3 h-3" />,
      text: 'Rejected'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  return (
    <Badge variant={config.variant} size="sm">
      {config.icon}
      {config.text}
    </Badge>
  );
};

// Generic Status Badge with custom styling
export const StatusBadge = ({ 
  status, 
  variant, 
  icon, 
  children 
}: { 
  status?: string; 
  variant?: string; 
  icon?: ReactNode; 
  children?: ReactNode; 
}) => {
  return (
    <Badge variant={variant as any} size="sm">
      {icon}
      {children || status}
    </Badge>
  );
};