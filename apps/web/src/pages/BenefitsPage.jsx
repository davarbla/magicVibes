import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Heart, 
  BookA, 
  Sparkles, 
  Target, 
  Smile, 
  Moon, 
  Users, 
  GraduationCap, 
  Infinity as InfinityIcon,
  ArrowLeft
} from 'lucide-react';

const BenefitsPage = () => {
  const { t } = useLanguage();

  const benefits = [
    {
      id: 'cognitive',
      icon: Brain,
      title: t('benefits.items.cognitive.title'),
      desc: t('benefits.items.cognitive.desc')
    },
    {
      id: 'emotional',
      icon: Heart,
      title: t('benefits.items.emotional.title'),
      desc: t('benefits.items.emotional.desc')
    },
    {
      id: 'vocabulary',
      icon: BookA,
      title: t('benefits.items.vocabulary.title'),
      desc: t('benefits.items.vocabulary.desc')
    },
    {
      id: 'imagination',
      icon: Sparkles,
      title: t('benefits.items.imagination.title'),
      desc: t('benefits.items.imagination.desc')
    },
    {
      id: 'concentration',
      icon: Target,
      title: t('benefits.items.concentration.title'),
      desc: t('benefits.items.concentration.desc')
    },
    {
      id: 'stress',
      icon: Smile,
      title: t('benefits.items.stress.title'),
      desc: t('benefits.items.stress.desc')
    },
    {
      id: 'sleep',
      icon: Moon,
      title: t('benefits.items.sleep.title'),
      desc: t('benefits.items.sleep.desc')
    },
    {
      id: 'social',
      icon: Users,
      title: t('benefits.items.social.title'),
      desc: t('benefits.items.social.desc')
    },
    {
      id: 'academic',
      icon: GraduationCap,
      title: t('benefits.items.academic.title'),
      desc: t('benefits.items.academic.desc')
    },
    {
      id: 'lifelong',
      icon: InfinityIcon,
      title: t('benefits.items.lifelong.title'),
      desc: t('benefits.items.lifelong.desc')
    }
  ];

  return (
    <>
      <Helmet>
        <title>{`Magicvibes - ${t('benefits.title')}`}</title>
        <meta name="description" content={t('benefits.subtitle')} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <div className="container mx-auto max-w-4xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-8">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('benefits.backToHome')}
                </Link>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
                  {t('benefits.title')}
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  {t('benefits.subtitle')}
                </p>
              </motion.div>
            </div>
          </section>

          {/* Benefits Grid */}
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-6xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    viewport={{ once: true, margin: "-50px" }}
                  >
                    <Card className="h-full rounded-2xl border-2 border-primary/5 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                      <CardHeader className="flex flex-row items-start gap-4 pb-2">
                        <div className="w-12 h-12 rounded-xl magical-gradient flex items-center justify-center shrink-0">
                          <benefit.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl leading-tight mt-1">
                            {benefit.title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base leading-relaxed text-muted-foreground">
                          {benefit.desc}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <div className="container mx-auto max-w-3xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-6">{t('home.ctaTitle')}</h2>
                <Link to="/signup">
                  <Button size="lg" className="magical-gradient text-foreground hover:opacity-90 transition-all duration-200 active:scale-[0.98] text-lg px-8 py-6">
                    {t('home.ctaBtn')}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default BenefitsPage;