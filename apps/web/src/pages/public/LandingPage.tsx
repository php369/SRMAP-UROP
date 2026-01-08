import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';

export function LandingPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header
        className="border-b border-border backdrop-blur-sm sticky top-0 z-50 bg-bg/90"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img
                src="/branding/srm-icon.svg"
                alt="SRM University-AP"
                className="h-8 w-8"
              />
              <div>
                <h1
                  className="text-lg font-semibold text-textPrimary"
                >
                  SRM University-AP
                </h1>
                <p className="text-xs text-textSecondary">
                  Project Management Portal
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              {isLoading ? (
                <div className="w-20 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              ) : isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                      <span className="text-primary text-xs font-bold">
                        {user?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <span className="text-textPrimary font-medium">{user?.name || 'User'}</span>
                  </div>
                  <Link
                    to={ROUTES.DASHBOARD}
                    className="px-4 py-2 rounded-lg transition-colors text-white hover:opacity-90 bg-accent"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              ) : (
                <Link
                  to={ROUTES.LOGIN}
                  className="px-4 py-2 rounded-lg transition-colors text-white hover:opacity-90 bg-accent"
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div>
              <img
                src="/branding/srm-logo.svg"
                alt="SRM University-AP"
                className="h-16 mx-auto mb-8"
              />

              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-textPrimary"
              >
                Project Management
                <span className="block text-accent">
                  Made Simple
                </span>
              </h1>

              <p
                className="text-xl mb-12 max-w-2xl mx-auto text-textSecondary"
              >
                Streamline your academic projects with our comprehensive portal
                for IDP, UROP, and CAPSTONE projects at SRM University-AP.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isLoading ? (
                  <div className="w-40 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                ) : isAuthenticated ? (
                  <Link
                    to={ROUTES.DASHBOARD}
                    className="inline-flex items-center justify-center px-8 py-3 text-white rounded-lg hover:opacity-90 transition-opacity text-lg font-medium bg-accent"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                ) : (
                  <Link
                    to={ROUTES.LOGIN}
                    className="inline-flex items-center justify-center px-8 py-3 text-white rounded-lg hover:opacity-90 transition-opacity text-lg font-medium bg-accent"
                  >
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          className="py-16 px-4 sm:px-6 lg:px-8 bg-surface"
        >
          <div className="max-w-6xl mx-auto">
            <div
              className="text-center mb-16"
            >
              <h2
                className="text-3xl font-bold mb-4 text-textPrimary"
              >
                Everything You Need
              </h2>
              <p className="text-lg text-textSecondary">
                Comprehensive project management for students and faculty
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div
                className="text-center p-6"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-border"
                >
                  <BookOpen className="h-8 w-8 text-textPrimary" />
                </div>
                <h3
                  className="text-xl font-semibold mb-2 text-textPrimary"
                >
                  Project Management
                </h3>
                <p className="text-textSecondary">
                  Streamlined workflow for IDP, UROP, and Capstone projects with faculty proposals and student applications.
                </p>
              </div>

              <div
                className="text-center p-6"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-border"
                >
                  <Users className="h-8 w-8 text-textPrimary" />
                </div>
                <h3
                  className="text-xl font-semibold mb-2 text-textPrimary"
                >
                  Team Collaboration
                </h3>
                <p className="text-textSecondary">
                  Form groups, apply for projects, and collaborate with
                  integrated Google Meet links and meeting logs.
                </p>
              </div>

              <div
                className="text-center p-6"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-border"
                >
                  <Award className="h-8 w-8 text-textPrimary" />
                </div>
                <h3
                  className="text-xl font-semibold mb-2 text-textPrimary"
                >
                  Assessment & Grading
                </h3>
                <p className="text-textSecondary">
                  Comprehensive evaluation system with internal and external
                  assessments, grade tracking, and release management.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="border-t border-border py-8 px-4 sm:px-6 lg:px-8 bg-bg"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img
                src="/branding/srm-icon.svg"
                alt="SRM University-AP"
                className="h-6 w-6"
              />
              <span className="text-textSecondary">
                © 2025 SRM University-AP. All rights reserved.
              </span>
            </div>

            <div className="flex items-center space-x-6">
              {isLoading ? (
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              ) : isAuthenticated ? (
                <Link
                  to={ROUTES.DASHBOARD}
                  className="transition-colors hover:opacity-80 text-textSecondary"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to={ROUTES.LOGIN}
                  className="transition-colors hover:opacity-80 text-textSecondary"
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