/**
 * E2E Test Configuration
 * 
 * This file contains configuration settings for E2E tests.
 * You can also override the BASE_URL using an environment variable:
 * 
 * Example:
 *   TEST_BASE_URL=http://localhost:3000 npm run test:e2e
 */

// Default base URL for the frontend application
export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

// Helper function to build full URLs
export const buildUrl = (path) => {
  const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};
