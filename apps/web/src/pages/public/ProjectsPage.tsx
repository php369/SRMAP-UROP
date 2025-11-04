import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MapPin,
  Users,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { ProjectService, ProjectFilters } from '../../services/projectService';
import { Project } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';

export function ProjectsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Load projects and departments
  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectsResponse, departmentsResponse] = await Promise.all([
        ProjectService.getPublishedProjects(filters),
        ProjectService.getDepartments(),
      ]);

      if (projectsResponse.success && projectsResponse.data) {
        setProjects(projectsResponse.data);
      } else {
        setError('Failed to load projects');
      }

      if (departmentsResponse.success && departmentsResponse.data) {
        setDepartments(departmentsResponse.data);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilters(prev => ({ ...prev, search: term || undefined }));
  };

  const handleDepartmentFilter = (department: string) => {
    setFilters(prev => ({
      ...prev,
      department: prev.department === department ? undefined : department,
    }));
  };

  const handleTypeFilter = (type: 'IDP' | 'UROP' | 'CAPSTONE') => {
    setFilters(prev => ({
      ...prev,
      type: prev.type === type ? undefined : type,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const projectTypes = ProjectService.getProjectTypes();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e6e5d4' }}>
      {/* Header */}
      <header
        className="border-b backdrop-blur-sm sticky top-0 z-50"
        style={{
          borderColor: '#cbc6a4',
          backgroundColor: 'rgba(230, 229, 212, 0.9)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Back */}
            <div className="flex items-center space-x-4">
              <Link
                to={ROUTES.HOME}
                className="flex items-center transition-colors hover:opacity-80"
                style={{ color: '#787659' }}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>

              <div className="hidden sm:flex items-center space-x-3">
                <img
                  src="/branding/srm-icon.svg"
                  alt="SRM University-AP"
                  className="h-8 w-8"
                />
                <div>
                  <h1
                    className="text-lg font-semibold"
                    style={{ color: '#494623' }}
                  >
                    Browse Projects
                  </h1>
                  <p className="text-xs" style={{ color: '#787659' }}>
                    Discover available opportunities
                  </p>
                </div>
              </div>
            </div>

            {/* Authentication Section */}
            {authLoading ? (
              <div className="w-20 h-10 rounded-lg animate-pulse" style={{ backgroundColor: '#cbc6a4' }}></div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ca9a4a' }}>
                    <span className="text-white text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#494623' }}>{user.name}</span>
                </div>
                <Link
                  to={ROUTES.DASHBOARD}
                  className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#ca9a4a' }}
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#ca9a4a' }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={
                    {
                      borderColor: '#cbc6a4',
                      backgroundColor: '#e6e5d4',
                      color: '#494623',
                      '--tw-ring-color': '#ca9a4a',
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(filters.department || filters.type || filters.search) && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 transition-colors hover:opacity-80"
                style={{ color: '#787659' }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-3">
            {/* Department Filters */}
            <div className="flex flex-wrap gap-2">
              <span
                className="text-sm font-medium"
                style={{ color: '#787659' }}
              >
                Departments:
              </span>
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => handleDepartmentFilter(dept)}
                  className="px-3 py-1 rounded-full text-sm transition-colors hover:opacity-80"
                  style={
                    filters.department === dept
                      ? { backgroundColor: '#ca9a4a', color: 'white' }
                      : {
                          backgroundColor: '#e6e5d4',
                          border: '1px solid #cbc6a4',
                          color: '#494623',
                        }
                  }
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap gap-2">
              <span
                className="text-sm font-medium"
                style={{ color: '#787659' }}
              >
                Types:
              </span>
              {projectTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() =>
                    handleTypeFilter(type.value as 'IDP' | 'UROP' | 'CAPSTONE')
                  }
                  className="px-3 py-1 rounded-full text-sm transition-colors hover:opacity-80"
                  style={
                    filters.type === type.value
                      ? { backgroundColor: '#ca9a4a', color: 'white' }
                      : {
                          backgroundColor: '#e6e5d4',
                          border: '1px solid #cbc6a4',
                          color: '#494623',
                        }
                  }
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: '#ca9a4a' }}
            ></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#ca9a4a' }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p style={{ color: '#787659' }}>
                {projects.length} project{projects.length !== 1 ? 's' : ''}{' '}
                found
              </p>
            </div>

            {/* Projects Grid */}
            {projects.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project, index) => (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
                    style={{
                      backgroundColor: '#cbc6a4',
                      borderColor: '#98957d',
                    }}
                  >
                    {/* Project Type Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.type === 'IDP'
                            ? 'bg-blue-100 text-blue-800'
                            : project.type === 'UROP'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {project.type}
                      </span>
                      {project.capacity && (
                        <div
                          className="flex items-center text-sm"
                          style={{ color: '#787659' }}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          {project.capacity}
                        </div>
                      )}
                    </div>

                    {/* Project Title */}
                    <h3
                      className="text-lg font-semibold mb-2 line-clamp-2"
                      style={{ color: '#494623' }}
                    >
                      {project.title}
                    </h3>

                    {/* Project Brief */}
                    <p
                      className="text-sm mb-4 line-clamp-3"
                      style={{ color: '#787659' }}
                    >
                      {project.brief}
                    </p>

                    {/* Department and Faculty */}
                    <div className="space-y-2">
                      <div
                        className="flex items-center text-sm"
                        style={{ color: '#787659' }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        {project.department}
                      </div>
                      <div
                        className="flex items-center text-sm"
                        style={{ color: '#787659' }}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        {project.facultyName}
                      </div>
                    </div>

                    {/* Prerequisites */}
                    {project.prerequisites && (
                      <div
                        className="mt-4 pt-4 border-t"
                        style={{ borderColor: '#98957d' }}
                      >
                        <p className="text-xs" style={{ color: '#787659' }}>
                          <span className="font-medium">Prerequisites:</span>{' '}
                          {project.prerequisites}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Filter
                  className="h-12 w-12 mx-auto mb-4"
                  style={{ color: '#98957d' }}
                />
                <h3
                  className="text-lg font-medium mb-2"
                  style={{ color: '#494623' }}
                >
                  No projects found
                </h3>
                <p className="mb-4" style={{ color: '#787659' }}>
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#ca9a4a' }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}

        {/* Call to Action */}
        <div
          className="mt-16 text-center border rounded-lg p-8"
          style={{ backgroundColor: '#cbc6a4', borderColor: '#98957d' }}
        >
          {authLoading ? (
            <>
              <div className="w-48 h-8 mx-auto mb-4 rounded animate-pulse" style={{ backgroundColor: '#98957d' }}></div>
              <div className="w-64 h-4 mx-auto mb-6 rounded animate-pulse" style={{ backgroundColor: '#98957d' }}></div>
              <div className="w-32 h-12 mx-auto rounded animate-pulse" style={{ backgroundColor: '#98957d' }}></div>
            </>
          ) : isAuthenticated ? (
            <>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#494623' }}>
                Ready to Apply?
              </h2>
              <p className="mb-6" style={{ color: '#787659' }}>
                Go to your dashboard to apply for projects and manage your applications
              </p>
              <Link
                to={ROUTES.DASHBOARD}
                className="inline-flex items-center px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                style={{ backgroundColor: '#ca9a4a' }}
              >
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#494623' }}>
                Sign In to Apply
              </h2>
              <p className="mb-6" style={{ color: '#787659' }}>
                Sign in with your university credentials to apply for projects
              </p>
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                style={{ backgroundColor: '#ca9a4a' }}
              >
                Sign In Now
              </Link>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-8 px-4 sm:px-6 lg:px-8 mt-16"
        style={{ borderColor: '#cbc6a4', backgroundColor: '#e6e5d4' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img
                src="/branding/srm-icon.svg"
                alt="SRM University-AP"
                className="h-6 w-6"
              />
              <span style={{ color: '#787659' }}>
                © 2025 SRM University-AP. All rights reserved.
              </span>
            </div>

            <div className="flex items-center space-x-6">
              <Link
                to={ROUTES.HOME}
                className="transition-colors hover:opacity-80"
                style={{ color: '#787659' }}
              >
                Home
              </Link>
              {authLoading ? (
                <div className="w-16 h-4 rounded animate-pulse" style={{ backgroundColor: '#98957d' }}></div>
              ) : isAuthenticated ? (
                <Link
                  to={ROUTES.DASHBOARD}
                  className="transition-colors hover:opacity-80"
                  style={{ color: '#787659' }}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to={ROUTES.LOGIN}
                  className="transition-colors hover:opacity-80"
                  style={{ color: '#787659' }}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
