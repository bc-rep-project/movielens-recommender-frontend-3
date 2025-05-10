import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <span className="text-2xl font-extrabold tracking-tighter text-red-600">
        NETFLIXLENS
      </span>
    </div>
  );
};

export default Logo; 