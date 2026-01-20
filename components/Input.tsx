import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full space-y-2">
      {label && <label className="block text-sm text-gold/80 font-serif tracking-wide ml-1">{label}</label>}
      <input 
        className={`w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all duration-300 ${className}`}
        {...props}
      />
    </div>
  );
};