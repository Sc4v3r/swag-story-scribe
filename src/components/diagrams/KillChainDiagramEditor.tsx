import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Text, Line } from "fabric";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

interface KillChainDiagramEditorProps {
  onDiagramSave?: (diagramData: string) => void;
  initialDiagram?: string;
  storyType?: string;
}

export const KillChainDiagramEditor = ({ 
  onDiagramSave, 
  initialDiagram, 
  storyType = "generic" 
}: KillChainDiagramEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);

  // Kill chain templates based on story type
  const getKillChainSteps = (type: string) => {
    const templates = {
      phishing: [
        "1. Reconnaissance",
        "2. Email Spear Phishing", 
        "3. Credential Harvesting",
        "4. Initial Access",
        "5. Privilege Escalation",
        "6. Lateral Movement",
        "7. Data Exfiltration"
      ],
      webapp: [
        "1. Target Identification",
        "2. Vulnerability Scanning",
        "3. SQL Injection",
        "4. Database Access",
        "5. Data Extraction",
        "6. Persistence",
        "7. Covering Tracks"
      ],
      wireless: [
        "1. Network Discovery",
        "2. Wireless Assessment",
        "3. Access Point Compromise",
        "4. Network Infiltration",
        "5. SCADA Access",
        "6. System Control",
        "7. Impact Assessment"
      ],
      stolen_device: [
        "1. Physical Theft",
        "2. Credential Extraction",
        "3. VPN Access",
        "4. Network Reconnaissance",
        "5. Database Access",
        "6. Data Harvesting",
        "7. Account Persistence"
      ],
      generic: [
        "1. Reconnaissance",
        "2. Initial Access",
        "3. Execution",
        "4. Persistence",
        "5. Privilege Escalation",
        "6. Defense Evasion",
        "7. Discovery",
        "8. Lateral Movement",
        "9. Collection",
        "10. Exfiltration"
      ]
    };
    return templates[type as keyof typeof templates] || templates.generic;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#f8fafc",
    });

    setFabricCanvas(canvas);

    // Generate initial kill chain diagram
    generateKillChainDiagram(canvas, storyType);

    return () => {
      canvas.dispose();
    };
  }, [storyType]);

  const generateKillChainDiagram = (canvas: FabricCanvas, type: string) => {
    canvas.clear();
    canvas.backgroundColor = "#f8fafc";

    const steps = getKillChainSteps(type);
    const stepWidth = 140;
    const stepHeight = 60;
    const spacing = 20;
    const startX = 50;
    const startY = 50;

    // Colors for different phases
    const colors = [
      "#ef4444", // red
      "#f97316", // orange  
      "#eab308", // yellow
      "#22c55e", // green
      "#06b6d4", // cyan
      "#8b5cf6", // purple
      "#ec4899", // pink
      "#f59e0b", // amber
      "#10b981", // emerald
      "#6366f1"  // indigo
    ];

    steps.forEach((step, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const x = startX + col * (stepWidth + spacing);
      const y = startY + row * (stepHeight + spacing * 2);

      // Create step box
      const rect = new Rect({
        left: x,
        top: y,
        width: stepWidth,
        height: stepHeight,
        fill: colors[index % colors.length],
        stroke: "#374151",
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      });

      // Create step text
      const text = new Text(step, {
        left: x + stepWidth / 2,
        top: y + stepHeight / 2,
        fontSize: 12,
        fill: "#ffffff",
        fontWeight: "bold",
        textAlign: "center",
        originX: "center",
        originY: "center",
      });

      canvas.add(rect);
      canvas.add(text);

      // Add arrows between steps
      if (index < steps.length - 1) {
        const nextRow = Math.floor((index + 1) / 3);
        const nextCol = (index + 1) % 3;
        
        if (nextRow === row) {
          // Horizontal arrow
          const arrow = new Line([
            x + stepWidth + 5, 
            y + stepHeight / 2,
            x + stepWidth + spacing - 5, 
            y + stepHeight / 2
          ], {
            stroke: "#374151",
            strokeWidth: 2,
          });
          canvas.add(arrow);
        } else if (nextCol === 0 && col === 2) {
          // Down and left arrow for end of row
          const arrowDown = new Line([
            x + stepWidth / 2, 
            y + stepHeight + 5,
            x + stepWidth / 2, 
            y + stepHeight + spacing - 5
          ], {
            stroke: "#374151",
            strokeWidth: 2,
          });
          canvas.add(arrowDown);
        }
      }
    });

    // Add title
    const title = new Text(`${type.toUpperCase()} Kill Chain`, {
      left: 400,
      top: 20,
      fontSize: 20,
      fill: "#1f2937",
      fontWeight: "bold",
      textAlign: "center",
      originX: "center",
    });
    canvas.add(title);

    canvas.renderAll();
    toast.success("Kill chain diagram generated!");
  };

  const handleSaveDiagram = () => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    });
    
    onDiagramSave?.(dataURL);
    toast.success("Diagram saved!");
  };

  const handleDownload = () => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    });
    
    const link = document.createElement('a');
    link.download = `killchain-diagram-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    
    toast.success("Diagram downloaded!");
  };

  const handleReset = () => {
    if (!fabricCanvas) return;
    generateKillChainDiagram(fabricCanvas, storyType);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Kill Chain Diagram Editor</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Visual representation of the attack methodology
            </p>
          </div>
          <Badge variant="outline">{storyType.replace('_', ' ').toUpperCase()}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handleSaveDiagram} size="sm">
            <Save className="mr-2 h-4 w-4" />
            Save Diagram
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download PNG
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
        
        <div className="border border-gray-200 rounded-lg shadow-lg overflow-hidden bg-white">
          <canvas ref={canvasRef} className="max-w-full" />
        </div>

        <div className="text-xs text-muted-foreground">
          <strong>Tip:</strong> This diagram shows the step-by-step attack methodology used in this penetration test. 
          Each step represents a phase in the cyber kill chain from initial reconnaissance to final impact.
        </div>
      </CardContent>
    </Card>
  );
};