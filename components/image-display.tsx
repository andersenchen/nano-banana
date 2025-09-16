import Image from 'next/image';

interface ImageDisplayProps {
  imageUrl: string;
  imageName: string;
  className?: string;
}

export default function ImageDisplay({
  imageUrl,
  imageName,
  className
}: ImageDisplayProps) {
  const defaultClassName = "w-full h-full object-contain";

  return (
    <div className="bg-black relative h-full flex items-center justify-center">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={imageName || "Detail view"}
          width={1024}
          height={1024}
          className={className || defaultClassName}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
        />
      ) : (
        <div className="text-white/70 text-muted-foreground">Image not found</div>
      )}
    </div>
  );
}