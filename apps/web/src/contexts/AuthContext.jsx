import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();
  const { setLanguage } = useLanguage();

  const applyUserLanguage = useCallback((user) => {
    if (user && user.preferredLanguage) {
      const langMap = { 'Español': 'es', 'English': 'en', 'Français': 'fr' };
      const code = langMap[user.preferredLanguage];
      if (code) {
        setLanguage(code);
      }
    }
  }, [setLanguage]);

  const logout = useCallback(() => {
    pb.authStore.clear();
    setCurrentUser(null);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const initAuth = async () => {
      // Check if a valid token exists BEFORE attempting refresh
      if (pb.authStore.token && pb.authStore.isValid && pb.authStore.model?.collectionName === 'users') {
        try {
          // Validate token and refresh auth state
          const authData = await pb.collection('users').authRefresh({ $autoCancel: false });
          setCurrentUser(authData.record);
          applyUserLanguage(authData.record);
        } catch (error) {
          // Silently catch 401 errors to prevent console noise when unauthenticated
          if (error.status !== 401) {
            console.error('AuthContext: Token validation failed:', error);
          }
          // If token is invalid or expired, clear store and redirect
          logout();
        }
      } else {
        setCurrentUser(null);
      }
      setInitialLoading(false);
    };

    initAuth();

    // Listen to auth store changes to keep state in sync
    const unsubscribe = pb.authStore.onChange((token, model) => {
      if (model?.collectionName === 'users') {
        setCurrentUser(model);
        applyUserLanguage(model);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [applyUserLanguage, logout]);

  const signup = async (userData) => {
    try {
      // Create user account
      const user = await pb.collection('users').create({
        email: userData.email,
        password: userData.password,
        passwordConfirm: userData.password,
        name: userData.name,
        age: userData.age,
        role: 'user',
        subscription_status: 'inactive'
      }, { $autoCancel: false });

      // Auto-login after signup
      const authData = await pb.collection('users').authWithPassword(userData.email, userData.password, { $autoCancel: false });
      setCurrentUser(authData.record);
      applyUserLanguage(authData.record);

      // Create children records if provided
      if (userData.children && userData.children.length > 0) {
        for (const child of userData.children) {
          await pb.collection('children').create({
            name: child.name,
            age: child.age || null,
            parent_user_id: authData.record.id
          }, { $autoCancel: false });
        }
      }

      return { success: true, user: authData.record };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error };
    }
  };

  const login = async (email, password) => {
    try {
      // Only authenticate, do NOT attempt to update the user record here
      const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
      setCurrentUser(authData.record);
      applyUserLanguage(authData.record);
      
      return { success: true, user: authData.record };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshUser = async () => {
    if (pb.authStore.isValid && pb.authStore.model?.collectionName === 'users') {
      try {
        const updatedRecord = await pb.collection('users').getOne(pb.authStore.model.id, { $autoCancel: false });
        setCurrentUser(updatedRecord);
        applyUserLanguage(updatedRecord);
      } catch (error) {
        if (error.status !== 401) {
          console.error('Error refreshing user:', error);
        }
        if (error.status === 401 || error.status === 404) {
          logout();
        }
      }
    }
  };

  const isAuthenticated = pb.authStore.isValid && currentUser !== null && pb.authStore.model?.collectionName === 'users';
  const isAdmin = currentUser?.role === 'admin';

  const value = {
    currentUser,
    isAuthenticated,
    isAdmin,
    signup,
    login,
    logout,
    refreshUser,
    initialLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};