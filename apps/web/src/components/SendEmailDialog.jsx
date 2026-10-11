import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';

const SendEmailDialog = ({ open, onOpenChange, story, storyTitle, storyContent, storyId }) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill fields when dialog opens
  useEffect(() => {
    if (open) {
      if (currentUser?.email) {
        setEmail(currentUser.email);
      } else {
        setEmail('');
      }
      setSubject(storyTitle || story?.title || '');
      setMessage('');
    }
  }, [open, currentUser, story, storyTitle]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error(t('storyDetail.emailSentError') || 'You must be logged in to send emails.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      toast.error(t('storyDetail.emailInvalidEmail') || 'Please enter a valid email address.');
      return;
    }

    if (!email.trim() || !subject.trim()) {
      toast.error(t('storyDetail.emailMissingFields') || 'Email and subject are required.');
      return;
    }

    const textContent = storyContent || story?.story || story?.content || '';
    if (!textContent) {
      toast.error(t('storyDetail.loadError') || 'Story content is missing.');
      return;
    }

    setLoading(true);
    try {
      // Extract and format content
      const paragraphs = textContent.split('\n').filter(p => p.trim() !== '');
      const title = subject.trim() || storyTitle || story?.title || 'Story';

      // HTML-formatted email body with semantic tags and updated layout
      const htmlBody = `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
          <h1 style="color: #4f46e5; margin-bottom: 12px; font-size: 24px;">${title}</h1>
          
          <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; color: #4b5563; font-size: 14px;">
            <p style="margin: 4px 0;"><strong>Sender:</strong> ${currentUser?.name || 'User'} (${currentUser?.email})</p>
            <p style="margin: 16px 0 8px 0; color: #6b7280;">Design with</p>
            <a href="https://midnightblue-moose-759496.hostingersite.com/" style="display: inline-block; text-decoration: none;">
              <img src="https://horizons-cdn.hostinger.com/1fe1873c-e532-469b-ae01-d64b6a6cf3f0/6596426b9732ca66ca8d79cb97cb34d9.png" alt="Magicvibes" width="140" style="max-width: 140px; height: auto; display: block; border: 0; outline: none;" />
            </a>
          </div>
          
          ${message.trim() ? `
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 0; font-style: italic; color: #374151;">"${message.trim()}"</p>
            </div>
          ` : ''}

          <div style="font-size: 16px;">
            ${paragraphs.map(p => `<p style="margin-bottom: 16px; line-height: 1.8;">${p}</p>`).join('')}
          </div>
        </div>
      `;

      // Ensure payload strictly uses recipientEmail, subject, and htmlBody
      const payload = { 
        recipientEmail: email.trim(),
        subject: subject.trim(),
        htmlBody: htmlBody
      };

      console.log('Email payload:', payload);

      const response = await apiServerClient.fetch('/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || data.message || t('storyDetail.emailSentError') || 'Failed to send email.';
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }
      
      toast.success(t('storyDetail.emailSentSuccess') || 'Email sent successfully!');
      
      // Clear form state after successful submission
      setEmail('');
      setSubject('');
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      console.error('Email error:', error.message, error);
      toast.error(error.message || t('storyDetail.emailSentError') || 'Failed to send email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              {t('storyDetail.emailDialogTitle') || 'Send Story via Email'}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {t('storyDetail.emailDialogDesc') || 'Share this magical story with someone special.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="email">
                {t('storyDetail.emailRecipient') || 'Recipient Email'}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="text-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">
                {t('storyDetail.emailSubject') || 'Subject'}
              </Label>
              <Input
                id="subject"
                type="text"
                placeholder="Story Title"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
                required
                className="text-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">
                {t('storyDetail.emailMessage') || 'Personal Message (Optional)'}
              </Label>
              <Textarea
                id="message"
                placeholder={t('storyDetail.emailMessagePlaceholder') || 'Add a personal note...'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                className="min-h-[100px] text-foreground resize-y"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              disabled={loading}
              className="rounded-full capitalize"
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="rounded-full px-6 capitalize"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {t('storyDetail.sendEmail') || 'Send Email'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendEmailDialog;