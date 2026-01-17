import { Stats } from '../../types';
import { HeroMetrics } from './HeroMetrics';
import { ProgressSection } from './ProgressSection';
import { WindowsTimeline } from './WindowsTimeline';

interface StatsCardsProps {
  stats: Stats | null;
  loading?: boolean;
}

export function StatsCards({ stats, loading = false }: StatsCardsProps) {
  // If stats is missing and not explicitly loading, we might treat it as loading or empty.
  // But usually this component is mounted when stats exist or when we want to show skeletons.
  const isLoading = loading || !stats;

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* 1. Key Metrics Row */}
      <HeroMetrics stats={stats} loading={isLoading} />

      {/* 2. Progress & Health Section */}
      <ProgressSection stats={stats} loading={isLoading} />

      {/* 3. Timeline & Upcoming Section */}
      <WindowsTimeline stats={stats} loading={isLoading} />

    </div>
  );
}