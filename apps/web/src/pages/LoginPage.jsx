import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { PasswordInput } from '@/components/PasswordInput.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error(t('login.fillRequired'));
      return;
    }

    setLoading(true);
    // The login function in AuthContext handles authentication without patching the user record
    const result = await login(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      toast.success(t('login.successMsg'));
      navigate('/dashboard');
    } else {
      toast.error(result.error || t('login.errorMsg'));
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${t('navigation.login')} - Magicvibes`}</title>
        <meta name="description" content={t('login.subtitle')} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 flex items-center justify-center py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl magical-gradient mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="mb-2">{t('login.title')}</h1>
                <p className="text-muted-foreground">{t('login.subtitle')}</p>
              </div>

              <Card className="rounded-2xl magical-shadow">
                <form onSubmit={handleSubmit}>
                  <CardHeader>
                    <CardTitle>{t('login.formTitle')}</CardTitle>
                    <CardDescription>{t('login.formDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('login.emailLabel')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={t('login.emailPlaceholder')}
                        required
                        className="text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">{t('login.passwordLabel')}</Label>
                        <Link 
                          to="/forgot-password" 
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          {t('passwordRecovery.forgotPassword')}
                        </Link>
                      </div>
                      <PasswordInput
                        id="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={t('login.passwordPlaceholder')}
                        required
                        className="text-foreground"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full magical-gradient text-foreground hover:opacity-90 transition-all duration-200 active:scale-[0.98]"
                    >
                      {loading ? t('login.submittingBtn') : t('login.submitBtn')}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      {t('login.signupPrompt')}{' '}
                      <Link to="/signup" className="text-primary hover:underline">
                        {t('login.signupLink')}
                      </Link>
                    </p>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default LoginPage;