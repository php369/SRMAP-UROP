import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import { ScrollReveal as Reveal } from '../../components/ui/ScrollReveal';
import TiltedCard from '../../components/ui/TiltedCard';


export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-srm-100 dark:bg-slate-950 dark:text-slate-100 flex flex-col overflow-x-hidden relative">

      {/* 
        --- BACKGROUND LAYER (z-0) --- 
        Global background pattern for the top area. 
        Stops visually when the bottom image covers it.
      */}
      <div className="absolute top-0 left-0 right-0 h-[150vh] z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-top bg-no-repeat opacity-60 dark:opacity-20"
          style={{ backgroundImage: 'url(/7063.webp)' }}
        >
          {/* Gradient Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/60 to-transparent dark:from-slate-950/90 dark:via-slate-950/60"></div>
        </div>
      </div>

      {/* 
        --- CONTENT LAYER --- 
        Flattened z-index context to allow interlacing.
      */}
      <div className="relative flex flex-col w-full">

        {/* 1. Navigation (z-10) */}
        <nav className="w-full px-6 py-8 lg:px-12 flex items-center justify-between bg-transparent z-10 relative">
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

        {/* 2. Hero Content (z-10) */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 lg:px-8 text-center pt-12 md:pt-16 pb-20">
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
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-12 relative z-30">
              <Link
                to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}
                className="relative inline-flex group overflow-hidden rounded-full p-[2px] transition-transform duration-300 active:scale-95"
              >
                <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#f5bb3e_50%,transparent_100%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#f5bb3e_50%,transparent_100%)] opacity-70 group-hover:opacity-100" />

                <span className="relative inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-50/90 dark:bg-slate-900/90 px-8 py-4 text-sm font-semibold text-slate-900 dark:text-white backdrop-blur-3xl transition-all duration-500 group-hover:bg-[#f5bb3e] dark:group-hover:bg-[#f5bb3e] group-hover:text-white">
                  <span className="mr-2">{isAuthenticated ? 'Dashboard' : 'Enter'}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </div>
          </Reveal>
        </div>

        {/* 3. Features Section (z-30) - Overlaps Image */}
        <section id="features" className="relative z-30 w-full max-w-7xl mx-auto px-6 lg:px-8 pb-12">
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
                <TiltedCard
                  containerHeight="100%"
                  containerWidth="100%"
                  imageHeight="100%"
                  imageWidth="100%"
                  rotateAmplitude={12}
                  scaleOnHover={1.05}
                  showMobileWarning={false}
                  showTooltip={false}
                  displayOverlayContent={false}
                >
                  <div className="w-full h-full group flex flex-col items-start p-6 rounded-2xl bg-white/60 border border-slate-100 transition-colors duration-300 backdrop-blur-xl dark:bg-slate-900/60 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-srm-50 text-srm-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3 dark:bg-slate-800 dark:text-srm-400">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 dark:text-white group-hover:text-srm-600 transition-colors">{feature.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed dark:text-slate-400">
                      {feature.desc}
                    </p>
                  </div>
                </TiltedCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 4. Bottom Image Section (z-20) - Overlaps Background (z-0) */}
        {/* Negative margin pulls it up behind features. Mask fades it in smoothly. */}
        <div className="relative w-full z-20 -mt-24 sm:-mt-48 pointer-events-none">
          <div className="w-full h-[600px] lg:h-[800px] relative">
            <div
              className="w-full h-full bg-cover bg-bottom bg-no-repeat absolute inset-0"
              style={{
                backgroundImage: 'url(/background.webp)',
                // Precise Fade: 0-15% transparent, 15-50% fade in, 50-100% visible
                maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 15%, black 50%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 15%, black 50%, black 100%)'
              }}
            >
              {/* Optional Tint */}
              <div className="absolute inset-0 bg-slate-900/10 mix-blend-overlay"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}