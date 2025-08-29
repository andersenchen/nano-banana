import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ImageDetailClient from "./client";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

async function getImageData(uuid: string) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.storage
      .from("public-images")
      .list("", { 
        limit: 100,
        sortBy: { column: "created_at", order: "desc" }
      });

    if (error) throw error;

    const imageFiles = data?.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
    ) || [];

    const imageFile = imageFiles.find(file => file.id === uuid);

    if (!imageFile) {
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("public-images")
      .getPublicUrl(imageFile.name);
    
    return {
      imageUrl: urlData.publicUrl,
      imageName: imageFile.name,
    };
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { uuid } = await params;
  const imageData = await getImageData(uuid);
  
  if (!imageData) {
    return {
      title: "Image Not Found",
    };
  }

  const { imageUrl, imageName } = imageData;
  const pageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/image/${uuid}`;
  
  return {
    title: imageName,
    description: `View and interact with ${imageName}`,
    openGraph: {
      title: imageName,
      description: `View and interact with ${imageName}`,
      url: pageUrl,
      siteName: "Image Gallery",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageName,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: imageName,
      description: `View and interact with ${imageName}`,
      images: [imageUrl],
    },
  };
}

export default async function ImageDetailPage({ params }: PageProps) {
  const { uuid } = await params;
  const imageData = await getImageData(uuid);

  if (!imageData) {
    notFound();
  }

  const { imageUrl, imageName } = imageData;

  return <ImageDetailClient uuid={uuid} imageUrl={imageUrl} imageName={imageName} />;
}