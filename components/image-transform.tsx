"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ImageTransformProps {
  className?: string;
}

export default function ImageTransform({ className = "" }: ImageTransformProps) {
  const [prompt, setPrompt] = useState("");
  const [isTransforming, setIsTransforming] = useState(false);

  const examples = [
    "Add text 'BANANA VIBES' at the top in bold yellow letters",
    "Make it more colorful and vibrant",
    "Turn it into a painting style",
    "Add text 'NANO BANANA' at the top in yellow comic sans font"
  ];

  const handleExampleClick = (exampleText: string) => {
    setPrompt(exampleText);
  };

  const handleTransform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsTransforming(true);
    
    // TODO: Implement backend integration
    setTimeout(() => {
      setIsTransforming(false);
      // Reset form after transformation
      setPrompt("");
    }, 2000);
  };

  return (
    <div className={`p-4 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Wand2 className="h-5 w-5 text-yellow-600" />
          <h3 className="font-medium">Transform Image</h3>
        </div>
        <p className="text-sm text-muted-foreground">Transform this image or add text to create memes</p>
      </div>

      <div className="border-t border-border mb-4"></div>

      {/* Examples Section */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-3">Try these examples:</p>
        <div className="space-y-2">
          {examples.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleExampleClick(example)}
              disabled={isTransforming}
              className="w-full text-left p-3 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
&ldquo;{example}&rdquo;
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border mb-4"></div>
      
      <form onSubmit={handleTransform} className="space-y-3">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const formEvent = { ...e, preventDefault: () => e.preventDefault() } as React.FormEvent;
              handleTransform(formEvent);
            }
          }}
          placeholder="Describe your transformation... (e.g., 'Make this image look like a Van Gogh painting with swirling brushstrokes')"
          className="min-h-[80px] resize-none"
          disabled={isTransforming}
        />
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground flex-1">
            Be specific about styles, colors, effects, or text you want to add
          </p>
          
          <Button
            type="submit"
            disabled={!prompt.trim() || isTransforming}
            size="default"
            className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {isTransforming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Transforming...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Transform
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}