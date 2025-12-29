import React, { useState } from 'react';
import { Loader2, Package } from 'lucide-react';

interface AsyncImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

const AsyncImage: React.FC<AsyncImageProps> = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`bg-slate-100 overflow-hidden relative flex items-center justify-center ${className}`}>
      {!loaded && !error && (
        <Loader2 size={16} className="text-slate-400 animate-spin absolute" />
      )}
      {error && (
        <Package size={20} className="text-slate-300 absolute" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
};

export default AsyncImage;