"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageToSupabase } from "@/lib/supabase/upload-image";
import { createClient } from "@/lib/supabase/client";
import { LoginModal } from "./login-modal";
import TransformLoadingProgress from "./transform-loading-progress";

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
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check user authentication status
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    // Listen for auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      // Close modal when user logs in
      if (session?.user) {
        setShowLoginModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Only autofocus on desktop to prevent mobile scroll issues
    if (textareaRef.current && window.innerWidth >= 1024) {
      textareaRef.current.focus();
    }

    // Add global Enter key handler to focus textarea when out of focus (desktop only)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && textareaRef.current && document.activeElement !== textareaRef.current && window.innerWidth >= 1024) {
        e.preventDefault();
        textareaRef.current.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const examples = [
    "Add a meme caption",
    "Deep fried effect",
    "YouTube thumbnail style",
  ];

  const handleExampleClick = (exampleText: string) => {
    setPrompt(exampleText);
  };

  const handleCancelTransform = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsTransforming(false);
    setError("Transformation cancelled");
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

    // Check authentication before proceeding - trigger modal if not authenticated
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setIsTransforming(true);
    setError(null);
    
    const controller = new AbortController();
    setAbortController(controller);
    
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
        signal: controller.signal,
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

      // Show completion state briefly before redirecting
      setIsCompleted(true);
      
      setTimeout(() => {
        if (onTransformComplete && uploadResult.imageId) {
          onTransformComplete(uploadResult.imageId);
        } else if (uploadResult.imageId) {
          router.push(`/image/${uploadResult.imageId}`);
        }

        setPrompt("");
        setIsTransforming(false);
        setIsCompleted(false);
      }, 800);
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Transform error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setIsTransforming(false);
    } finally {
      setAbortController(null);
    }
  };

  return (
    <div className={`p-3 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Wand2 className="h-5 w-5 text-yellow-600" />
        <h3 className="font-medium">Transform Image</h3>
      </div>

      {/* Examples */}
      <div className="mb-3 flex flex-wrap gap-2">
        {examples.map((example, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleExampleClick(example)}
            disabled={isTransforming}
            className="px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {example}
          </button>
        ))}
      </div>
      
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error.includes('sign in') ? (
              <>
                Please{' '}
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="underline hover:no-underline font-medium"
                >
                  sign in
                </button>
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
          placeholder="Describe your transformation... (e.g., 'Make this a meme by adding a hilarious caption')"
          className="min-h-[60px] resize-none"
          disabled={isTransforming}
        />
        
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!prompt.trim() || isTransforming || !imageUrl}
            size="default"
            className="bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {isTransforming ? "Transforming..." : "Transform"}
          </Button>
        </div>
      </form>
      
      <TransformLoadingProgress
        isVisible={isTransforming}
        onCancel={handleCancelTransform}
        isCompleted={isCompleted}
      />
      
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        redirectUrl={pathname}
      />
    </div>
  );
}