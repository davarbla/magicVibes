import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { PasswordInput } from '@/components/PasswordInput.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { Sparkles, AlertCircle } from 'lucide-react';

const ResetPasswordPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError(t('passwordRecovery.invalidResetToken'));
    }
  }, [token, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error(t('login.fillRequired'));
      return;
    }

    if (password.length < 8) {
      toast.error(t('signup.passwordLength'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('passwordRecovery.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    try {
      await pb.collection('users').confirmPasswordReset(token, password, confirmPassword, { $autoCancel: false });
      toast.success(t('passwordRecovery.resetPasswordSuccess'));
      navigate('/login');
    } catch (err) {
      console.error('Password reset confirmation error:', err);
      toast.error(t('passwordRecovery.tokenExpired'));
      setError(t('passwordRecovery.tokenExpired'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${t('passwordRecovery.resetPasswordTitle')} - Magicvibes`}</title>
        <meta name="description" content={t('passwordRecovery.resetPasswordTitle')} />
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
                <h1 className="mb-2">{t('passwordRecovery.resetPasswordTitle')}</h1>
              </div>

              <Card className="rounded-2xl magical-shadow">
                {error ? (
                  <div className="text-center py-8 px-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{t('common.error')}</h3>
                    <p className="text-muted-foreground mb-8">{error}</p>
                    <Button asChild className="w-full">
                      <Link to="/forgot-password">{t('passwordRecovery.forgotPassword')}</Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <CardHeader>
                      <CardTitle>{t('passwordRecovery.resetPassword')}</CardTitle>
                      <CardDescription>{t('passwordRecovery.resetPasswordTitle')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">{t('passwordRecovery.newPassword')}</Label>
                        <PasswordInput
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('signup.passwordPlaceholder')}
                          required
                          minLength={8}
                          className="text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">{t('passwordRecovery.confirmPassword')}</Label>
                        <PasswordInput
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={t('signup.passwordPlaceholder')}
                          required
                          minLength={8}
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
                        {loading ? t('passwordRecovery.resetting') : t('passwordRecovery.resetPassword')}
                      </Button>
                      <p className="text-sm text-muted-foreground text-center">
                        <Link to="/login" className="text-primary hover:underline">
                          {t('passwordRecovery.backToLogin')}
                        </Link>
                      </p>
                    </CardFooter>
                  </form>
                )}
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ResetPasswordPage;