import React, { useEffect, useState } from 'react';
import { Store } from 'lucide-react';

/**
 * Renders the configured site logo, falling back to a generic (not
 * brand-specific) placeholder icon when no logo is configured or the
 * configured URL fails to load - never a leftover client's artwork.
 */
const SiteLogo = ({ src, alt, className = '', ...rest }) => {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src || errored) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-white/10 rounded ${className}`}
        role="img"
        aria-label={alt}
        {...rest}
      >
        <Store className="w-1/2 h-1/2 text-current" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
};

export default SiteLogo;
