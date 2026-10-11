import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Sparkles, BookOpen, Heart, Star, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
  const { language, t } = useLanguage();

  console.log(`Rendering HomePage with language: ${language}`);

  const features = [
    {
      icon: BookOpen,
      title: t('home.feature1Title'),
      description: t('home.feature1Desc')
    },
    {
      icon: Volume2,
      title: t('home.feature2Title'),
      description: t('home.feature2Desc')
    },
    {
      icon: Heart,
      title: t('home.feature3Title'),
      description: t('home.feature3Desc')
    },
    {
      icon: Star,
      title: t('home.feature4Title'),
      description: (
        <>
          {t('home.feature4DescStart')}
          <Link to="/benefits" className="text-primary hover:underline font-medium transition-colors">
            {t('home.feature4DescLink')}
          </Link>
          {t('home.feature4DescEnd')}
        </>
      )
    }
  ];

  return (
    <>
      <Helmet>
        <title>{`Magicvibes - ${t('home.heroTitle')}`}</title>
        <meta name="description" content={t('home.heroSubtitle')} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <img
                src="https://horizons-cdn.hostinger.com/1fe1873c-e532-469b-ae01-d64b6a6cf3f0/foto1-SAzyJ.jpg"
                alt="Child reading a magical storybook with wonder"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/50"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto text-center"
              >
                <h1 className="mb-6">
                  {t('home.heroTitle')}
                </h1>

                <p className="text-xl md:text-2xl text-black font-bold mb-8 leading-relaxed max-w-2xl mx-auto bg-white/75 px-6 py-4 rounded-xl shadow-lg">
                  {t('home.heroSubtitle')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/signup">
                    <Button size="lg" className="magical-gradient text-foreground hover:opacity-90 transition-all duration-200 active:scale-[0.98] text-lg px-8 py-6">
                      {t('home.signupBtn')}
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="text-lg px-8 py-6 transition-all duration-200 active:scale-[0.98]">
                      {t('home.loginBtn')}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="mb-4">{t('testimonials.title')}</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {t('testimonials.description')}
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="rounded-2xl h-full magical-shadow hover:-translate-y-1 transition-all duration-300 border-2 border-primary/10">
                      <CardHeader>
                        <div className="w-12 h-12 rounded-xl magical-gradient flex items-center justify-center mb-4">
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="max-w-3xl mx-auto text-center"
              >
                <Card className="rounded-2xl magical-shadow border-2 border-primary/20 overflow-hidden">
                  <div className="magical-gradient p-1">
                    <div className="bg-background rounded-xl p-8 md:p-12">
                      <Sparkles className="w-12 h-12 mx-auto mb-6 text-primary" />
                      <h2 className="mb-4">{t('cta.button')}</h2>
                      <Link to="/signup">
                        <Button size="lg" className="magical-gradient text-foreground hover:opacity-90 transition-all duration-200 active:scale-[0.98] text-lg px-8 py-6">
                          {t('home.ctaBtn')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default HomePage;