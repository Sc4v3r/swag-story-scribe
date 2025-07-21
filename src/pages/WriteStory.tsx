import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiagramUpload } from '@/components/diagrams/DiagramUpload';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface BusinessVertical {
  id: string;
  name: string;
  description?: string;
}

const WriteStory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [businessVerticalId, setBusinessVerticalId] = useState('');
  const [geolocation, setGeolocation] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [diagramUrl, setDiagramUrl] = useState<string>('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [businessVerticals, setBusinessVerticals] = useState<BusinessVertical[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  useEffect(() => {
    fetchTags();
    fetchBusinessVerticals();
    if (editId) {
      fetchStoryForEdit();
    }
  }, [editId]);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchBusinessVerticals = async () => {
    try {
      const { data, error } = await supabase
        .from('business_verticals')
        .select('*')
        .order('name');

      if (error) throw error;
      
      setBusinessVerticals(data || []);
    } catch (error) {
      console.error('Error fetching business verticals:', error);
    }
  };

  const fetchStoryForEdit = async () => {
    try {
      if (editId) {
        const { data: story, error: storyError } = await supabase
          .from('stories')
          .select('*, story_tags(tag_id)')
          .eq('id', editId)
          .single();

        if (storyError) throw storyError;

        setTitle(story.title);
        setContent(story.content);
        setBusinessVerticalId(story.business_vertical_id || '');
        setGeolocation(story.geolocation || '');
        setDiagramUrl(story.diagram_url || '');
        setSelectedTags(story.story_tags.map((st: any) => st.tag_id));
        setIsEditing(true);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load story for editing',
        variant: 'destructive',
      });
    }
  };

  // Remove the old getPredefinedVerticals function since we now fetch from database

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const generateRandomColor = () => {
    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', 
      '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const createCustomTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Tag name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    // Check if tag already exists
    const existingTag = tags.find(tag => 
      tag.name.toLowerCase() === newTagName.trim().toLowerCase()
    );
    
    if (existingTag) {
      toast({
        title: 'Tag Already Exists',
        description: 'This tag already exists. Select it from the dropdown.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreatingTag(true);

      const { data, error } = await supabase
        .from('tags')
        .insert({
          name: newTagName.trim(),
          color: generateRandomColor()
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new tag to the tags list
      setTags(prev => [...prev, data]);
      
      // Auto-select the newly created tag
      setSelectedTags(prev => [...prev, data.id]);
      
      // Clear the input
      setNewTagName('');

      toast({
        title: 'Success!',
        description: 'Custom tag created and added to your story.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create custom tag',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to create a story',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      let storyId;
      
      if (isEditing && editId) {
        // Update existing story
        const { error: updateError } = await supabase
          .from('stories')
          .update({
            title,
            content,
            business_vertical_id: businessVerticalId || null,
            geolocation: geolocation || null,
            diagram_url: diagramUrl || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editId);

        if (updateError) throw updateError;
        storyId = editId;
      } else {
        // Create new story
        const { data, error: insertError } = await supabase
          .from('stories')
          .insert({
            title,
            content,
            author_id: user.id,
            business_vertical_id: businessVerticalId || null,
            geolocation: geolocation || null,
            diagram_url: diagramUrl || null
          })
          .select()
          .single();

        if (insertError) throw insertError;
        storyId = data.id;
      }

      // Handle tags
      if (isEditing) {
        // Delete existing tags for this story
        await supabase
          .from('story_tags')
          .delete()
          .eq('story_id', storyId);
      }

      // Add new tags
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tagId => ({
          story_id: storyId,
          tag_id: tagId,
        }));

        const { error: tagsError } = await supabase
          .from('story_tags')
          .insert(tagInserts);

        if (tagsError) throw tagsError;
      }

      toast({
        title: 'Success!',
        description: `Story ${isEditing ? 'updated' : 'published'} successfully.`,
      });

      navigate('/stories');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save story',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to write stories.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {isEditing ? 'Edit Story' : 'Write New Story'}
        </h1>
        <p className="text-muted-foreground">
          Share your penetration testing experiences and insights
        </p>
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Story Content</TabsTrigger>
          <TabsTrigger value="diagram">Kill Chain Diagram</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Story Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter story title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Share your penetration testing story, methodology, findings, and impact..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                />
              </div>

              <div>
                <Label htmlFor="business-vertical">Business Vertical</Label>
                <Select value={businessVerticalId} onValueChange={setBusinessVerticalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business vertical..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-md z-50">
                    {businessVerticals.map((vertical) => (
                      <SelectItem key={vertical.id} value={vertical.id}>
                        {vertical.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="geolocation">Region</Label>
                <Select value={geolocation} onValueChange={setGeolocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMER">AMER (Americas)</SelectItem>
                    <SelectItem value="EMEA">EMEA (Europe, Middle East, Africa)</SelectItem>
                    <SelectItem value="APAC">APAC (Asia-Pacific)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedTags.map((tagId) => {
                    const tag = tags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <Badge 
                        key={tagId} 
                        variant="secondary"
                        className="cursor-pointer"
                        style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: tag.color }}
                        onClick={() => toggleTag(tagId)}
                      >
                        {tag.name} ×
                      </Badge>
                    );
                  })}
                </div>
                
                {/* Existing tags dropdown */}
                <div className="space-y-3">
                  <Select onValueChange={toggleTag}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing tags..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-md z-50">
                      {tags.filter(tag => !selectedTags.includes(tag.id)).map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Custom tag creation */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Create new tag..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          createCustomTag();
                        }
                      }}
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={createCustomTag}
                      disabled={isCreatingTag || !newTagName.trim()}
                    >
                      {isCreatingTag ? 'Creating...' : 'Add Tag'}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Create custom tags by typing a name and clicking "Add Tag" or pressing Enter.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagram">
          <DiagramUpload 
            onDiagramUploaded={(diagramData) => setDiagramUrl(diagramData)}
            existingDiagramUrl={diagramUrl}
          />
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Story Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{title || 'Untitled Story'}</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>By {user?.email}</span>
                  {businessVerticalId && businessVerticals.find(v => v.id === businessVerticalId) && (
                    <Badge variant="outline">
                      {businessVerticals.find(v => v.id === businessVerticalId)?.name}
                    </Badge>
                  )}
                  {geolocation && <Badge variant="outline">{geolocation}</Badge>}
                </div>
              </div>

              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tagId) => {
                    const tag = tags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <Badge 
                        key={tagId} 
                        variant="secondary"
                        style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    );
                  })}
                </div>
              )}

              {diagramUrl && (
                <div>
                  <h3 className="font-semibold mb-2">Kill Chain Diagram</h3>
                  <div className="border rounded-lg overflow-hidden bg-gray-50 p-4">
                    <img 
                      src={diagramUrl} 
                      alt="Kill Chain Diagram" 
                      className="w-full h-auto max-w-2xl mx-auto rounded"
                    />
                  </div>
                </div>
              )}

              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap">
                  {content || 'No content yet...'}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex gap-4">
        <Button onClick={handleSubmit} disabled={loading || !title || !content}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEditing ? 'Updating...' : 'Publishing...'}
            </>
          ) : (
            isEditing ? 'Update Story' : 'Publish Story'
          )}
        </Button>
        <Button variant="outline" onClick={() => navigate('/stories')}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default WriteStory;