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
import { Sparkles, Plus, X } from 'lucide-react';

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: ''
  });
  const [children, setChildren] = useState([{ name: '', age: '' }]);

  const handleAddChild = () => {
    setChildren([...children, { name: '', age: '' }]);
  };

  const handleRemoveChild = (index) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const handleChildChange = (index, field, value) => {
    const updated = [...children];
    updated[index][field] = value;
    setChildren(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast.error(t('signup.fillRequired'));
      return;
    }

    // Client-side email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(t('signup.invalidEmail'));
      return;
    }

    if (formData.password.length < 8) {
      toast.error(t('signup.passwordLength'));
      return;
    }

    const validChildren = children.filter(child => child.name.trim() !== '');

    setLoading(true);
    const result = await signup({
      ...formData,
      age: formData.age ? parseFloat(formData.age) : null,
      children: validChildren.map(child => ({
        name: child.name,
        age: child.age ? parseFloat(child.age) : null
      }))
    });

    setLoading(false);

    if (result.success) {
      toast.success(t('signup.createSuccess'));
      navigate('/dashboard');
    } else {
      // Handle PocketBase validation errors gracefully
      const err = result.error;
      const errorString = (err?.message || '') + ' ' + JSON.stringify(err?.response?.data || {});
      const lowerError = errorString.toLowerCase();

      if (lowerError.includes('unique') || lowerError.includes('email')) {
        toast.error(t('signup.emailTaken'));
      } else {
        toast.error(err?.message || t('signup.createError'));
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${t('signup.title')} - Magicvibes`}</title>
        <meta name="description" content={t('signup.subtitle')} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl magical-gradient mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="mb-2">{t('signup.title')}</h1>
                <p className="text-muted-foreground">{t('signup.subtitle')}</p>
              </div>

              <Card className="rounded-2xl magical-shadow">
                <form onSubmit={handleSubmit}>
                  <CardHeader>
                    <CardTitle>{t('signup.infoTitle')}</CardTitle>
                    <CardDescription>{t('signup.infoDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('signup.nameLabel')}</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder={t('signup.namePlaceholder')}
                          required
                          className="text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">{t('signup.ageLabel')}</Label>
                        <Input
                          id="age"
                          type="number"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                          placeholder={t('signup.agePlaceholder')}
                          className="text-foreground"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t('signup.emailLabel')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={t('signup.emailPlaceholder')}
                        required
                        className="text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">{t('signup.passwordLabel')}</Label>
                      <PasswordInput
                        id="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={t('signup.passwordPlaceholder')}
                        required
                        minLength={8}
                        className="text-foreground"
                      />
                    </div>

                    <div className="border-t border-border pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <Label>{t('signup.childrenLabel')}</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddChild}
                          className="transition-all duration-200 active:scale-[0.98]"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {t('signup.addChildBtn')}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {children.map((child, index) => (
                          <div key={index} className="flex gap-3">
                            <Input
                              value={child.name}
                              onChange={(e) => handleChildChange(index, 'name', e.target.value)}
                              placeholder={t('signup.childNamePlaceholder')}
                              className="flex-1 text-foreground"
                            />
                            <Input
                              type="number"
                              value={child.age}
                              onChange={(e) => handleChildChange(index, 'age', e.target.value)}
                              placeholder={t('signup.childAgePlaceholder')}
                              className="w-24 text-foreground"
                            />
                            {children.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveChild(index)}
                                className="transition-colors duration-200 hover:text-destructive"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full magical-gradient text-foreground hover:opacity-90 transition-all duration-200 active:scale-[0.98]"
                    >
                      {loading ? t('signup.submittingBtn') : t('signup.submitBtn')}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      {t('signup.loginPrompt')}{' '}
                      <Link to="/login" className="text-primary hover:underline">
                        {t('signup.loginLink')}
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

export default SignupPage;