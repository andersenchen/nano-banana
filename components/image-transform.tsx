"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { uploadImageToSupabase, type VisibilityType } from "@/lib/supabase/upload-image";
import { useImageRefresh } from "@/lib/context/image-refresh-context";
import { transformPrompts } from "@/lib/transform-prompts";
import { LoginModal } from "./login-modal";
import TransformLoadingProgress from "./transform-loading-progress";
import { VisibilitySelector } from "@/components/visibility-selector";

interface ImageTransformProps {
  className?: string;
  imageUrl?: string;
  imageId?: string;
  onTransformComplete?: (newImageId: string) => void;
}

export default function ImageTransform({
  className = "",
  imageUrl,
  imageId,
  onTransformComplete
}: ImageTransformProps) {
  const [prompt, setPrompt] = useState("");
  const [isTransforming, setIsTransforming] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [visibility, setVisibility] = useState<VisibilityType>(() => {
    // Load saved preference from localStorage, default to "unlisted"
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('transformVisibility');
      if (saved === 'public' || saved === 'unlisted' || saved === 'private') {
        return saved;
      }
    }
    return "unlisted";
  });
  const { triggerRefresh } = useImageRefresh();
  const [pendingTransform, setPendingTransform] = useState<{ prompt: string; imageUrl: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Persist visibility preference
  useEffect(() => {
    localStorage.setItem('transformVisibility', visibility);
  }, [visibility]);

  useEffect(() => {
    // Check user authentication status first
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // After setting user, immediately check for pending transform
      if (user) {
        const storedTransform = localStorage.getItem('pendingTransform');
        if (storedTransform) {
          try {
            const parsed = JSON.parse(storedTransform);
            // Only restore if it's for the same image
            if (parsed.imageUrl === imageUrl) {
              setPendingTransform(parsed);
              // Immediately set the prompt so it's visible
              setPrompt(parsed.prompt);
            } else {
              // Clear if it's for a different image
              localStorage.removeItem('pendingTransform');
            }
          } catch {
            localStorage.removeItem('pendingTransform');
          }
        }
      }
    };

    checkUser();

    // Listen for auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      // Close modal when user logs in
      if (session?.user) {
        setShowLoginModal(false);

        // Clear pending transform - will be handled in a separate effect

      }
    });

    return () => subscription.unsubscribe();
  }, [imageUrl]);

  // Handle pending transform after user logs in
  useEffect(() => {
    if (user && pendingTransform && !isTransforming && imageUrl === pendingTransform.imageUrl) {
      // Auto-trigger the transformation immediately
      // Clear from localStorage first
      localStorage.removeItem('pendingTransform');
      setPendingTransform(null);

      // Use requestAnimationFrame for next paint instead of setTimeout
      requestAnimationFrame(() => {
        // Trigger the form submission using the ref
        if (formRef.current) {
          formRef.current.requestSubmit();
        }
      });
    }
  }, [user, pendingTransform, isTransforming, imageUrl]);

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

  // Use useMemo to ensure consistent prompts between server and client
  const examples = useMemo(() => {
    // Use a deterministic selection based on pathname or imageUrl to avoid hydration issues
    const seed = imageUrl ? imageUrl.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const startIndex = seed % (transformPrompts.length - 4);
    return transformPrompts.slice(startIndex, startIndex + 4);
  }, [imageUrl]);

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

  const handleTransform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    if (!imageUrl) {
      setError("No image available to transform");
      return;
    }

    // Check authentication before proceeding - trigger modal if not authenticated
    if (!user) {
      // Store the pending transformation data
      const pendingData = { prompt: prompt.trim(), imageUrl: imageUrl || '' };
      setPendingTransform(pendingData);
      // Also store in localStorage to persist across OAuth redirect
      localStorage.setItem('pendingTransform', JSON.stringify(pendingData));
      setShowLoginModal(true);
      return;
    }

    setIsTransforming(true);
    setError(null);

    // Scroll progress bar into view on mobile immediately
    requestAnimationFrame(() => {
      if (progressRef.current && window.innerWidth < 1024) {
        progressRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    });
    
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch('/api/transform-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          prompt: prompt.trim(),
          sourceImageId: imageId,
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

      const uploadResult = await uploadImageToSupabase(
        imageData,
        mimeType,
        visibility,
        imageId,  // source image ID
        prompt.trim()  // transformation prompt
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to save transformed image');
      }

      // Show completion state briefly before redirecting
      setIsCompleted(true);
      triggerRefresh();
      
      // Clear any pending transform from localStorage on success
      localStorage.removeItem('pendingTransform');

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
      
      <form ref={formRef} onSubmit={handleTransform} className="space-y-3">
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

        <div>
          <VisibilitySelector
            value={visibility}
            onChange={setVisibility}
            disabled={isTransforming}
            label="Visibility for transformed image"
          />
        </div>

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
      
      <div ref={progressRef}>
        <TransformLoadingProgress
          isVisible={isTransforming}
          onCancel={handleCancelTransform}
          isCompleted={isCompleted}
        />
      </div>
      
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          // Clear pending transform if user closes modal without logging in
          setPendingTransform(null);
          localStorage.removeItem('pendingTransform');
        }}
        redirectUrl={pathname}
      />
    </div>
  );
}