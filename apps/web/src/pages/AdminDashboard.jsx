import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Users, Settings, Activity, Database, ShieldAlert, Music } from 'lucide-react';

export default function AdminDashboard() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Magicvibes</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Admin Header */}
        <header className="sticky top-0 z-30 w-full border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-lg tracking-tight">Admin Portal</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, Admin</h1>
            <p className="text-muted-foreground">Here is an overview of your system status and quick actions.</p>
          </div>

          {/* Bento Grid Layout for Admin Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Primary Status Card */}
            <Card className="md:col-span-2 shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  System Overview
                </CardTitle>
                <CardDescription>Current platform metrics and health status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900">
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">Healthy</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900">
                    <p className="text-sm text-muted-foreground mb-1">Uptime</p>
                    <p className="text-xl font-semibold">99.9%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900">
                    <p className="text-sm text-muted-foreground mb-1">Active Users</p>
                    <p className="text-xl font-semibold">1,248</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900">
                    <p className="text-sm text-muted-foreground mb-1">Server Load</p>
                    <p className="text-xl font-semibold">24%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12"
                  onClick={() => navigate('/admin/music')}
                >
                  <Music className="w-4 h-4 mr-3 text-muted-foreground" />
                  Manage Music Library
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 transition-all opacity-50 cursor-not-allowed pointer-events-none">
                  <Users className="w-4 h-4 mr-3 text-muted-foreground" />
                  Manage Users
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 transition-all opacity-50 cursor-not-allowed pointer-events-none">
                  <Database className="w-4 h-4 mr-3 text-muted-foreground" />
                  View Database Logs
                </Button>
              </CardContent>
            </Card>

            {/* Placeholder for future modules */}
            <Card className="md:col-span-3 shadow-sm border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Settings className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">More Features Coming Soon</h3>
                <p className="text-muted-foreground max-w-md">
                  This admin panel is ready to be expanded with content moderation, detailed analytics, and configuration modules.
                </p>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </>
  );
}