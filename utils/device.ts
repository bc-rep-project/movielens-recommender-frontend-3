/**
 * Device detection utilities for responsive design
 */

// Device size breakpoints (matching Tailwind's default breakpoints)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

/**
 * Check if the current device is mobile based on screen width
 * Note: This function should only be used client-side
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') {
    return false; // Default to desktop on server-side
  }
  return window.innerWidth < breakpoints.md;
}

/**
 * Check if the current device is a tablet based on screen width
 */
export const isTablet = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg;
}

/**
 * Check if the current device is desktop based on screen width
 */
export const isDesktop = (): boolean => {
  if (typeof window === 'undefined') {
    return true; // Default to desktop on server-side
  }
  return window.innerWidth >= breakpoints.lg;
}

/**
 * Get the current device type based on screen width
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const getDeviceType = (): DeviceType => {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
}

/**
 * Custom hook to detect screen size changes
 */
export const useResponsive = () => {
  if (typeof window === 'undefined') {
    // Return default values for server-side rendering
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      deviceType: 'desktop' as DeviceType
    };
  }
  
  // Import hooks properly for TypeScript
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  const { useState, useEffect } = React;
  
  const [deviceType, setDeviceType] = useState(getDeviceType());
  
  useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return {
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    deviceType
  };
}

/**
 * Helper function for getting appropriate image sizes based on device
 * Useful for performance optimization
 */
export const getImageSizeForDevice = (
  deviceType: DeviceType, 
  sizes: { mobile: string; tablet: string; desktop: string }
): string => {
  return sizes[deviceType];
}

/**
 * Convert px value to rem value based on a base font size
 * Useful for consistent spacing calculations
 */
export const pxToRem = (px: number, baseSize = 16): string => {
  return `${px / baseSize}rem`;
} 