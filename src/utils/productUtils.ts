const RECENTLY_ADDED_MS = 7 * 24 * 60 * 60 * 1000;

export const DEFAULT_PRODUCT_IMAGE = '/default-image.webp';

export function isRecentlyAdded(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() <= RECENTLY_ADDED_MS;
}