import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

injectSpeedInsights();

// Enforce consistent URL strategy across all routes
export const trailingSlash = 'never';
