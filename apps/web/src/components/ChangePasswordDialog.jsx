import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/PasswordInput.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function ChangePasswordDialog({ children }) {
  const { t } = useLanguage();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser || !currentUser.id) {
      console.error('Password change failed: No valid user session or user ID found.');
      toast.error(t('common.error') || 'Authentication error. Please log in again.');
      logout();
      return;
    }

    if (!formData.oldPassword) {
      toast.error(t('settings.passwordChangeError'));
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error(t('settings.passwordLength'));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }

    setLoading(true);
    console.log(`Attempting password change for user ID: ${currentUser.id}`);

    try {
      // Ensure the auth token is still valid before attempting the update
      await pb.collection('users').authRefresh({ $autoCancel: false });

      // Update the password using PocketBase's required fields for auth records
      await pb.collection('users').update(currentUser.id, {
        oldPassword: formData.oldPassword,
        password: formData.newPassword,
        passwordConfirm: formData.confirmPassword
      }, { $autoCancel: false });

      toast.success(t('settings.passwordChangeSuccess'));
      handleOpenChange(false);
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Detailed error handling based on PocketBase response status
      if (error.status === 404 || error.status === 401) {
        toast.error('Session expired or user not found. Please log in again.');
        logout();
      } else if (error.status === 400) {
        // 400 usually means validation failed (e.g., wrong old password)
        toast.error(t('settings.passwordChangeError') || 'Invalid current password or validation failed.');
      } else {
        toast.error(t('common.error') || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('settings.changePassword')}</DialogTitle>
            <DialogDescription>
              {t('settings.changePasswordDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">{t('settings.currentPassword')}</Label>
              <PasswordInput
                id="oldPassword"
                value={formData.oldPassword}
                onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                required
                className="text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
              <PasswordInput
                id="newPassword"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                required
                minLength={8}
                className="text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('settings.confirmNewPassword')}</Label>
              <PasswordInput
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={8}
                className="text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}