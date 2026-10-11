import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

const StoryCard = ({ story, childName, onClick }) => {
  return (
    <Card 
      onClick={onClick}
      className="rounded-2xl magical-shadow hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 border-primary/10 hover:border-primary/30 cursor-pointer flex flex-col h-full bg-card"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4 mb-2">
          <CardTitle className="text-xl leading-tight line-clamp-2">{story.title}</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {childName && (
            <Badge variant="secondary" className="rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border-none">
              <User className="w-3 h-3 mr-1" />
              {childName}
            </Badge>
          )}
          {story.sent_date && (
            <CardDescription className="flex items-center text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {format(new Date(story.sent_date), 'MMM d, yyyy')}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="mt-auto">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
          {story.story || story.content}
        </p>
      </CardContent>
    </Card>
  );
};

export default StoryCard;