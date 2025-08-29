"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageToSupabase } from "@/lib/supabase/upload-image";

interface ImageTransformProps {
  className?: string;
  imageUrl?: string;
  onTransformComplete?: (newImageId: string) => void;
}

export default function ImageTransform({ 
  className = "", 
  imageUrl, 
  onTransformComplete 
}: ImageTransformProps) {
  const [prompt, setPrompt] = useState("");
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Autofocus the textarea when the component mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
    }

    // Add global Enter key handler to focus textarea when out of focus
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && textareaRef.current && document.activeElement !== textareaRef.current) {
        e.preventDefault();
        textareaRef.current.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const examples = [
    "Add text 'BANANA VIBES' at the top in bold yellow letters",
    "Make it more colorful and vibrant",
    "Turn it into a painting style",
    "Add text 'NANO BANANA' at the top in yellow comic sans font"
  ];

  const handleExampleClick = (exampleText: string) => {
    setPrompt(exampleText);
  };

  const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const dataURL = canvas.toDataURL('image/png');
        const base64 = dataURL.split(',')[1];
        resolve(base64);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  };

  const handleTransform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    if (!imageUrl) {
      setError("No image available to transform");
      return;
    }

    setIsTransforming(true);
    setError(null);
    
    try {
      const imageBase64 = await convertImageToBase64(imageUrl);
      
      const response = await fetch('/api/transform-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          prompt: prompt.trim(),
        }),
      });

      const contentType = response.headers.get('content-type');
      
      // Check if response is HTML (likely a redirect to login page)
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          throw new Error('Please sign in to transform images');
        }
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        let errorMessage = 'Failed to transform image';
        
        if (response.status === 401) {
          errorMessage = 'Please sign in to transform images';
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error('Error parsing error response:', parseError);
            errorMessage = response.status === 401 ? 'Please sign in to transform images' : 'Failed to transform image';
          }
        }
        
        throw new Error(errorMessage);
      }

      const { imageData, mimeType } = await response.json();
      
      const uploadResult = await uploadImageToSupabase(imageData, mimeType);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to save transformed image');
      }

      if (onTransformComplete && uploadResult.imageId) {
        onTransformComplete(uploadResult.imageId);
      } else if (uploadResult.imageId) {
        router.push(`/image/${uploadResult.imageId}`);
      }

      setPrompt("");
      
    } catch (error) {
      console.error('Transform error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsTransforming(false);
    }
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
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error.includes('sign in') ? (
              <>
                Please{' '}
                <Link 
                  href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}
                  className="underline hover:no-underline font-medium"
                >
                  sign in
                </Link>
                {' '}to transform images
              </>
            ) : (
              error
            )}
          </p>
        </div>
      )}
      
      <form onSubmit={handleTransform} className="space-y-3">
        <Textarea
          ref={textareaRef}
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
            disabled={!prompt.trim() || isTransforming || !imageUrl}
            size="default"
            className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
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