import { ExternalLink, Home, Shield, X } from 'lucide-react';
import { DASHBOARD_TABS, STUDENT_APP_URL } from '@/utils/dashboardConstants';

/** Below md: full-screen drawer. md–lg: half-screen drawer. lg+: persistent sidebar. */
export const ADMIN_SIDEBAR_PERSIST_BP = 1024;

export default function DashboardSidebar({
  activeTab,
  onTabChange,
  isSuper,
  isOwner,
  user,
  mobileOpen,
  onMobileClose,
}) {
  const visibleTabs = DASHBOARD_TABS.filter((t) => {
    if (t.superOnly && !isSuper) return false;
    if (t.ownerOnly && !isOwner) return false;
    return true;
  });

  const handleNavClick = (tabId) => {
    onTabChange(tabId);
    onMobileClose();
  };

  return (
    <aside
      className={`admin-sidebar fixed top-0 left-0 z-50 flex h-[100dvh] flex-col border-r transition-transform duration-300 ease-out lg:h-screen lg:shadow-none ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      aria-label="Admin navigation"
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border-card px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
            <Shield className="text-brand" size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-text-main">College Hub</p>
            <p className="text-[11px] text-text-dim">Administration</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onMobileClose}
          className="admin-sidebar-nav-item rounded-lg p-1.5 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-dim">
          Menu
        </p>
        {visibleTabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleNavClick(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors lg:py-2.5 ${
                active ? 'admin-sidebar-nav-item-active' : 'admin-sidebar-nav-item'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.25 : 2} className="shrink-0" />
              <span className="font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      <div
        className="shrink-0 space-y-2 border-t border-border-card p-3"
        style={{ backgroundColor: 'var(--sidebar-footer)' }}
      >
        <a
          href={STUDENT_APP_URL}
          target="_blank"
          rel="noreferrer"
          onClick={onMobileClose}
          className="admin-sidebar-nav-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm"
        >
          <Home size={18} className="shrink-0" />
          <span className="flex-1 font-medium">Student App</span>
          <ExternalLink size={14} className="shrink-0 opacity-60" />
        </a>
        {user && (
          <div className="rounded-lg border border-border-card bg-surface px-3 py-2.5">
            <p className="truncate text-sm font-medium text-text-main">{user.name}</p>
            <p className="text-xs text-text-dim">{user.role}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
