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

  if (!src || typeof src !== 'string' || src.trim() === '') {
    console.warn('Invalid src provided:', src);
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
    console.warn('Image error state for src:', src);
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
    width: width ? String(Number(width) * 3) : undefined,
    height: height ? String(Number(height) * 3) : undefined,
    quality: '90',  // ไม่ใช้ 100 กันไฟล์ใหญ่เกิน
    format: 'auto',
  },
]) as Transformation[];


  const handleLoad = () => {
    console.log('Image loaded successfully:', src);
    setImageLoading(false);
    onLoad?.();
  };

  const handleError = (error: string) => {
    console.error('Image load error:', error, 'for src:', src);
    setImageError(true);
    setImageLoading(false);
    onError?.();
  };

  const cleanImageUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.origin}${urlObj.pathname}`;
    } catch (error) {
      console.log("cannot get path:", error)
      return url;
    }
  };

  const isFullUrl = src.startsWith('http');
  const cleanSrc = isFullUrl ? cleanImageUrl(src) : src;

  return (
  
    <div className={` ${className} `}>
      {imageLoading && (
        <div
          className={`${placeholderClassName}`}
          style={{ width: width || '100%', height: height || '100%' }}
        />
      )}

      <div className={imageLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
        {isFullUrl ? (
          <IKImage
            urlEndpoint={urlEndpoint}
            src={cleanSrc}
            loading="lazy"
            lqip={{ active: true, quality: lqipQuality }}
            alt={alt || 'Menu item image'}
            width={width}
            height={height}
            transformation={defaultTransformation}
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : (
          <IKImage
            urlEndpoint={urlEndpoint}
            path={cleanSrc}
            loading="lazy"
            lqip={{ active: true, quality: lqipQuality }}
            alt={alt || 'Menu item image'}
            width={width}
            height={height}
            transformation={defaultTransformation}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
};

const PlaceholderImage = ({
  className = '',
  width,
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
        // height: height || '100%',
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