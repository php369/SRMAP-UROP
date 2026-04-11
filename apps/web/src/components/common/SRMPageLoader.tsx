import { motion } from 'framer-motion';

/**
 * Premium SRM-Branded Full Page Loader
 * Used for initial authentication checks and app-wide splash states
 */
export function SRMPageLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#e5e4d3]">
      <div className="relative w-32 h-32 mb-8">
        {/* Decorative Outer Rings */}
        <motion.div
          className="absolute inset-0 rounded-full border-[3px] border-[#c89643]/10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
        />
        
        {/* Main Spinning Border */}
        <div className="absolute inset-0 rounded-full border-[4px] border-[#4a4724]/5" />
        <motion.div
          className="absolute inset-0 rounded-full border-[4px] border-t-[#c89643] border-r-transparent border-b-transparent border-l-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner Ring (Reverse) */}
        <motion.div
          className="absolute inset-4 rounded-full border-[2px] border-b-[#918a41] border-t-transparent border-r-transparent border-l-transparent"
          animate={{ rotate: -360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
        
        {/* SRM Icon Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.img 
            src="/branding/srm-icon.svg" 
            alt="SRM University" 
            className="w-16 h-16 object-contain opacity-80"
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0.9 }}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-2"
      >
        <h2 className="text-xl font-bold text-[#4a4724] tracking-tight">Initializing Portal</h2>
        <div className="flex items-center gap-1.5">
          <motion.span 
            className="w-1.5 h-1.5 bg-[#c89643] rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          />
          <motion.span 
            className="w-1.5 h-1.5 bg-[#c89643] rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
          <motion.span 
            className="w-1.5 h-1.5 bg-[#c89643] rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          />
        </div>
        <p className="text-sm text-[#817f63] font-medium mt-1">Securing connection...</p>
      </motion.div>
    </div>
  );
}
