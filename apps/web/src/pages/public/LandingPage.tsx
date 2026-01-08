import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Globe, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import { Reveal } from '../../components/ui/Reveal';

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-srm-100 dark:bg-slate-950 dark:text-slate-100 flex flex-col overflow-x-hidden">

      {/* 
         --- TOP SECTION (Pattern BG) --- 
         Contains: Navigation, Hero, Features 
      */}
      <div className="relative z-10 w-full bg-slate-50 dark:bg-slate-950">
        {/* Pattern Background Layer (Strictly contained in this div) */}
        <div
          className="absolute inset-0 z-0 pointer-events-none bg-cover bg-top bg-no-repeat opacity-60 dark:opacity-20"
          style={{ backgroundImage: 'url(/7063.webp)' }}
        >
          {/* Gradient Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/60 to-transparent dark:from-slate-950/90 dark:via-slate-950/60"></div>
        </div>

        {/* Content Container (Nav + Hero + Cards) */}
        <div className="relative z-20 pb-20 sm:pb-32"> {/* Padding Bottom for overlap buffer */}

          {/* 1. Navigation */}
          <nav className="w-full px-6 py-8 lg:px-12 flex items-center justify-between bg-transparent">
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
                  Amaravathi
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

          {/* 2. Hero Content */}
          <div className="w-full max-w-5xl mx-auto px-6 lg:px-8 text-center pt-12 md:pt-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-slate-200/50 text-slate-600 text-xs font-semibold mb-8 animate-fade-in-up dark:bg-slate-900/80 dark:border-slate-800/50 dark:text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-srm-500 animate-pulse"></span>
              Academic Year 2025-26
            </div>

            <Reveal duration={1.0} direction="up" fullWidth>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1] dark:text-white">
                Excellence in
                <span className="block text-transparent bg-clip-text bg-gradient-to-br from-srm-500 to-amber-700 pb-4">
                  Academic Research
                </span>
              </h1>
            </Reveal>

            <Reveal duration={1.0} delay={0.2} direction="up" fullWidth>
              <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light dark:text-slate-400">
                A unified platform for IDP, UROP, and Capstone projects, fostering innovation and collaboration across SRM University-AP.
              </p>
            </Reveal>

            <Reveal duration={1.0} delay={0.4} direction="up" fullWidth>
              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-24 relative z-30">
                <Link
                  to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}
                  className="group flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-md border border-slate-200/50 text-slate-900 font-semibold transition-all duration-500 hover:bg-[#f5bb3e] hover:border-[#f5bb3e] hover:text-white hover:shadow-[0_0_20px_rgba(245,187,62,0.3)] dark:border-white/10 dark:text-white dark:hover:bg-[#f5bb3e]"
                >
                  <span>{isAuthenticated ? 'Dashboard' : 'Enter'}</span>
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <a
                  href="#features"
                  className="group flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-md border border-slate-200/50 text-slate-600 font-semibold transition-all duration-500 hover:bg-[#f5bb3e] hover:border-[#f5bb3e] hover:text-white hover:shadow-[0_0_20px_rgba(245,187,62,0.3)] dark:border-white/10 dark:text-slate-300 dark:hover:bg-[#f5bb3e] dark:hover:text-white"
                >
                  <span>More Info</span>
                  <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            </Reveal>
          </div>

          {/* 3. Features Section (Cards) */}
          <section id="features" className="w-full max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                },
                {
                  icon: Users,
                  title: 'Faculty Mentorship',
                  desc: 'Connect with expert faculty members to guide your research journey.'
                },
                {
                  icon: BookOpen,
                  title: 'Grant Management',
                  desc: 'Track and manage research grants and funding opportunities efficiently.'
                },
                {
                  icon: Globe,
                  title: 'Global Exposure',
                  desc: 'Showcase your research to a global audience through our open access portal.'
                }
              ].map((feature, i) => (
                <Reveal key={i} delay={i * 0.1} duration={0.8} direction="up" className="h-full">
                  <div className="group flex flex-col items-start p-6 rounded-2xl bg-white/70 border border-slate-100 hover:border-srm-200 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 backdrop-blur-md dark:bg-slate-900/70 dark:border-slate-800 dark:hover:border-srm-900 h-full relative z-20"> {/* z-20 to sit TOP of bottom image */}
                    <div className="w-12 h-12 rounded-xl bg-srm-50 text-srm-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3 dark:bg-slate-800 dark:text-srm-400">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 dark:text-white group-hover:text-srm-600 transition-colors">{feature.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed dark:text-slate-400">
                      {feature.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* 
         --- BOTTOM SECTION (Image Anchor) --- 
         - Separate dedicated section 
         - Negative margin to pull it UP behind the Cards
         - Mask logic: 0-20% transparent, 20-50% fade in, 50-100% visible
         - Z-Index: 0 (Behind Cards, which are z-20)
      */}
      <div className="relative w-full z-0 -mt-24 sm:-mt-32 pointer-events-none">
        <div className="w-full h-[600px] lg:h-[700px] relative">
          <div
            className="w-full h-full bg-cover bg-bottom bg-no-repeat absolute inset-0"
            style={{
              backgroundImage: 'url(/background.webp)',
              // Mask: Top 20% transparent, then fade, then solid at 50%
              maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 20%, black 50%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 20%, black 50%, black 100%)'
            }}
          >
            {/* Optional Tint */}
            <div className="absolute inset-0 bg-slate-900/10 mix-blend-overlay"></div>
          </div>
        </div>
      </div>

    </div>
  );
}