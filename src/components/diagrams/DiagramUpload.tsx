import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Eye, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiagramUploadProps {
  onDiagramUploaded: (diagramUrl: string) => void;
  existingDiagramUrl?: string;
}

export const DiagramUpload = ({ onDiagramUploaded, existingDiagramUrl }: DiagramUploadProps) => {
  const [uploadedDiagram, setUploadedDiagram] = useState<string>(existingDiagramUrl || '');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    // Check if file is PNG
    if (file.type !== 'image/png') {
      toast({
        title: 'Invalid file type',
        description: 'Only PNG files are allowed for kill chain diagrams',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select a PNG file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    // Convert to data URL for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedDiagram(dataUrl);
      onDiagramUploaded(dataUrl);
      toast({
        title: 'Success',
        description: 'Kill chain diagram uploaded successfully',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDelete = () => {
    setUploadedDiagram('');
    onDiagramUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: 'Deleted',
      description: 'Kill chain diagram removed',
    });
  };

  const handleDownload = () => {
    if (uploadedDiagram) {
      const link = document.createElement('a');
      link.href = uploadedDiagram;
      link.download = 'kill-chain-diagram.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Kill Chain Diagram
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload a PNG file of your kill chain diagram (max 10MB)
        </p>
      </CardHeader>
      
      <CardContent>
        {!uploadedDiagram ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileDialog}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              Drop your PNG file here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Only PNG files are accepted
            </p>
            <Button variant="outline">
              Select PNG File
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,image/png"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden bg-background">
              <img 
                src={uploadedDiagram} 
                alt="Kill Chain Diagram" 
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Kill chain diagram uploaded
              </span>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button size="sm" variant="outline" onClick={openFileDialog}>
                  <Upload className="h-4 w-4 mr-1" />
                  Replace
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDelete}>
                  <X className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,image/png"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};