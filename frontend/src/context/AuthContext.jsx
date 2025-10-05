/**
 * FILE: frontend/src/context/AuthContext.jsx
 * LOCATION: college-social-platform/frontend/src/context/AuthContext.jsx
 * PURPOSE: Authentication context for managing user auth state - FIXED VERSION
 */
import React, { createContext, useState, useEffect } from 'react';
import { authApi } from '@/api/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log('✅ User authenticated from storage:', parsedUser._id || parsedUser.id);
        } else {
          console.log('⚠️  No authentication data found');
        }
      } catch (error) {
        console.error('❌ Error loading auth data:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const data = await authApi.login(email, password);
      
      // Save to state
      setUser(data.user);
      setToken(data.token);
      setIsAuthenticated(true);
      
      // Save to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('✅ User logged in:', data.user._id || data.user.id);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Login failed:', error);
      return { success: false, error: error.error || 'Login failed' };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const data = await authApi.register(userData);
      
      // Save to state
      setUser(data.user);
      setToken(data.token);
      setIsAuthenticated(true);
      
      // Save to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('✅ User registered:', data.user._id || data.user.id);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Registration failed:', error);
      return { success: false, error: error.error || 'Registration failed' };
    }
  };

  // Logout function
  const logout = () => {
    console.log('🚪 Logging out user');
    
    // Clear state FIRST
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    // Then clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Socket will automatically disconnect via SocketContext useEffect
  };

  // Update user data
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('✅ User data updated');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};