import React, { useState, useEffect } from 'react';
import AdminHeader from '@/components/AdminHeader';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { useAuth } from '@/hooks';
import { useDashboardData } from '@/hooks/useDashboardData';
import { USER_ROLES } from '@/utils/constants';

export default function DashboardPage() {
  const { user } = useAuth();
  const isSuper = user?.role === USER_ROLES.SUPER_ADMIN;
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

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-page">
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <DashboardSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isSuper={isSuper}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
          />

          <main className="flex-1 min-w-0">
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {!collegeId && activeTab !== 'colleges' && (
              <div className="p-8 text-center text-text-dim bg-surface dark:bg-slate-900 rounded-xl border border-border-card">
                {isSuper
                  ? 'Set up your college in the College tab first.'
                  : 'No college linked to your account.'}
              </div>
            )}

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
          </main>
        </div>
      </div>
    </div>
  );
}
