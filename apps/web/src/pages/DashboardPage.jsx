import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { Calendar, User, Settings, CreditCard, BookOpen, Sparkles, Wand2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log(`Rendering DashboardPage with language: ${language}`);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [childrenData, subscriptionData] = await Promise.all([
        pb.collection('children').getFullList({
          filter: `parent_user_id = "${currentUser.id}"`,
          sort: 'name',
          $autoCancel: false
        }),
        pb.collection('subscriptions').getFullList({
          filter: `user_id = "${currentUser.id}"`,
          sort: '-created',
          $autoCancel: false
        })
      ]);

      setChildren(childrenData);
      setSubscription(subscriptionData[0] || null);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextDeliveryDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Next Tuesday (2) or Friday (5)
    if (dayOfWeek < 2) {
      return addDays(today, 2 - dayOfWeek);
    } else if (dayOfWeek < 5) {
      return addDays(today, 5 - dayOfWeek);
    } else {
      return addDays(today, 9 - dayOfWeek);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      cancelled: 'destructive',
      expired: 'secondary'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
              <Skeleton className="h-12 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Dashboard - Magicvibes`}</title>
        <meta name="description" content="Manage your Magicvibes subscription, view your children's profiles, and access your personalized stories." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                  <h1 className="mb-2">{t('dashboard.welcomeBack')}, {currentUser.name}</h1>
                  <p className="text-muted-foreground">{t('dashboard.manageProfile')}</p>
                </div>
                
                <Button 
                  onClick={() => navigate('/create-story')}
                  className="h-14 px-8 text-lg magical-gradient text-foreground hover:opacity-90 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] animate-pulse-glow"
                >
                  <Wand2 className="w-6 h-6 mr-3" />
                  {t('dashboard.createStories')}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Subscription Status */}
                <Card className="rounded-2xl magical-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        {t('dashboard.subscription')}
                      </CardTitle>
                      {getStatusBadge(currentUser.subscription_status || 'inactive')}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentUser.subscription_status === 'active' ? (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{t('dashboard.nextStory')}:</span>
                          <span className="font-medium">{format(getNextDeliveryDate(), 'EEEE, MMMM d')}</span>
                        </div>
                        {currentUser.renewal_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{t('dashboard.renews')}:</span>
                            <span className="font-medium">{format(new Date(currentUser.renewal_date), 'MMMM d, yyyy')}</span>
                          </div>
                        )}
                        <Link to="/settings">
                          <Button variant="outline" className="w-full transition-all duration-200 active:scale-[0.98]">
                            <Settings className="w-4 h-4 mr-2" />
                            {t('dashboard.manageSubscription')}
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {t('dashboard.subscribeText')}
                        </p>
                        <Link to="/subscribe">
                          <Button className="w-full magical-gradient text-foreground hover:opacity-90 transition-all duration-200 active:scale-[0.98]">
                            <Sparkles className="w-4 h-4 mr-2" />
                            {t('dashboard.subscribeNow')}
                          </Button>
                        </Link>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="rounded-2xl magical-shadow">
                  <CardHeader>
                    <CardTitle>{t('dashboard.quickActions')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link to="/stories">
                      <Button variant="outline" className="w-full justify-start transition-all duration-200 active:scale-[0.98]">
                        <BookOpen className="w-4 h-4 mr-2" />
                        {t('dashboard.viewAllStories')}
                      </Button>
                    </Link>
                    <Link to="/settings">
                      <Button variant="outline" className="w-full justify-start transition-all duration-200 active:scale-[0.98]">
                        <Settings className="w-4 h-4 mr-2" />
                        {t('dashboard.accountSettings')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Children Profiles */}
              <Card className="rounded-2xl magical-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('dashboard.yourChildren')}</CardTitle>
                      <CardDescription>{t('dashboard.manageChildrenProfiles')}</CardDescription>
                    </div>
                    <Link to="/settings">
                      <Button variant="outline" size="sm" className="transition-all duration-200 active:scale-[0.98]">
                        {t('dashboard.edit')}
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {children.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {children.map((child) => (
                        <div
                          key={child.id}
                          className="p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/50 transition-colors duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <User className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{child.name}</p>
                              {child.age && (
                                <p className="text-sm text-muted-foreground">{child.age} {t('dashboard.yearsOld')}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">{t('dashboard.noChildrenAdded')}</p>
                      <Link to="/settings">
                        <Button variant="outline" className="transition-all duration-200 active:scale-[0.98]">
                          {t('dashboard.addChild')}
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default DashboardPage;
