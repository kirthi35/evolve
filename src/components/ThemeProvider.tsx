import React, { useEffect } from 'react';

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Get saved theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const root = document.documentElement;
    
    if (savedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
      root.classList.toggle('light', systemTheme === 'light');
    } else {
      root.classList.toggle('dark', savedTheme === 'dark');
      root.classList.toggle('light', savedTheme === 'light');
    }
  }, []);

  return <>{children}</>;
};

export default ThemeProvider;
