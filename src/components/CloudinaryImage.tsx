'use client';

import Image from 'next/image';
import { getOptimizedImageUrl } from '@/utils/cloudinary';

interface CloudinaryImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  quality?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill';
}

/**
 * Component to display optimized Cloudinary images
 * Automatically handles URL transformation and optimization
 */
export default function CloudinaryImage({
  src,
  alt,
  width,
  height,
  fill,
  quality = 'auto',
  className = '',
  sizes,
  priority = false,
  objectFit = 'contain'
}: CloudinaryImageProps) {
  // Get optimized URL from Cloudinary
  const optimizedSrc = getOptimizedImageUrl(src, width, height, quality);

  // If using fill, we need to use objectFit in className
  if (fill) {
    const objectClass = objectFit === 'cover' ? 'object-cover' : 'object-contain';
    return (
      <Image
        src={optimizedSrc}
        alt={alt}
        fill
        className={`${objectClass} ${className}`}
        sizes={sizes}
        priority={priority}
      />
    );
  }

  // If specific dimensions are provided
  if (width && height) {
    const objectClass = objectFit === 'cover' ? 'object-cover' : 'object-contain';
    return (
      <Image
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${objectClass} ${className}`}
        priority={priority}
      />
    );
  }

  // Default fallback
  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      className={className}
      priority={priority}
      width={800}
      height={600}
    />
  );
}
