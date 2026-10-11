import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { toast } from 'sonner';
import { Sparkles, MailCheck, Activity } from 'lucide-react';

const ForgotPasswordPage = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (emailStr) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error(t('login.fillRequired'));
      return;
    }

    if (!validateEmail(email)) {
      toast.error(t('signup.invalidEmail') || 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Standard PocketBase password reset request
      await pb.collection('users').requestPasswordReset(email, { $autoCancel: false });
      
      setIsSubmitted(true);
      toast.success(t('passwordRecovery.resetLinkSent'));
    } catch (error) {
      console.error('Password reset error:', error);
      
      // Handle network/API errors gracefully
      if (error.status === 0 || error.isAbort) {
        toast.error(t('common.error') + ': Network error. Please check your connection.');
      } else {
        // For security reasons, we still show success to prevent email enumeration
        // unless it's a clear network error
        setIsSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnosticTest = async () => {
    if (!email) {
      toast.error(t('login.fillRequired'));
      return;
    }

    if (!validateEmail(email)) {
      toast.error(t('signup.invalidEmail') || 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await apiServerClient.fetch('/auth/test-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(`Diagnostic Success: ${data.message}`);
        console.log('Diagnostic details:', data);
      } else {
        toast.error(`Diagnostic Error: ${data.error || data.message || 'Unknown error'}`);
        console.error('Diagnostic error details:', data);
      }
    } catch (error) {
      console.error('Diagnostic test failed:', error);
      toast.error('Diagnostic request failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${t('passwordRecovery.forgotPasswordTitle')} - Magicvibes`}</title>
        <meta name="description" content={t('passwordRecovery.forgotPasswordDescription')} />
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
                <h1 className="mb-2">{t('passwordRecovery.forgotPasswordTitle')}</h1>
                <p className="text-muted-foreground">{t('passwordRecovery.forgotPasswordDescription')}</p>
              </div>

              <Card className="rounded-2xl magical-shadow">
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit}>
                    <CardHeader>
                      <CardTitle>{t('passwordRecovery.forgotPassword')}</CardTitle>
                      <CardDescription>{t('passwordRecovery.forgotPasswordDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('login.emailLabel')}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t('passwordRecovery.enterEmail')}
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
                        {loading ? t('passwordRecovery.sendingLink') : t('passwordRecovery.sendResetLink')}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDiagnosticTest}
                        disabled={loading}
                        className="w-full border-dashed"
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        Run Diagnostic Test
                      </Button>

                      <p className="text-sm text-muted-foreground text-center mt-2">
                        <Link to="/login" className="text-primary hover:underline">
                          {t('passwordRecovery.backToLogin')}
                        </Link>
                      </p>
                    </CardFooter>
                  </form>
                ) : (
                  <div className="text-center py-8 px-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                      <MailCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{t('passwordRecovery.resetLinkSent')}</h3>
                    <p className="text-muted-foreground mb-8">
                      {t('passwordRecovery.resetLinkSentMessage')}
                    </p>
                    <div className="flex flex-col gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsSubmitted(false)}
                        className="w-full"
                      >
                        {t('passwordRecovery.resendEmail')}
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="w-full"
                      >
                        <Link to="/login">{t('passwordRecovery.backToLogin')}</Link>
                      </Button>
                    </div>
                  </div>
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

export default ForgotPasswordPage;