// Global type declarations

declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.scss' {
  const content: string;
  export default content;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.avif' {
  const content: string;
  export default content;
}

// Environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly NEXT_PUBLIC_SITE_URL: string;
    readonly NEXT_PUBLIC_API_URL?: string;
    readonly DATABASE_URL?: string;
    readonly EMAIL_SERVICE_API_KEY?: string;
    readonly ANALYTICS_ID?: string;
    readonly EMERGENCY_NOTIFICATION_WEBHOOK?: string;
  }
}

// Global app state
declare global {
  interface Window {
    // Analytics
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    
    // Emergency system
    emergencyNotificationSystem?: {
      trigger: (alert: any) => void;
      subscribe: (callback: () => void) => void;
    };
    
    // Accessibility
    accessibilityPreferences?: {
      reducedMotion: boolean;
      highContrast: boolean;
      fontSize: string;
    };
  }
}