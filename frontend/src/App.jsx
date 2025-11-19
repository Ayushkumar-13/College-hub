// FILE: frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { UserProvider } from "@/context/UserContext";
import { PostProvider } from "@/context/PostContext";
import { MessageProvider } from "@/context/MessageContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { SocketProvider } from "@/context/SocketContext";
import { useAuth } from "@/hooks";
import CallProviderWrapper from "@/context/CallProviderWrapper";
import { ToastContainer } from "@/components/Common/Toast";

// Pages
import LoginPage from "@/pages/LoginPage";
import ProfilePage from "@/pages/ProfilePage";
import RegisterPage from "@/pages/RegisterPage";
import HomePage from "@/pages/HomePage";
import MessagesPage from "@/pages/MessagesPage";
import IssuesPage from "@/pages/IssuesPage";
import ContactsPage from "@/pages/ContactsPage";
import NotificationsPage from "@/pages/NotificationsPage";

// Loading Screen Component
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
  </div>
);

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return !isAuthenticated ? children : <Navigate to="/" />;
};

// Routes Component
const AppRoutes = () => {
  return (
    <>
      {/* Toast Container for global notifications */}
      <ToastContainer />
      
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        
        {/* Protected */}
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
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

// MAIN APP COMPONENT
function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;
  
  return (
    <CallProviderWrapper>
      <AppRoutes />
    </CallProviderWrapper>
  );
}

// FINAL EXPORT WITH PROVIDERS WRAPPED OUTSIDE
export default function AppWithProviders() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <SocketProvider>
            <UserProvider>
              <PostProvider>
                <MessageProvider>
                  <App />
                </MessageProvider>
              </PostProvider>
            </UserProvider>
          </SocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}