import { useNavigate } from 'react-router-dom';
import { ChevronRight, Home, Users } from 'lucide-react';
import { ExternalEvaluatorsTab } from './components/ExternalEvaluators/ExternalEvaluatorsTab';

export function ExternalEvaluatorsPage() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-textSecondary mb-6">
                <button
                    onClick={() => navigate('/coordinator/dashboard')}
                    className="flex items-center hover:text-primary transition-colors"
                >
                    <Home className="w-4 h-4 mr-1" />
                    Dashboard
                </button>
                <ChevronRight className="w-4 h-4 mx-2" />
                <button
                    onClick={() => navigate('/coordinator/control-panel')}
                    className="hover:text-primary transition-colors"
                >
                    Control Panel
                </button>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="text-text font-medium flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    External Evaluators
                </span>
            </nav>

            <ExternalEvaluatorsTab />
        </div>
    );
}
