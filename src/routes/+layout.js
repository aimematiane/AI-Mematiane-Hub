import { dev } from '$app/environment';
import { injectAnalytics } from '@vercel/analytics/sveltekit';

// Initialize Vercel Web Analytics
injectAnalytics({ mode: dev ? 'development' : 'production' });

// Enforce consistent URL strategy across all routes
export const trailingSlash = 'never';
