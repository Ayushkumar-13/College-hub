import React from 'react';
import DashboardOverview from './DashboardOverview';
import {
  CollegesPanel,
  CoursesPanel,
  SessionsPanel,
  BranchesPanel,
  SectionsPanel,
  CategoriesPanel,
  StudentsPanel,
  AssignmentsPanel,
  UsersPanel,
} from './panels';

export default function DashboardContent({
  activeTab,
  isSuper,
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
  user,
  userSearch,
  userRoleFilter,
  onSearchChange,
  onRoleFilterChange,
  loadColleges,
  refresh,
  loading,
}) {
  if (activeTab === 'dashboard' && collegeId) {
    return <DashboardOverview dashboard={dashboard} loading={loading} />;
  }

  if (activeTab === 'colleges' && isSuper) {
    return <CollegesPanel colleges={colleges} onRefresh={loadColleges} />;
  }

  if (activeTab === 'courses' && collegeId) {
    return (
      <CoursesPanel
        collegeId={collegeId}
        courses={courses}
        onRefresh={refresh}
        loading={loading}
      />
    );
  }

  if (activeTab === 'sessions' && collegeId) {
    return (
      <SessionsPanel
        collegeId={collegeId}
        sessions={sessions}
        onRefresh={refresh}
        loading={loading}
      />
    );
  }

  if (activeTab === 'branches' && collegeId) {
    return (
      <BranchesPanel
        collegeId={collegeId}
        courses={courses}
        branches={branches}
        faculty={users}
        onRefresh={refresh}
        loading={loading}
      />
    );
  }

  if (activeTab === 'sections' && collegeId) {
    return (
      <SectionsPanel
        collegeId={collegeId}
        courses={courses}
        branches={branches}
        sections={sections}
        sessions={sessions}
        faculty={users}
        onRefresh={refresh}
        loading={loading}
      />
    );
  }

  if (activeTab === 'categories' && collegeId) {
    return (
      <CategoriesPanel
        collegeId={collegeId}
        categories={categories}
        onRefresh={refresh}
        loading={loading}
      />
    );
  }

  if (activeTab === 'students' && collegeId) {
    return (
      <StudentsPanel
        collegeId={collegeId}
        credentials={studentCredentials}
        courses={courses}
        branches={branches}
        sections={sections}
        sessions={sessions}
        onRefresh={refresh}
        loading={loading}
      />
    );
  }

  if (activeTab === 'assignments' && collegeId) {
    return (
      <AssignmentsPanel
        collegeId={collegeId}
        assignments={assignments}
        users={users}
        branches={branches}
        sections={sections}
        courses={courses}
        sessions={sessions}
        categories={categories}
        onRefresh={refresh}
        loading={loading}
      />
    );
  }

  if (activeTab === 'users' && collegeId) {
    return (
      <UsersPanel
        collegeId={collegeId}
        users={users}
        currentUser={user}
        userSearch={userSearch}
        userRoleFilter={userRoleFilter}
        onSearchChange={onSearchChange}
        onRoleFilterChange={onRoleFilterChange}
        onRefresh={refresh}
        loading={loading}
      />
    );
  }

  return null;
}
