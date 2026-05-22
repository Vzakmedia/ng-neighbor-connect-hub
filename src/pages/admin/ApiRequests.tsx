// Re-export the existing ApiRequestsAdmin page content inside the new admin layout.
// The original page had its own full-page layout + back link; here we strip that
// wrapper and render only the content portion by importing the page directly as a
// component — it still has its own internal state and data fetching.
export { default } from '@/pages/ApiRequestsAdmin';
