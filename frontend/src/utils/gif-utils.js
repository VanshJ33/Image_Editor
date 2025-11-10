/**
 * Utility functions for handling animated GIFs in Fabric.js canvas
 */
import * as fabric from 'fabric';

/**
 * Creates a Fabric.js image object that preserves GIF animation
 * @param {string} gifUrl - URL of the GIF
 * @param {Object} options - Additional options for the image
 * @returns {Promise<fabric.Image>} - Promise that resolves to a Fabric image
 */
export const createAnimatedGifImage = (gifUrl, options = {}) => {
  return new Promise((resolve, reject) => {
    const imgElement = document.createElement('img');
    imgElement.crossOrigin = 'anonymous';
    
    imgElement.onload = async () => {
      try {
        const { FabricImage } = await import('fabric');
        const fabricImg = new FabricImage(imgElement, {
          ...options,
          isGif: true,
          gifUrl: gifUrl
        });
        
        // Store original src for refresh purposes
        fabricImg._originalSrc = gifUrl;
        
        resolve(fabricImg);
      } catch (error) {
        reject(error);
      }
    };
    
    imgElement.onerror = (error) => {
      reject(new Error(`Failed to load GIF: ${gifUrl}`));
    };
    
    imgElement.src = gifUrl;
  });
};

/**
 * Refreshes a GIF image to maintain animation
 * @param {fabric.Image} fabricImg - The Fabric image object
 */
export const refreshGifAnimation = (fabricImg) => {
  if (!fabricImg.isGif || !fabricImg.getElement) return;
  
  const imgElement = fabricImg.getElement();
  if (!imgElement || !imgElement.src) return;
  
  // Force refresh by temporarily clearing and resetting src
  const originalSrc = fabricImg._originalSrc || imgElement.src;
  imgElement.src = '';
  
  // Use requestAnimationFrame for smooth refresh
  requestAnimationFrame(() => {
    imgElement.src = originalSrc;
    fabricImg.dirty = true;
  });
};

/**
 * Sets up automatic GIF refresh for a canvas
 * @param {fabric.Canvas} canvas - The Fabric canvas
 * @returns {number} - Interval ID for cleanup
 */
export const setupGifAutoRefresh = (canvas) => {
  return setInterval(() => {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    let hasGifs = false;
    
    objects.forEach(obj => {
      if (obj.isGif) {
        hasGifs = true;
        refreshGifAnimation(obj);
      }
    });
    
    if (hasGifs) {
      canvas.renderAll();
    }
  }, 100); // 100ms for smooth animation
};

/**
 * Checks if a URL points to a GIF file
 * @param {string} url - URL to check
 * @returns {boolean} - True if URL appears to be a GIF
 */
export const isGifUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  // Check file extension
  if (url.toLowerCase().includes('.gif')) return true;
  
  // Check for common GIF indicators in URL
  const gifIndicators = ['gif', 'giphy', 'tenor'];
  return gifIndicators.some(indicator => 
    url.toLowerCase().includes(indicator)
  );
};

/**
 * Optimizes GIF loading by preloading the image
 * @param {string} gifUrl - URL of the GIF to preload
 * @returns {Promise<HTMLImageElement>} - Promise that resolves to loaded image element
 */
export const preloadGif = (gifUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to preload GIF: ${gifUrl}`));
    
    img.src = gifUrl;
  });
};

/**
 * Creates a GIF-aware image loader that handles both static and animated images
 * @param {string} imageUrl - URL of the image
 * @param {Object} options - Options for the image
 * @returns {Promise<fabric.Image>} - Promise that resolves to a Fabric image
 */
export const createSmartImage = async (imageUrl, options = {}) => {
  if (isGifUrl(imageUrl)) {
    return createAnimatedGifImage(imageUrl, options);
  } else {
    // For static images, use standard Fabric.js method
    const { FabricImage } = await import('fabric');
    return FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous', ...options });
  }
};