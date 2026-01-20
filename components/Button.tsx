import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, ...props }) => {
  const baseStyles = "w-full py-4 px-6 rounded-xl font-serif font-semibold tracking-wider transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-gold to-gold-dim text-void shadow-[0_0_15px_rgba(244,224,185,0.3)] hover:shadow-[0_0_25px_rgba(244,224,185,0.5)]",
    secondary: "border border-gold/30 text-gold hover:bg-gold/10 backdrop-blur-sm",
    ghost: "text-gray-400 hover:text-white"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};