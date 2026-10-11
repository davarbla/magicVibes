import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  const { isAuthenticated, currentUser } = useAuth();
  
  const languages = [
    { code: 'es', flag: '🇪🇸', label: 'Español', pbValue: 'Español' },
    { code: 'en', flag: '🇬🇧', label: 'English', pbValue: 'English' },
    { code: 'fr', flag: '🇫🇷', label: 'Français', pbValue: 'Français' }
  ];

  const handleLanguageChange = async (lang) => {
    console.log(`User selected language: ${lang.code}`);
    
    // Update local state and localStorage immediately
    setLanguage(lang.code);
    
    // If user is logged in, persist the preference to PocketBase
    if (isAuthenticated && currentUser) {
      try {
        await pb.collection('users').update(currentUser.id, {
          preferredLanguage: lang.pbValue
        }, { $autoCancel: false });
        
        console.log(`PocketBase updated, setting language to: ${lang.code}`);
      } catch (error) {
        console.error('Failed to save language preference to profile:', error);
      }
    }
  };

  return (
    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang)}
          title={lang.label}
          aria-label={`Select ${lang.label}`}
          className={`
            w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200
            ${language === lang.code 
              ? 'bg-background shadow-sm ring-1 ring-border scale-105' 
              : 'hover:bg-background/50 opacity-70 hover:opacity-100 hover:scale-105'
            }
          `}
        >
          <span className="text-lg leading-none">{lang.flag}</span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;