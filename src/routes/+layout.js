import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

// Inject Vercel Speed Insights
injectSpeedInsights();

// Enforce consistent URL strategy across all routes
export const trailingSlash = 'never';
