// FILE: frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { UserProvider } from "@/context/UserContext";
import { PostProvider } from "@/context/PostContext";
import { MessageProvider } from "@/context/MessageContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { SocketProvider } from "@/context/SocketContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useAuth } from "@/hooks";
import CallProviderWrapper from "@/context/CallProviderWrapper";
import { ToastContainer } from "@/components/Common/Toast";

import LoginPage from "@/pages/LoginPage";
import StudentLoginPage from "@/pages/StudentLoginPage";
import ProfilePage from "@/pages/ProfilePage";
import HomePage from "@/pages/HomePage";
import MessagesPage from "@/pages/MessagesPage";
import IssuesPage from "@/pages/IssuesPage";
import ContactsPage from "@/pages/ContactsPage";
import NotificationsPage from "@/pages/NotificationsPage";

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return !isAuthenticated ? children : <Navigate to="/" />;
};

const AppRoutes = () => {
  useAuth();

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/login/student"
          element={
            <PublicRoute>
              <StudentLoginPage />
            </PublicRoute>
          }
        />
        <Route path="/register" element={<Navigate to="/login/student" replace />} />
        <Route path="/register/student" element={<Navigate to="/login/student" replace />} />
        <Route path="/register/employee" element={<Navigate to="/login" replace />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/issues"
          element={
            <ProtectedRoute>
              <IssuesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedRoute>
              <ContactsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <CallProviderWrapper>
      <AppRoutes />
    </CallProviderWrapper>
  );
}

export default function AppWithProviders() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <UserProvider>
                <PostProvider>
                  <MessageProvider>
                    <App />
                  </MessageProvider>
                </PostProvider>
              </UserProvider>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
