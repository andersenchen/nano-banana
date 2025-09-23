import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { imageUrl, prompt } = await request.json();

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: "Image URL and prompt are required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image from URL" },
        { status: 400 }
      );
    }

    // Check Content-Length header first if available
    const contentLength = imageResponse.headers.get('content-length');
    const MAX_SIZE_MB = 10; // 10MB limit
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    if (contentLength && parseInt(contentLength) > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Image size exceeds ${MAX_SIZE_MB}MB limit` },
        { status: 400 }
      );
    }

    // Convert image to base64
    const imageBuffer = await imageResponse.arrayBuffer();

    // Double-check actual size after download
    if (imageBuffer.byteLength > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Image size exceeds ${MAX_SIZE_MB}MB limit` },
        { status: 400 }
      );
    }

    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/png';

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const promptData = [
      { text: `${prompt}\n\nOutput exactly one image.` },
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: promptData,
    });

    if (!response.candidates || !response.candidates[0] || !response.candidates[0].content || !response.candidates[0].content.parts) {
      return NextResponse.json(
        { error: "Invalid response from Gemini API" },
        { status: 500 }
      );
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return NextResponse.json({
          imageData: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png"
        });
      }
    }

    return NextResponse.json(
      { error: "No image generated" },
      { status: 500 }
    );

  } catch (error) {
    console.error("Error generating image:", error);
    
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
      return NextResponse.json(
        { error: `API Error: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}