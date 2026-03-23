import React from 'react';

const ButterflyIcon = ({ className = '', size = 24, color = 'currentColor', strokeWidth = 2 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Left wing */}
    <path d="M12 12C12 12 6 6 3 6C0 6 0 12 3 12C6 12 12 12 12 12Z" />
    <path d="M12 12C12 12 6 18 3 18C0 18 0 12 3 12" />
    {/* Right wing */}
    <path d="M12 12C12 12 18 6 21 6C24 6 24 12 21 12C18 12 12 12 12 12Z" />
    <path d="M12 12C12 12 18 18 21 18C24 18 24 12 21 12" />
    {/* Body */}
    <line x1="12" y1="5" x2="12" y2="19" />
    {/* Antennae */}
    <path d="M10 5C10 5 10 3 8 2" />
    <path d="M14 5C14 5 14 3 16 2" />
  </svg>
);

export default ButterflyIcon;
