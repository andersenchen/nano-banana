import { createClient } from "@/lib/supabase/client";

export interface UploadImageResult {
  success: boolean;
  imageId?: string;
  error?: string;
}

export async function uploadImageToSupabase(
  imageBase64: string, 
  mimeType: string = "image/png"
): Promise<UploadImageResult> {
  try {
    const supabase = createClient();
    
    const byteCharacters = atob(imageBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    const fileExtension = mimeType.split('/')[1] || 'png';
    const fileName = `transformed_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
    
    const { data, error } = await supabase.storage
      .from("public-images")
      .upload(fileName, blob, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading image:", error);
      return { success: false, error: error.message };
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (user && data.id) {
      const { error: dbError } = await supabase
        .from("images")
        .insert({
          id: data.id,
          user_id: user.id,
          name: fileName,
        });

      if (dbError) {
        console.error("Error inserting image metadata:", dbError);
        await supabase.storage.from("public-images").remove([fileName]);
        return { success: false, error: `Failed to save image metadata: ${dbError.message}` };
      }
    }

    return { success: true, imageId: data.id };
  } catch (error) {
    console.error("Error in uploadImageToSupabase:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}