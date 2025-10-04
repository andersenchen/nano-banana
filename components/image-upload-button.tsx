"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X } from "lucide-react";
import { uploadImageToSupabase, type VisibilityType } from "@/lib/supabase/upload-image";
import { useImageRefresh } from "@/lib/image-refresh-context";
import { VisibilitySelector } from "@/components/visibility-selector";

interface StagedFile {
  file: File;
  preview: string;
  name: string;
  id: string;
}

export function ImageUploadButton() {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<VisibilityType>("public");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const { triggerRefresh } = useImageRefresh();

  const stageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Check file size (10MB limit)
    const MAX_SIZE_MB = 10;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      alert(`${file.name} exceeds ${MAX_SIZE_MB}MB size limit`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      const id = Math.random().toString(36).substring(7);

      setStagedFiles(prev => [...prev, {
        file,
        preview,
        name: file.name,
        id
      }]);
    };
    reader.readAsDataURL(file);
  };

  const uploadStagedFiles = async () => {
    if (stagedFiles.length === 0) return;

    setUploading(true);
    const filesToUpload = [...stagedFiles];
    setUploadingFiles(filesToUpload.map(f => f.id));
    setStagedFiles([]);

    for (const stagedFile of filesToUpload) {
      try {
        const base64Data = stagedFile.preview.split(",")[1];
        const result = await uploadImageToSupabase(base64Data, stagedFile.file.type, visibility);

        if (result.success) {
          setUploadingFiles(prev => prev.filter(id => id !== stagedFile.id));
        } else {
          alert(`Upload failed for ${stagedFile.name}: ${result.error}`);
          setUploadingFiles(prev => prev.filter(id => id !== stagedFile.id));
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        alert(`Failed to upload ${stagedFile.name}`);
        setUploadingFiles(prev => prev.filter(id => id !== stagedFile.id));
      }
    }

    triggerRefresh();
    setUploading(false);
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Use staging area for button clicks to show visibility selector
    for (let i = 0; i < files.length; i++) {
      stageFile(files[i]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        const item = e.dataTransfer.items[0];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          setIsDragging(true);
        }
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter.current = 0;

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith('image/')) {
            stageFile(file);
          }
        }
      }
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        variant="outline"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading..." : "Upload New Image"}
      </Button>

      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl border-2 border-dashed border-gray-400 dark:border-gray-600">
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-600 dark:text-gray-400" />
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              Drop your image here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Release to upload
            </p>
          </div>
        </div>
      )}

      {/* Staging area modal */}
      {stagedFiles.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setStagedFiles([])}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-[90%] max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Ready to upload {stagedFiles.length} {stagedFiles.length === 1 ? 'image' : 'images'}
              </h2>
              <button
                onClick={() => setStagedFiles([])}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto mb-4 p-2">
              {stagedFiles.map((file) => (
                <div key={file.id} className="relative group">
                  <Image
                    src={file.preview}
                    alt={file.name}
                    width={112}
                    height={112}
                    className="w-full h-24 md:h-28 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                  <button
                    onClick={() => removeStagedFile(file.id)}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate px-1">{file.name}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visibility
              </label>
              <VisibilitySelector
                value={visibility}
                onChange={setVisibility}
                disabled={uploading}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStagedFiles([])}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={uploadStagedFiles}
                disabled={uploading}
                className="flex-1"
                variant="default"
              >
                <Upload className="h-4 w-4 mr-2" />
                {stagedFiles.length === 1 ? 'Upload Image' : 'Upload All'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload progress indicator */}
      {uploadingFiles.length > 0 && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Uploading {uploadingFiles.length} {uploadingFiles.length === 1 ? 'image' : 'images'}...
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}