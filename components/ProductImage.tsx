'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ProductImageProps {
  src: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  /**
   * `sizes` for the underlying `next/image`. Provide a media-query-based
   * value at call sites that render the image at a different width per
   * breakpoint (e.g. carousels). Default targets ~50vw on mobile and a
   * 320px tile on desktop, matching the homepage product carousel.
   */
  sizes?: string;
  priority?: boolean;
}

const DEFAULT_SIZES = "(max-width: 768px) 50vw, 320px";

export default function ProductImage({
  src,
  alt,
  className,
  width = 400,
  height = 400,
  sizes = DEFAULT_SIZES,
  priority = false,
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  const handleError = () => {
    if (!imageError) {
      setImageError(true);
      setImageSrc(null);
    }
  };

  if (!imageSrc || imageError) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-primary-100 ${className || ''}`}>
        <i className="bx bx-image text-6xl text-primary-400"></i>
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={handleError}
      unoptimized={imageSrc.startsWith('/uploads/')}
    />
  );
}
