import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import { Breadcrumb } from '../../../components/ui/Breadcrumb';

// Pages
import { ControlPanelHome } from './ControlPanelHome';
import { ManageWindowsPage } from './ManageWindowsPage';
import { SemesterPlanWizardPage } from './SemesterPlanWizardPage';
import { IndividualWindowWizardPage } from './IndividualWindowWizardPage';
import { ExternalEvaluatorsTab } from './components/ExternalEvaluators/ExternalEvaluatorsTab';

export function ControlPanel() {
  const location = useLocation();

  // Smart Breadcrumb Logic
  const getBreadcrumbs = () => {
    // Determine base path based on current location (admin vs coordinator)
    const isAdmin = location.pathname.includes('/admin/control');
    const basePath = isAdmin ? '/dashboard/admin/control' : '/dashboard/control';

    const crumbs: { label: string; path?: string }[] = [
      { label: 'Dashboard', path: '/dashboard' },
      { label: isAdmin ? 'Coordinator Control' : 'Control Panel', path: basePath }
    ];

    if (location.pathname.includes('/windows')) {
      crumbs.push({ label: 'Manage Windows', path: `${basePath}/windows` });
    } else if (location.pathname.includes('/wizard')) {
      crumbs.push(
        { label: 'Manage Windows', path: `${basePath}/windows` },
        { label: 'Setup Semester Plan', path: `${basePath}/wizard` }
      );
    } else if (location.pathname.includes('/individual')) {
      crumbs.push(
        { label: 'Manage Windows', path: `${basePath}/windows` },
        { label: 'Create Window', path: `${basePath}/individual` }
      );
    } else if (location.pathname.includes('/external-evaluators')) {
      crumbs.push({ label: 'External Evaluators', path: `${basePath}/external-evaluators` });
    }

    // Don't link to the current page's breadcrumb
    if (crumbs.length > 0) {
      // Create a new object for the last item without the path, 
      // avoiding direct mutation or delete operator issues on references
      const lastItem = crumbs[crumbs.length - 1];
      crumbs[crumbs.length - 1] = { label: lastItem.label };
    }

    return crumbs;
  };

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Breadcrumb items={getBreadcrumbs()} className="mb-4" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Routes>
              <Route index element={<ControlPanelHome />} />
              <Route path="windows" element={<ManageWindowsPage />} />
              <Route path="wizard" element={<SemesterPlanWizardPage />} />
              <Route path="individual" element={<IndividualWindowWizardPage />} />
              <Route path="external-evaluators" element={<ExternalEvaluatorsTab />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}