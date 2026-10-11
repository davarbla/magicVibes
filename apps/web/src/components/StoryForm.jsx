import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { extractSoundKeywords } from '@/lib/soundMetadata.js';
import { KEYWORD_MAP } from '@/components/StoryWithSoundButtons.jsx';

const StoryForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [children, setChildren] = useState([]);
  
  // Task 1 & 3: Form data is managed strictly with React state (useState).
  // No localStorage or sessionStorage is used to persist this data.
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    user_id: '',
    child_id: '',
    sent_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (formData.user_id) {
      loadChildren(formData.user_id);
    } else {
      setChildren([]);
      setFormData(prev => ({ ...prev, child_id: '' }));
    }
  }, [formData.user_id]);

  const loadUsers = async () => {
    try {
      const records = await pb.collection('users').getFullList({
        filter: 'role = "user"',
        sort: 'name',
        $autoCancel: false
      });
      setUsers(records);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const loadChildren = async (userId) => {
    try {
      const records = await pb.collection('children').getFullList({
        filter: `parent_user_id = "${userId}"`,
        sort: 'name',
        $autoCancel: false
      });
      setChildren(records);
    } catch (error) {
      console.error('Error loading children:', error);
      toast.error('Failed to load children');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('--- [StoryForm] Submit Handler Triggered ---');
    console.log('1. Form Data Validation:', { 
      title: formData.title, 
      contentLength: formData.content?.length, 
      user_id: formData.user_id,
      child_id: formData.child_id
    });
    
    if (!formData.title || !formData.content || !formData.user_id) {
      console.warn('Validation Error: Missing required fields');
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Extract sound metadata before saving
      const metadata = extractSoundKeywords(formData.content, KEYWORD_MAP);
      const metadataString = JSON.stringify(metadata);

      const payload = {
        title: formData.title,
        story: formData.content,
        user_id: formData.user_id,
        child_id: formData.child_id || null,
        sent_date: formData.sent_date,
        created_by: pb.authStore.model?.name || 'Admin',
        sound_metadata: metadataString
      };

      console.log('2. Submitting Data directly to PocketBase:', payload);

      // Task 1 & 3: Save directly to PocketBase. No intermediate browser storage.
      const record = await pb.collection('stories').create(payload, { $autoCancel: false });

      console.log('3. PocketBase Response Success:', record);
      toast.success('Story sent successfully');
      
      // Task 4: Clear form state after successful submission
      setFormData({
        title: '',
        content: '',
        user_id: '',
        child_id: '',
        sent_date: new Date().toISOString().split('T')[0]
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('4. PocketBase Error:', error);
      toast.error('Failed to send story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Create and send story</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Story title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="The magical adventure of..."
              required
              className="text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Story content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Once upon a time..."
              rows={8}
              required
              className="text-foreground"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user">Select user</Label>
              <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="child">Select child (optional)</Label>
              <Select 
                value={formData.child_id} 
                onValueChange={(value) => setFormData({ ...formData, child_id: value })}
                disabled={!formData.user_id || children.length === 0}
              >
                <SelectTrigger id="child">
                  <SelectValue placeholder={children.length === 0 ? 'No children' : 'Choose a child'} />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name} {child.age ? `(${child.age} years)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sent_date">Send date</Label>
            <Input
              id="sent_date"
              type="date"
              value={formData.sent_date}
              onChange={(e) => setFormData({ ...formData, sent_date: e.target.value })}
              required
              className="text-foreground"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full magical-gradient text-foreground hover:opacity-90 transition-all duration-200 active:scale-[0.98]"
          >
            {loading ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send story
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default StoryForm;