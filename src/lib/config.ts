// Application configuration based on environment
export const isDevelopment = import.meta.env.MODE === 'development';
export const isProduction = import.meta.env.MODE === 'production';

export const config = {
  // Environment detection
  isDevelopment,
  isProduction,
  
  // Authentication settings
  auth: {
    // Use mock authentication only in development
    useMockAuth: isDevelopment && !import.meta.env.VITE_FORCE_REAL_AUTH,
    // Redirect paths
    loginPath: '/login',
    defaultPath: '/',
  },
  
  // UI settings
  ui: {
    showDevBadge: isDevelopment && !import.meta.env.VITE_HIDE_DEV_BADGE,
    enableDebugConsole: isDevelopment,
  },
  
  // Supabase settings
  supabase: {
    enabled: !isDevelopment || import.meta.env.VITE_FORCE_SUPABASE,
  },
} as const;

export default config;