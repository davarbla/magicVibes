import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Sparkles, Mail, Heart } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl magical-gradient flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold magical-text">Magicvibes</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[40ch]">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <span className="text-sm font-semibold text-foreground mb-4 block">{t('footer.quickLinks')}</span>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                {t('navigation.home')}
              </Link>
              <Link to="/signup" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                {t('navigation.signup')}
              </Link>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                {t('navigation.login')}
              </Link>
            </div>
          </div>

          <div>
            <span className="text-sm font-semibold text-foreground mb-4 block">{t('footer.contact')}</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Mail className="w-4 h-4" />
              <span>hello@magicvibes.com</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="w-4 h-4 text-accent" />
              <span>{t('footer.madeWith')}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border/40 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {t('footer.rights')}
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;