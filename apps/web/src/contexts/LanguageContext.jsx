import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '@/lib/translations';
import pb from '@/lib/pocketbaseClient';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    // Prioritize user's saved preferredLanguage if logged in
    const user = pb.authStore.model;
    if (user && user.preferredLanguage) {
      const langMap = { 'Español': 'es', 'English': 'en', 'Français': 'fr' };
      if (langMap[user.preferredLanguage]) {
        return langMap[user.preferredLanguage];
      }
    }
    
    // Fallback to localStorage or default to 'en'
    const saved = localStorage.getItem('preferredLanguage');
    return saved && ['es', 'en', 'fr'].includes(saved) ? saved : 'en';
  });

  // Explicit setLanguage function that updates both state and localStorage immediately
  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    localStorage.setItem('preferredLanguage', lang);
    document.documentElement.lang = lang;
    console.log(`Language changed to: ${lang}`);
  }, []);

  useEffect(() => {
    // Ensure DOM is synced on mount and state changes
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((key) => {
    if (!key) return '';
    const keys = key.split('.');
    let value = translations[language] || translations['en'];
    
    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }
    
    let result = value;

    // Fallback to English if translation is missing in current language
    if (result === undefined && language !== 'en') {
      let fallbackValue = translations['en'];
      for (const k of keys) {
        if (fallbackValue === undefined) break;
        fallbackValue = fallbackValue[k];
      }
      if (fallbackValue !== undefined) result = fallbackValue;
    }
    
    result = result || key;
    return result;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};