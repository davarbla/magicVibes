import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import { Shield, LogOut, Settings, Music } from 'lucide-react';

export default function AdminHeader() {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-slate-950 text-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/admin/music" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Magicvibes Admin</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1 ml-4">
            <Link to="/admin/music">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <Music className="w-4 h-4 mr-2" />
                Music Library
              </Button>
            </Link>
            {/* Add more admin nav links here in the future */}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {adminUser && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400 mr-2">
              <Settings className="w-4 h-4" />
              <span>{adminUser.email}</span>
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}