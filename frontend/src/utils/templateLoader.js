/**
 * templateLoader.js
 * 
 * Unified asset loader that handles loading images, templates, and other resources.
 * Returns both PIXI.Texture for Pixi rendering and HTMLImageElement for Fabric use.
 * 
 * Handles CORS, caching, and error recovery.
 */

import * as PIXI from 'pixi.js';

const textureCache = new Map(); // Cache PIXI textures
const imageCache = new Map(); // Cache HTMLImageElement instances

/**
 * Load an image and return both PIXI texture and HTMLImageElement
 * @param {string} url - Image URL
 * @param {Object} options - Loading options
 * @returns {Promise<{texture: PIXI.Texture, image: HTMLImageElement}>}
 */
export async function loadImage(url, options = {}) {
  const { crossOrigin = 'anonymous', useCache = true } = options;

  // Check cache first
  if (useCache && textureCache.has(url) && imageCache.has(url)) {
    return {
      texture: textureCache.get(url),
      image: imageCache.get(url)
    };
  }

  return new Promise((resolve, reject) => {
    try {
      // Create HTMLImageElement
      const img = new Image();
      img.crossOrigin = crossOrigin;

      img.onload = () => {
        try {
          // Create PIXI texture
          const texture = PIXI.Texture.from(img);

          // Cache results
          if (useCache) {
            textureCache.set(url, texture);
            imageCache.set(url, img);
          }

          resolve({ texture, image: img });
        } catch (error) {
          console.error('Failed to create PIXI texture:', error);
          reject(error);
        }
      };

      img.onerror = (error) => {
        console.error('Failed to load image:', url, error);
        // Try fallback or return error
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Load multiple images in parallel
 * @param {string[]} urls - Array of image URLs
 * @param {Object} options - Loading options
 * @returns {Promise<Array<{texture: PIXI.Texture, image: HTMLImageElement}>>}
 */
export async function loadImages(urls, options = {}) {
  try {
    const promises = urls.map(url => loadImage(url, options));
    return await Promise.all(promises);
  } catch (error) {
    console.error('Failed to load images:', error);
    throw error;
  }
}

/**
 * Load image with retry logic
 * @param {string} url - Image URL
 * @param {number} maxRetries - Maximum number of retries
 * @param {Object} options - Loading options
 * @returns {Promise<{texture: PIXI.Texture, image: HTMLImageElement}>}
 */
export async function loadImageWithRetry(url, maxRetries = 3, options = {}) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await loadImage(url, options);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError || new Error('Failed to load image after retries');
}

/**
 * Clear texture and image cache
 * @param {string} url - Optional URL to clear specific entry
 */
export function clearCache(url = null) {
  if (url) {
    const texture = textureCache.get(url);
    if (texture) {
      texture.destroy(true);
    }
    textureCache.delete(url);
    imageCache.delete(url);
  } else {
    // Clear all
    textureCache.forEach(texture => {
      texture.destroy(true);
    });
    textureCache.clear();
    imageCache.clear();
  }
}

/**
 * Get cached texture
 * @param {string} url - Image URL
 * @returns {PIXI.Texture|null}
 */
export function getCachedTexture(url) {
  return textureCache.get(url) || null;
}

/**
 * Get cached image
 * @param {string} url - Image URL
 * @returns {HTMLImageElement|null}
 */
export function getCachedImage(url) {
  return imageCache.get(url) || null;
}

/**
 * Preload images for better performance
 * @param {string[]} urls - Array of image URLs to preload
 * @param {Object} options - Loading options
 * @returns {Promise<void>}
 */
export async function preloadImages(urls, options = {}) {
  try {
    await loadImages(urls, { ...options, useCache: true });
    console.log(`Preloaded ${urls.length} images`);
  } catch (error) {
    console.warn('Some images failed to preload:', error);
  }
}

