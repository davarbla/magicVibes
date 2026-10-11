import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (pb.authStore.isValid && pb.authStore.model?.collectionName === 'admins') {
        setCurrentAdmin(pb.authStore.model);
      } else {
        setCurrentAdmin(null);
      }
      setLoading(false);
    };

    checkAuth();

    const unsubscribe = pb.authStore.onChange((token, model) => {
      if (pb.authStore.isValid && model?.collectionName === 'admins') {
        setCurrentAdmin(model);
      } else {
        setCurrentAdmin(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const authData = await pb.collection('admins').authWithPassword(email, password, { $autoCancel: false });
    setCurrentAdmin(authData.record);
    return authData;
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentAdmin(null);
  };

  const value = {
    currentAdmin,
    isAdminAuthenticated: !!currentAdmin,
    login,
    logout,
    loading
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {!loading && children}
    </AdminAuthContext.Provider>
  );
};