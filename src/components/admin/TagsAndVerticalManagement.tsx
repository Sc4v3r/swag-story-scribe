import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tag, Building2, Plus, Trash2, Edit, AlertTriangle } from 'lucide-react';

interface TagData {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

interface BusinessVertical {
  value: string;
  count: number;
}

export function TagsAndVerticalManagement() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [tags, setTags] = useState<TagData[]>([]);
  const [businessVerticals, setBusinessVerticals] = useState<BusinessVertical[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [newVerticalName, setNewVerticalName] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingTag, setEditingTag] = useState<TagData | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchTags();
      fetchBusinessVerticals();
    }
  }, [isAdmin]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      console.error('Error fetching tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tags',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessVerticals = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('business_vertical')
        .not('business_vertical', 'is', null);

      if (error) throw error;
      
      // Count occurrences of each business vertical
      const verticalCounts: { [key: string]: number } = {};
      data?.forEach((story) => {
        if (story.business_vertical) {
          verticalCounts[story.business_vertical] = (verticalCounts[story.business_vertical] || 0) + 1;
        }
      });

      const verticals = Object.entries(verticalCounts).map(([value, count]) => ({
        value,
        count
      }));

      setBusinessVerticals(verticals);
    } catch (error: any) {
      console.error('Error fetching business verticals:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch business verticals',
        variant: 'destructive',
      });
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a tag name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tags')
        .insert([{
          name: newTagName.trim(),
          color: newTagColor
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Tag created successfully',
      });

      setNewTagName('');
      setNewTagColor('#3b82f6');
      fetchTags();
    } catch (error: any) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create tag',
        variant: 'destructive',
      });
    }
  };

  const updateTag = async () => {
    if (!editingTag || !editingTag.name.trim()) return;

    try {
      const { error } = await supabase
        .from('tags')
        .update({
          name: editingTag.name.trim(),
          color: editingTag.color
        })
        .eq('id', editingTag.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Tag updated successfully',
      });

      setEditingTag(null);
      fetchTags();
    } catch (error: any) {
      console.error('Error updating tag:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update tag',
        variant: 'destructive',
      });
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Tag deleted successfully',
      });

      fetchTags();
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete tag',
        variant: 'destructive',
      });
    }
  };

  const updateBusinessVertical = async (oldValue: string, newValue: string) => {
    try {
      const { error } = await supabase
        .from('stories')
        .update({ business_vertical: newValue.trim() })
        .eq('business_vertical', oldValue);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Business vertical updated successfully',
      });

      fetchBusinessVerticals();
    } catch (error: any) {
      console.error('Error updating business vertical:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update business vertical',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              Only administrators can manage tags and business verticals.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tags" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags Management
          </TabsTrigger>
          <TabsTrigger value="verticals" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business Verticals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tags" className="space-y-6">
          {/* Create New Tag */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Tag
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tag-name">Tag Name</Label>
                  <Input
                    id="tag-name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Enter tag name..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag-color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tag-color"
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="flex items-center h-10">
                    <Badge style={{ backgroundColor: newTagColor, color: 'white' }}>
                      {newTagName || 'Tag Name'}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button onClick={createTag} disabled={!newTagName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Tag
              </Button>
            </CardContent>
          </Card>

          {/* Existing Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Loading tags...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                      {editingTag?.id === tag.id ? (
                        <div className="flex items-center gap-4 flex-1">
                          <Input
                            value={editingTag.name}
                            onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                            className="flex-1"
                          />
                          <Input
                            type="color"
                            value={editingTag.color}
                            onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                            className="w-16 h-10 p-1"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={updateTag}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingTag(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <Badge style={{ backgroundColor: tag.color, color: 'white' }}>
                              {tag.name}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {tag.color}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingTag(tag)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the tag "{tag.name}"? 
                                    This action cannot be undone and will remove the tag from all stories.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteTag(tag.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Tag
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  
                  {tags.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No tags found. Create your first tag above.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verticals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Verticals Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manage business verticals used across stories. You can rename existing verticals 
                  and all stories assigned to that vertical will be updated automatically.
                </p>
                
                <div className="space-y-2">
                  {businessVerticals.map((vertical) => (
                    <div key={vertical.value} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {vertical.value}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {vertical.count} stor{vertical.count !== 1 ? 'ies' : 'y'}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newValue = prompt('Enter new name for this business vertical:', vertical.value);
                          if (newValue && newValue.trim() !== vertical.value) {
                            updateBusinessVertical(vertical.value, newValue.trim());
                          }
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Rename
                      </Button>
                    </div>
                  ))}
                  
                  {businessVerticals.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No business verticals found. Business verticals are set when creating stories.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
