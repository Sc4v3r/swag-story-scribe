import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Profile {
  display_name: string | null;
  email: string | null;
  department: string | null;
}

interface Story {
  id: string;
  title: string;
  content: string;
  author_id: string;
  business_vertical: string | null;
  created_at: string;
  updated_at: string;
  profiles: Profile | null;
  story_tags: Array<{ tags: Tag }>;
}

interface StoryCardProps {
  story: Story;
  onEdit?: (story: Story) => void;
  onDelete?: (storyId: string) => void;
  showActions?: boolean;
}

export function StoryCard({ story, onEdit, onDelete, showActions = true }: StoryCardProps) {
  const { user, isAdmin } = useAuth();
  
  const canEdit = user?.id === story.author_id || isAdmin;
  const canDelete = user?.id === story.author_id || isAdmin;
  
  const authorName = story.profiles?.display_name || story.profiles?.email || 'Unknown Author';
  const excerpt = story.content.length > 200 
    ? story.content.substring(0, 200) + '...'
    : story.content;

  return (
    <Link to={`/stories/${story.id}`} className="block h-full">
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight mb-2 line-clamp-2">
                {story.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate">{authorName}</span>
                {story.profiles?.department && (
                  <>
                    <span>•</span>
                    <span className="truncate">{story.profiles.department}</span>
                  </>
                )}
              </div>
            </div>
            
            {showActions && (canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.preventDefault()} // Prevent link navigation when clicking dropdown
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/stories/${story.id}`} className="cursor-pointer">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </DropdownMenuItem>
                  {canEdit && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        onEdit?.(story);
                      }}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        onDelete?.(story.id);
                      }}
                      className="cursor-pointer text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 pb-3">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {excerpt}
          </p>
        </CardContent>

        <CardFooter className="pt-0 flex flex-col gap-3">
          {/* Tags */}
          {story.story_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 w-full">
              {story.story_tags.map(({ tags }) => (
                <Badge 
                  key={tags.id} 
                  variant="secondary"
                  className="text-xs"
                  style={{ backgroundColor: `${tags.color}20`, color: tags.color, borderColor: tags.color }}
                >
                  {tags.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer info */}
          <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {story.business_vertical && (
                <Badge variant="outline" className="text-xs">
                  {story.business_vertical}
                </Badge>
              )}
            </div>
            <span>
              {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}