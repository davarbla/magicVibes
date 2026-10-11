import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Button } from '@/components/ui/button';
import { Sparkles, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import LanguageSelector from './LanguageSelector.jsx';

const Header = () => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const { language, t } = useLanguage();
  const location = useLocation();

  console.log(`Rendering Header with language: ${language}`);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl magical-gradient flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold magical-text hidden sm:inline-block">Magicvibes</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors duration-200 hover:text-primary ${
                isActive('/') ? 'text-primary font-semibold' : 'text-foreground'
              }`}
            >
              {t('common.home')}
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors duration-200 hover:text-primary ${
                    isActive('/dashboard') ? 'text-primary font-semibold' : 'text-foreground'
                  }`}
                >
                  {t('common.dashboard')}
                </Link>
                <Link
                  to="/stories"
                  className={`text-sm font-medium transition-colors duration-200 hover:text-primary ${
                    isActive('/stories') ? 'text-primary font-semibold' : 'text-foreground'
                  }`}
                >
                  {t('navigation.stories')}
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`text-sm font-medium transition-colors duration-200 hover:text-primary ${
                      isActive('/admin') ? 'text-primary font-semibold' : 'text-foreground'
                    }`}
                  >
                    {t('navigation.admin')}
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" className="transition-colors duration-200">
                    {t('navigation.login')}
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="magical-gradient text-foreground hover:opacity-90 transition-all duration-200 active:scale-[0.98]">
                    {t('navigation.signup')}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="md:hidden">
                  <Button variant="ghost" size="icon" className="transition-colors duration-200">
                    <LayoutDashboard className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/settings">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`transition-colors duration-200 ${isActive('/settings') ? 'text-primary' : ''}`}
                    title={t('common.settings')}
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="transition-colors duration-200 hover:text-destructive"
                  title={t('common.logout')}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;