import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Save, ArrowLeft, Tag } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
}

const WriteStory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [businessVertical, setBusinessVertical] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const businessVerticals = [
    'Technology',
    'Marketing',
    'Finance',
    'Operations', 
    'HR',
    'Strategy',
    'Sales',
    'Product',
    'Customer Success',
    'Other'
  ];

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  // Input sanitization function
  const sanitizeInput = (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  // Enhanced validation function
  const validateInput = (title: string, content: string): string | null => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
      return 'Please fill in both title and content';
    }

    if (trimmedTitle.length < 1 || trimmedTitle.length > 200) {
      return 'Title must be between 1 and 200 characters';
    }

    if (trimmedContent.length < 1 || trimmedContent.length > 50000) {
      return 'Content must be between 1 and 50,000 characters';
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(trimmedTitle) || pattern.test(trimmedContent)) {
        return 'Invalid characters detected in input';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const validationError = validateInput(title, content);
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to create a story',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      // Create the story with sanitized input
      const sanitizedTitle = sanitizeInput(title);
      const sanitizedContent = sanitizeInput(content);
      
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: sanitizedTitle,
          content: sanitizedContent,
          author_id: user.id,
          business_vertical: businessVertical || null,
        })
        .select()
        .single();

      if (storyError) throw storyError;

      // Add tags if any selected
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tagId => ({
          story_id: story.id,
          tag_id: tagId,
        }));

        const { error: tagsError } = await supabase
          .from('story_tags')
          .insert(tagInserts);

        if (tagsError) throw tagsError;
      }

      toast({
        title: 'Success!',
        description: 'Your story has been published successfully.',
      });

      navigate('/stories');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save story',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Write a Story</h1>
          <p className="text-muted-foreground">
            Share your experiences and insights with your team
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Story Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title * (max 200 characters)</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a compelling title for your story..."
                    maxLength={200}
                    required
                    className={title.length > 200 ? 'border-destructive' : ''}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {title.length}/200 characters
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content * (max 50,000 characters)</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your story here... What happened? What did you learn? How can others benefit from your experience?"
                    className={`min-h-[300px] resize-y ${content.length > 50000 ? 'border-destructive' : ''}`}
                    maxLength={50000}
                    required
                  />
                  <div className="text-xs text-muted-foreground text-right space-y-1">
                    <div>{wordCount} words</div>
                    <div className={content.length > 45000 ? 'text-destructive' : ''}>
                      {content.length}/50,000 characters
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing */}
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Publish Story
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Categorization */}
            <Card>
              <CardHeader>
                <CardTitle>Categorization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vertical">Business Vertical</Label>
                  <Select value={businessVertical} onValueChange={setBusinessVertical}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vertical (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessVerticals.map((vertical) => (
                        <SelectItem key={vertical} value={vertical}>
                          {vertical}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading tags...</div>
                ) : (
                  <div className="space-y-3">
                    {tags.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No tags available
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tags.map((tag) => (
                          <div key={tag.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`tag-${tag.id}`}
                              checked={selectedTags.includes(tag.id)}
                              onCheckedChange={() => handleTagToggle(tag.id)}
                            />
                            <Label 
                              htmlFor={`tag-${tag.id}`}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: tag.color }}
                              />
                              {tag.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedTags.length > 0 && (
                      <div className="pt-3 border-t">
                        <div className="text-sm font-medium mb-2">Selected tags:</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedTags.map((tagId) => {
                            const tag = tags.find(t => t.id === tagId);
                            return tag ? (
                              <Badge 
                                key={tag.id} 
                                variant="secondary"
                                style={{ 
                                  backgroundColor: `${tag.color}20`, 
                                  color: tag.color, 
                                  borderColor: tag.color 
                                }}
                              >
                                {tag.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default WriteStory;