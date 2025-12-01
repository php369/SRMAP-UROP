import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const location = useLocation();

  // Auto-generate breadcrumbs from current path if items not provided
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname);

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)}>
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && (
            <svg className="w-4 h-4 text-textSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          
          {item.path && index < breadcrumbItems.length - 1 ? (
            <Link
              to={item.path}
              className="text-textSecondary hover:text-text transition-colors duration-200"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-text font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  
  // Start with Dashboard for authenticated routes
  const breadcrumbs: BreadcrumbItem[] = pathname.startsWith('/dashboard') 
    ? [{ label: 'Dashboard', path: '/dashboard' }]
    : [{ label: 'Home', path: '/' }];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Skip the dashboard segment since it's already added as root
    if (segment === 'dashboard') {
      return;
    }
    
    // Convert segment to readable label
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbs.push({
      label,
      path: index === segments.length - 1 ? undefined : currentPath,
    });
  });

  return breadcrumbs;
}
