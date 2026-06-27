import React, { useState, useEffect } from 'react';
import AdminHeader from '@/components/AdminHeader';
import DashboardSidebar, { ADMIN_SIDEBAR_PERSIST_BP } from '@/components/dashboard/DashboardSidebar';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { useAuth } from '@/hooks';
import { useDashboardData } from '@/hooks/useDashboardData';
import { USER_ROLES } from '@/utils/constants';
import { getDashboardTabLabel } from '@/utils/dashboardConstants';

export default function DashboardPage() {
  const { user } = useAuth();
  const isSuper = user?.role === USER_ROLES.SUPER_ADMIN;
  const isOwner = user?.role === USER_ROLES.OWNER;
  const defaultCollege = user?.collegeId?._id || user?.collegeId || '';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    collegeId,
    colleges,
    dashboard,
    courses,
    branches,
    sections,
    sessions,
    categories,
    assignments,
    studentCredentials,
    users,
    error,
    loading,
    loadColleges,
    refresh,
  } = useDashboardData({
    isSuper,
    defaultCollege,
    activeTab,
    userSearch,
    userRoleFilter,
  });

  useEffect(() => {
    loadColleges();
  }, [loadColleges]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const mq = window.matchMedia(`(min-width: ${ADMIN_SIDEBAR_PERSIST_BP}px)`);
    if (mq.matches) return undefined;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${ADMIN_SIDEBAR_PERSIST_BP}px)`);
    const onResize = () => {
      if (mq.matches) setSidebarOpen(false);
    };
    mq.addEventListener('change', onResize);
    return () => mq.removeEventListener('change', onResize);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-page">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isSuper={isSuper}
        isOwner={isOwner}
        user={user}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-col lg:pl-[260px]">
        <AdminHeader
          title={getDashboardTabLabel(activeTab)}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {error && (
              <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </div>
            )}

            {!collegeId && activeTab !== 'colleges' && activeTab !== 'adminAccount' && (
              <div className="admin-panel rounded-xl border p-8 text-center text-text-dim">
                {isSuper
                  ? 'Set up your college in the College tab first.'
                  : 'No college linked to your account.'}
              </div>
            )}

            {(collegeId || activeTab === 'colleges' || activeTab === 'adminAccount') && (
              <DashboardContent
              activeTab={activeTab}
              isSuper={isSuper}
              collegeId={collegeId}
              colleges={colleges}
              dashboard={dashboard}
              courses={courses}
              branches={branches}
              sections={sections}
              sessions={sessions}
              categories={categories}
              assignments={assignments}
              studentCredentials={studentCredentials}
              users={users}
              user={user}
              userSearch={userSearch}
              userRoleFilter={userRoleFilter}
              onSearchChange={setUserSearch}
              onRoleFilterChange={setUserRoleFilter}
              loadColleges={loadColleges}
              refresh={refresh}
              loading={loading}
            />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
