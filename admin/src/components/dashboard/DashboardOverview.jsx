import Panel from './Panel';
import { DASHBOARD_STAT_ORDER, DASHBOARD_STAT_LABELS } from '@/utils/dashboardConstants';

export default function DashboardOverview({ dashboard, loading }) {
  return (
    <Panel title="Dashboard">
      {loading ? (
        <p className="text-text-dim">Loading...</p>
      ) : dashboard ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DASHBOARD_STAT_ORDER.map((key) => (
            <div key={key} className="rounded-xl border border-border-card bg-accent p-4">
              <p className="text-2xl font-bold text-text-main">{dashboard.stats?.[key] ?? 0}</p>
              <p className="text-sm text-text-dim">{DASHBOARD_STAT_LABELS[key]}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
