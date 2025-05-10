import React from 'react';
import { FaFilm } from 'react-icons/fa';

interface MoviePlaceholderProps {
  title?: string;
  className?: string;
}

const MoviePlaceholder: React.FC<MoviePlaceholderProps> = ({ 
  title, 
  className = '' 
}) => {
  // Generate a deterministic color based on the movie title
  const getColorFromTitle = (title?: string): string => {
    if (!title) return '#1a1a1a'; // Default dark color
    
    // Generate a simple hash from the title
    const hash = title.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Generate dark-ish background colors that look good
    const h = Math.abs(hash) % 360; // 0-359 hue value
    const s = 30 + (Math.abs(hash) % 20); // 30-50% saturation
    const l = 15 + (Math.abs(hash) % 10); // 15-25% lightness (dark)
    
    return `hsl(${h}, ${s}%, ${l}%)`;
  };
  
  // Get initials from the title
  const getInitials = (title?: string): string => {
    if (!title) return '?';
    
    // Get first letters of first two words
    const words = title.split(' ');
    if (words.length === 1) return title.substring(0, 2).toUpperCase();
    
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  };
  
  const backgroundColor = getColorFromTitle(title);
  const initials = getInitials(title);
  
  return (
    <div 
      className={`relative w-full h-full flex flex-col items-center justify-center text-white ${className}`}
      style={{ backgroundColor }}
    >
      <FaFilm className="text-white/30 text-5xl mb-2" />
      {title ? (
        <>
          <div className="text-2xl font-bold mb-1">{initials}</div>
          <div className="text-xs text-center px-2 line-clamp-2 opacity-70">{title}</div>
        </>
      ) : (
        <div className="text-sm font-medium opacity-70">No Image</div>
      )}
    </div>
  );
};

export default MoviePlaceholder; 