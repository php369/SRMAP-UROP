import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-srm-100 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* 1. Page-Bound Navigation (No Sticky, No Fixed) */}
      <nav className="w-full px-6 py-8 lg:px-12 flex items-center justify-between bg-transparent z-10">
        <div className="flex items-center gap-3">
          <img
            src="/branding/srm-icon.svg"
            alt="SRM University-AP"
            className="h-10 w-10"
          />
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white leading-none">
              SRM University AP
            </span>
            <span className="text-sm text-slate-500 font-medium tracking-wide uppercase mt-1">
              Andhra Pradesh
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {!isAuthenticated && (
            <Link
              to={ROUTES.LOGIN}
              className="text-sm font-semibold text-slate-600 hover:text-srm-600 transition-colors dark:text-slate-400 dark:hover:text-srm-400"
            >
              Sign In
            </Link>
          )}
          <Link
            to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}
            className="hidden sm:inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold transition-all duration-200 rounded-lg bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg dark:bg-srm-400 dark:text-slate-900 dark:hover:bg-srm-500"
          >
            {isLoading ? '...' : isAuthenticated ? 'Dashboard' : 'Portal Access'}
          </Link>
        </div>
      </nav>

      {/* 2. Hero Content (Text Layer) */}
      <main className="flex-grow flex flex-col relative w-full pt-12 md:pt-20">
        <div className="relative z-20 w-full max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-slate-200 text-slate-600 text-xs font-semibold mb-8 animate-fade-in-up dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-srm-500 animate-pulse"></span>
            Academic Year 2025-26
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1] dark:text-white">
            Excellence in
            <span className="block text-transparent bg-clip-text bg-gradient-to-br from-srm-500 to-amber-700 pb-4">
              Academic Research
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light dark:text-slate-400">
            A unified platform for IDP, UROP, and Capstone projects, fostering innovation and collaboration across SRM University-AP.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-16 relative z-30">
            <Link
              to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}
              className="inline-flex items-center justify-center h-14 px-10 rounded-xl bg-srm-500 text-white font-bold tracking-wide transition-all hover:bg-srm-600 hover:shadow-xl hover:shadow-srm-500/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-srm-500 focus:ring-offset-2 dark:text-slate-900 transform active:scale-95"
            >
              {isAuthenticated ? 'Enter Dashboard' : 'Start Your Application'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center h-14 px-10 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold transition-all hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              View Guidelines
            </a>
          </div>
        </div>

        {/* 3. Soft Illustration (Gap Filler & Transition) */}
        <div className="w-full relative h-[400px] -mt-20 overflow-hidden pointer-events-none">
          {/* Abstract Gradients/Mesh */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full opacity-40 blur-3xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-srm-100 via-slate-100 to-transparent dark:from-srm-900/20 dark:via-slate-900/40"></div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-b from-transparent to-slate-50/80 dark:to-slate-950/80"></div>
        </div>

        {/* 4. Full Width Hero Image (Visual Anchor) */}
        <div className="w-full relative mt-auto">
          {/* Gradient Mask for top-to-bottom fade */}
          <div className="relative w-full overflow-hidden">
            <div
              className="w-full h-[60vh] min-h-[500px] bg-cover bg-bottom bg-no-repeat relative"
              style={{
                backgroundImage: 'url(/background.webp)',
                maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 10%, black 50%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 10%, black 50%, black 100%)'
              }}
            >
              {/* Optional overlay for tinting if raw image is too bright */}
              <div className="absolute inset-0 bg-slate-900/10 mix-blend-overlay"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section - Below the Fold */}
      <section id="features" className="py-24 bg-white relative z-10 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              {
                icon: BookOpen,
                title: 'Academic Projects',
                desc: 'Streamlined submission and approval workflow for IDP and Capstone projects.'
              },
              {
                icon: Users,
                title: 'Team Formation',
                desc: 'Find teammates and faculty guides with our integrated collaboration tools.'
              },
              {
                icon: Globe,
                title: 'Research Repository',
                desc: 'Access a centralized archive of past research papers and project reports.'
              }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-start p-6 rounded-2xl hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/50">
                <div className="w-14 h-14 rounded-full bg-srm-50 text-srm-600 flex items-center justify-center mb-6 dark:bg-slate-800 dark:text-srm-400">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 dark:text-white">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed dark:text-slate-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white dark:bg-slate-950 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center">
          <p className="text-slate-400 text-sm">© 2025 SRM University-AP</p>
          <div className="flex gap-6">
            <Link to={ROUTES.HELP} className="text-slate-400 hover:text-slate-600 text-sm">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}