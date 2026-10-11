import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { Plus, Save, Trash2, Loader2, KeyRound } from 'lucide-react';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog.jsx';

const AccountSettingsPage = () => {
  const { currentUser, refreshUser, initialLoading, logout } = useAuth();
  const { language, t, setLanguage } = useLanguage();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    preferredLanguage: 'English'
  });
  const [children, setChildren] = useState([]);
  const [newChild, setNewChild] = useState({ name: '', age: '' });

  console.log(`Rendering AccountSettingsPage with language: ${language}`);

  useEffect(() => {
    if (!initialLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, initialLoading, navigate]);

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || '',
        preferredLanguage: currentUser.preferredLanguage || 'English'
      });
      loadChildren();
    }
  }, [currentUser]);

  const loadChildren = async () => {
    if (!currentUser?.id) return;
    try {
      const records = await pb.collection('children').getFullList({
        filter: `parent_user_id = "${currentUser.id}"`,
        sort: 'name',
        $autoCancel: false
      });
      setChildren(records);
    } catch (error) {
      console.error('Error loading children:', error);
      if (error.status === 401 || error.status === 404) {
        toast.error('Session expired. Please log in again.');
        logout();
      }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    
    setLoading(true);
    const updatePayload = {
      name: profileData.name,
      preferredLanguage: profileData.preferredLanguage
    };

    try {
      // 1. Save to PocketBase
      await pb.collection('users').update(currentUser.id, updatePayload, { $autoCancel: false });
      
      // 2. Update global language state immediately
      const langMap = { 'Español': 'es', 'English': 'en', 'Français': 'fr' };
      const code = langMap[profileData.preferredLanguage];
      
      if (code) {
        console.log(`PocketBase updated, setting language to: ${code}`);
        setLanguage(code);
      }

      await refreshUser();
      
      // 3. Show success toast
      toast.success(t('settings.profileSuccess'));
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.status === 401 || error.status === 404) {
        toast.error('Session expired. Please log in again.');
        logout();
      } else {
        toast.error(t('settings.profileError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    if (!newChild.name.trim()) {
      toast.error(t('settings.childError'));
      return;
    }

    try {
      await pb.collection('children').create({
        name: newChild.name,
        age: newChild.age ? parseFloat(newChild.age) : null,
        parent_user_id: currentUser.id
      }, { $autoCancel: false });

      setNewChild({ name: '', age: '' });
      await loadChildren();
      toast.success(t('settings.childSuccess'));
    } catch (error) {
      console.error('Error adding child:', error);
      if (error.status === 401 || error.status === 404) {
        toast.error('Session expired. Please log in again.');
        logout();
      } else {
        toast.error(t('settings.childError'));
      }
    }
  };

  const handleDeleteChild = async (childId) => {
    if (!window.confirm(t('settings.removeConfirm'))) {
      return;
    }

    try {
      await pb.collection('children').delete(childId, { $autoCancel: false });
      await loadChildren();
      toast.success(t('settings.childRemoveSuccess'));
    } catch (error) {
      console.error('Error deleting child:', error);
      if (error.status === 401 || error.status === 404) {
        toast.error('Session expired. Please log in again.');
        logout();
      } else {
        toast.error(t('settings.childRemoveError'));
      }
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentUser?.id) return;
    
    if (!window.confirm(t('settings.cancelConfirm'))) {
      return;
    }

    try {
      await pb.collection('users').update(currentUser.id, {
        subscription_status: 'cancelled'
      }, { $autoCancel: false });

      await refreshUser();
      toast.success(t('settings.subCancelSuccess'));
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      if (error.status === 401 || error.status === 404) {
        toast.error('Session expired. Please log in again.');
        logout();
      } else {
        toast.error(t('settings.subCancelError'));
      }
    }
  };

  if (initialLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${t('settings.title')} - Magicvibes`}</title>
        <meta name="description" content={t('settings.subtitle')} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="mb-2">{t('settings.title')}</h1>
                <p className="text-muted-foreground">{t('settings.subtitle')}</p>
              </div>

              <div className="space-y-6">
                {/* Profile Settings */}
                <Card className="rounded-2xl magical-shadow">
                  <form onSubmit={handleUpdateProfile}>
                    <CardHeader>
                      <CardTitle>{t('settings.profileTitle')}</CardTitle>
                      <CardDescription>{t('settings.profileDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">{t('settings.nameLabel')}</Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            required
                            className="text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="preferredLanguage">{t('settings.languageLabel')}</Label>
                          <Select 
                            value={profileData.preferredLanguage} 
                            onValueChange={(val) => {
                              setProfileData({ ...profileData, preferredLanguage: val });
                            }}
                          >
                            <SelectTrigger id="preferredLanguage" className="text-foreground">
                              <SelectValue placeholder={t('common.language')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Español">🇪🇸 {t('common.spanish')}</SelectItem>
                              <SelectItem value="English">🇬🇧 {t('common.english')}</SelectItem>
                              <SelectItem value="Français">🇫🇷 {t('common.french')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>{t('settings.emailLabel')}</Label>
                        <Input value={currentUser?.email || ''} disabled className="bg-muted" />
                        <p className="text-xs text-muted-foreground">{t('settings.emailDesc')}</p>
                      </div>

                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">{t('settings.changePassword')}</h4>
                          <p className="text-sm text-muted-foreground">{t('settings.changePasswordDesc')}</p>
                        </div>
                        <ChangePasswordDialog>
                          <Button type="button" variant="outline" className="transition-all duration-200 active:scale-[0.98]">
                            <KeyRound className="w-4 h-4 mr-2" />
                            {t('settings.changePassword')}
                          </Button>
                        </ChangePasswordDialog>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t border-border pt-6">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="transition-all duration-200 active:scale-[0.98]"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {t('common.save_changes')}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>

                {/* Children Management */}
                <Card className="rounded-2xl magical-shadow">
                  <CardHeader>
                    <CardTitle>{t('settings.childrenTitle')}</CardTitle>
                    <CardDescription>{t('settings.childrenDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Existing Children */}
                    {children.length > 0 && (
                      <div className="space-y-3">
                        {children.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border"
                          >
                            <div>
                              <p className="font-medium">{child.name}</p>
                              {child.age && (
                                <p className="text-sm text-muted-foreground">{child.age} {t('storyDetail.age').toLowerCase()}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteChild(child.id)}
                              className="transition-colors duration-200 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator />

                    {/* Add New Child */}
                    <form onSubmit={handleAddChild} className="space-y-4">
                      <Label>{t('settings.addChild')}</Label>
                      <div className="flex gap-3">
                        <Input
                          value={newChild.name}
                          onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                          placeholder={t('settings.childName')}
                          className="flex-1 text-foreground"
                        />
                        <Input
                          type="number"
                          value={newChild.age}
                          onChange={(e) => setNewChild({ ...newChild, age: e.target.value })}
                          placeholder={t('settings.childAge')}
                          className="w-24 text-foreground"
                        />
                        <Button type="submit" className="transition-all duration-200 active:scale-[0.98]">
                          <Plus className="w-4 h-4 mr-2" />
                          {t('settings.addBtn')}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Subscription Management */}
                {currentUser?.subscription_status === 'active' && (
                  <Card className="rounded-2xl magical-shadow border-destructive/20">
                    <CardHeader>
                      <CardTitle>{t('settings.subTitle')}</CardTitle>
                      <CardDescription>{t('settings.subDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t('settings.subActive')}
                      </p>
                      <Button
                        variant="destructive"
                        onClick={handleCancelSubscription}
                        className="transition-all duration-200 active:scale-[0.98]"
                      >
                        {t('settings.cancelSub')}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AccountSettingsPage;