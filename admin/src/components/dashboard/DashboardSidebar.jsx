import { Shield, Home, Menu, X } from 'lucide-react';
import { DASHBOARD_TABS, STUDENT_APP_URL } from '@/utils/dashboardConstants';

export default function DashboardSidebar({
  activeTab,
  onTabChange,
  isSuper,
  sidebarOpen,
  onToggleSidebar,
}) {
  const visibleTabs = DASHBOARD_TABS.filter((t) => !t.superOnly || isSuper);

  return (
    <>
      <button
        type="button"
        className="lg:hidden mb-4 flex items-center gap-2 px-3 py-2 bg-surface border border-border-card rounded-lg"
        onClick={onToggleSidebar}
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        Menu
      </button>
      <aside className={`lg:w-56 shrink-0 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
        <div className="bg-surface dark:bg-slate-900 rounded-xl border border-border-card p-4 sticky top-16">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border-card">
            <Shield className="text-blue-600" size={20} />
            <h2 className="font-bold text-text-main">Admin Panel</h2>
          </div>
          <nav className="space-y-1">
            {visibleTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-medium'
                    : 'text-text-dim hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
            <a
              href={STUDENT_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-dim hover:bg-slate-100 dark:hover:bg-slate-800 mt-2"
            >
              <Home size={16} /> Student App
            </a>
          </nav>
        </div>
      </aside>
    </>
  );
}
