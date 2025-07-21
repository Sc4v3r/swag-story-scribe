import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Download, Eye } from "lucide-react";
import { toast } from "sonner";

interface DiagramGeneratorProps {
  storyContent: string;
  storyTags: string[];
  onDiagramGenerated: (diagramUrl: string) => void;
}

export const DiagramGenerator = ({ 
  storyContent, 
  storyTags, 
  onDiagramGenerated 
}: DiagramGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDiagrams, setGeneratedDiagrams] = useState<string[]>([]);

  // Predefined kill chain diagrams based on attack types
  const getKillChainTemplate = () => {
    const templates = {
      phishing: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=600&fit=crop",
      webapp: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop", 
      wireless: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=600&fit=crop",
      network: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=800&h=600&fit=crop",
      default: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop"
    };

    // Determine template based on story tags
    if (storyTags.includes('Phishing')) return templates.phishing;
    if (storyTags.includes('Web App')) return templates.webapp;
    if (storyTags.includes('Wireless')) return templates.wireless;
    if (storyTags.includes('Internal Pentest')) return templates.network;
    
    return templates.default;
  };

  const generateKillChainDiagram = async () => {
    setIsGenerating(true);
    try {
      // Simulate diagram generation with realistic templates
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const diagramUrl = getKillChainTemplate();
      setGeneratedDiagrams(prev => [...prev, diagramUrl]);
      onDiagramGenerated(diagramUrl);
      
      toast.success("Kill chain diagram generated successfully!");
    } catch (error) {
      toast.error("Failed to generate diagram");
    } finally {
      setIsGenerating(false);
    }
  };

  const killChainSteps = [
    { phase: "Reconnaissance", description: "Information gathering and target identification" },
    { phase: "Initial Access", description: "Gaining foothold in the target environment" },
    { phase: "Execution", description: "Running malicious code on victim systems" },
    { phase: "Persistence", description: "Maintaining access to compromised systems" },
    { phase: "Privilege Escalation", description: "Obtaining higher-level permissions" },
    { phase: "Defense Evasion", description: "Avoiding detection by security controls" },
    { phase: "Discovery", description: "Learning about the target environment" },
    { phase: "Lateral Movement", description: "Moving through the network" },
    { phase: "Collection", description: "Gathering target data" },
    { phase: "Exfiltration", description: "Stealing collected information" }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Kill Chain Diagram Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate visual representations of the attack methodology
        </p>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generator">Generate</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generator" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Detected Attack Vectors</h3>
                <div className="flex flex-wrap gap-2">
                  {storyTags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Kill Chain Phases</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {killChainSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                      <Badge variant="secondary" className="text-xs">{index + 1}</Badge>
                      <div>
                        <div className="font-medium">{step.phase}</div>
                        <div className="text-muted-foreground text-xs">{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={generateKillChainDiagram} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Diagram...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Kill Chain Diagram
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            {generatedDiagrams.length > 0 ? (
              <div className="space-y-4">
                {generatedDiagrams.map((diagram, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <img 
                      src={diagram} 
                      alt={`Kill Chain Diagram ${index + 1}`}
                      className="w-full h-auto"
                    />
                    <div className="p-3 bg-muted/50 flex justify-between items-center">
                      <span className="text-sm font-medium">Diagram {index + 1}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No diagrams generated yet</p>
                <p className="text-sm">Switch to the Generate tab to create kill chain diagrams</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};