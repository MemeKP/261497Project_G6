import { IKImage } from 'imagekitio-react';
import type { IKImageWrapperProps } from '../types';
import { useState } from 'react';
import type { Transformation } from '@imagekit/react';

const IKImageWrapper = ({
  src,
  className = '',
  width,
  height,
  alt,
  transformation,
  lqipQuality = 20,
  showPlaceholder = true,
  placeholderClassName = '',
  onLoad,
  onError,
}: IKImageWrapperProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;

  // Validate environment variable
  if (!urlEndpoint) {
    console.error('VITE_IMAGEKIT_URL_ENDPOINT is not defined');
    return showPlaceholder ? (
      <PlaceholderImage 
        className={className} 
        width={width} 
        height={height} 
        alt={alt}
      />
    ) : null;
  }

  // Handle missing or invalid src
  if (!src || typeof src !== 'string' || src.trim() === '') {
    return showPlaceholder ? (
      <PlaceholderImage 
        className={className} 
        width={width} 
        height={height} 
        alt={alt}
      />
    ) : null;
  }

  // Handle error state
  if (imageError) {
    return showPlaceholder ? (
      <PlaceholderImage 
        className={className} 
        width={width} 
        height={height} 
        alt={alt}
      />
    ) : null;
  }

  const defaultTransformation = (transformation || [
  {
    width: width ? String(width) : undefined,
    height: height ? String(height) : undefined,
    quality: '80', 
    format: 'auto',
  },
]) as Transformation[];

  const handleLoad = () => {
    setImageLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    setImageLoading(false);
    onError?.();
  };

  return (
    <div className="relative inline-block">
      {/* Loading skeleton */}
      {imageLoading && (
        <div
          className={`absolute inset-0 bg-gray-300 animate-pulse ${placeholderClassName}`}
          style={{ width, height }}
        />
      )}

      <IKImage
        urlEndpoint={urlEndpoint}
        path={src}
        className={`${className} ${imageLoading ? 'invisible' : 'visible'}`}
        loading="lazy"
        lqip={{ active: true, quality: lqipQuality }}
        alt={alt}
        width={width}
        height={height}
        transformation={defaultTransformation}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

// Placeholder component
const PlaceholderImage = ({
  className,
  width,
  height,
  alt,
}: {
  className?: string;
  width?: number | string;
  height?: number | string;
  alt: string;
}) => {
  return (
    <div
      className={`flex items-center justify-center bg-gray-200 ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || '100%',
        minHeight: height || '200px',
      }}
      role="img"
      aria-label={alt}
    >
      <svg
        className="w-12 h-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
};

export default IKImageWrapper;