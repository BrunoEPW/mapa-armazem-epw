// UUID utilities for consistent ID generation
import { v5 as uuidv5 } from 'uuid';

// Namespace UUID for EPW products (generated once for consistency)
const EPW_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Generates a consistent UUID from an API product ID
 * Same API ID will always generate the same UUID
 */
export const generateProductUUID = (apiId: string): string => {
  // Use UUID v5 to generate deterministic UUIDs
  return uuidv5(`epw-product-${apiId}`, EPW_NAMESPACE);
};

/**
 * Validates if a string is a valid UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Ensures a product ID is a valid UUID
 * If not valid, generates a consistent UUID from the original ID
 */
export const ensureValidProductId = (productId: string): string => {
  if (isValidUUID(productId)) {
    return productId;
  }
  return generateProductUUID(productId);
};