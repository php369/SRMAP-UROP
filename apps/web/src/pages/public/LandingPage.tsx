import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, Shield, Monitor, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-amber-100 dark:bg-slate-950 dark:text-slate-100">
      {/* Minimal Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'py-3 bg-white/80 backdrop-blur-md border-b border-slate-200/50 dark:bg-slate-950/80 dark:border-slate-800/50 shadow-sm'
          : 'py-5 bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/branding/srm-icon.svg"
                alt="SRM University-AP"
                className="h-8 w-8"
              />
              <span className="font-semibold text-lg tracking-tight">
                Project Portal
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 sm:gap-6">
              {!isAuthenticated && (
                <Link
                  to={ROUTES.LOGIN}
                  className="text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors dark:text-slate-400 dark:hover:text-amber-400"
                >
                  Log in
                </Link>
              )}

              <Link
                to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}
                className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium transition-all duration-200 rounded-full bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 dark:bg-amber-500 dark:text-slate-900 dark:hover:bg-amber-400"
              >
                {isLoading ? 'Loading...' : isAuthenticated ? 'Dashboard' : 'Get Started'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-20 overflow-hidden">
        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium mb-8 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Academic Year 2025-26
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 max-w-4xl mx-auto leading-[1.1] dark:text-white">
            Transforming Academic
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 pb-2">
              Project Management
            </span>
          </h1>

          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed dark:text-slate-400">
            A centralized platform for SRM University-AP students and faculty to manage IDP, UROP, and Capstone projects efficiently.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <Link
              to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}
              className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-amber-500 text-white font-medium transition-all hover:bg-amber-600 hover:shadow-xl hover:shadow-amber-500/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:text-slate-900"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Start Your Project'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-slate-100 text-slate-900 font-medium transition-all hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Hero Image Layer */}
        <div className="relative max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10 dark:ring-slate-100/10 bg-slate-50 dark:bg-slate-900">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 h-1/2 bottom-0 dark:from-slate-950"></div>

            <img
              src="/background.webp"
              alt="Dashboard Preview"
              className="w-full h-auto object-cover object-bottom"
              style={{ maxHeight: '800px', minHeight: '400px' }}
            />

            {/* Overlay for better text integration if needed, currently clean */}
            <div className="absolute inset-0 bg-slate-900/5 mix-blend-multiply pointer-events-none"></div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4 dark:text-white">
              Everything needed for success
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Streamline every aspect of your academic projects with our comprehensive suite of management tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: BookOpen,
                title: 'Project Tracking',
                desc: 'End-to-end lifecycle management for IDP, UROP, and Capstone projects.'
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                desc: 'Form teams, schedule meetings, and collaborate seamlessly with faculty guides.'
              },
              {
                icon: Award,
                title: 'Smart Assessment',
                desc: 'Automated grading workflows with transparent evaluation criteria and feedback.'
              },
              {
                icon: Shield,
                title: 'Secure Access',
                desc: 'Role-based access control ensures data privacy and secure project submissions.'
              },
              {
                icon: Monitor,
                title: 'Real-time Dashboard',
                desc: 'Track progress, deadlines, and notifications in one centralized hub.'
              },
              {
                icon: Globe,
                title: 'Digital Repository',
                desc: 'Centralized archive of project reports, presentations, and resources.'
              }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-100 transition-all dark:bg-slate-800 dark:border-slate-700 dark:hover:border-amber-500/30">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:bg-amber-500 group-hover:text-white transition-colors dark:bg-slate-700 dark:text-amber-400">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed dark:text-slate-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/branding/srm-icon.svg" alt="Logo" className="h-6 w-6 opacity-80" />
            <p className="text-sm text-slate-500">© 2025 SRM University-AP. All rights reserved.</p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-sm text-slate-500 hover:text-amber-600 transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-slate-500 hover:text-amber-600 transition-colors">Terms of Service</a>
            <Link to={ROUTES.HELP} className="text-sm text-slate-500 hover:text-amber-600 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}