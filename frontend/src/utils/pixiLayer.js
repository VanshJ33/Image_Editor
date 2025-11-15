/**
 * pixiLayer.js
 * 
 * Pixi.js application initialization and sprite management.
 * Provides a singleton PIXI.Application instance and sprite management utilities.
 */

import * as PIXI from 'pixi.js';

let pixiApp = null;
let spriteMap = new Map(); // Maps fabric object IDs to PIXI sprites
let isInitialized = false;

/**
 * Initialize Pixi.js application
 * @param {HTMLCanvasElement|HTMLElement} canvasElement - Canvas element or container
 * @param {Object} options - Initialization options
 * @returns {PIXI.Application|null}
 */
export function initPixi(canvasElement, options = {}) {
  if (pixiApp) {
    console.warn('Pixi application already initialized');
    return pixiApp;
  }

  try {
    const {
      width = 1080,
      height = 1080,
      backgroundColor = 0xffffff,
      resolution = window.devicePixelRatio || 1,
      autoDensity = true,
      antialias = true
    } = options;

    // Check WebGL support
    // In Pixi.js v8, we check WebGL support differently
    let webglSupported = false;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      webglSupported = !!gl;
    } catch (e) {
      webglSupported = false;
    }
    
    if (!webglSupported) {
      console.warn('WebGL not supported, falling back to Fabric-only rendering');
      return null;
    }

    // Create Pixi application
    pixiApp = new PIXI.Application({
      width,
      height,
      backgroundColor,
      resolution,
      autoDensity,
      antialias,
      autoStart: true,
      sharedTicker: false
    });

    // If canvasElement is provided, append the view
    if (canvasElement) {
      if (canvasElement instanceof HTMLCanvasElement) {
        // Replace the canvas
        const parent = canvasElement.parentElement;
        if (parent) {
          parent.appendChild(pixiApp.view);
          parent.removeChild(canvasElement);
        }
      } else {
        // Append to container
        canvasElement.appendChild(pixiApp.view);
      }

      // Style the Pixi canvas
      pixiApp.view.style.position = 'absolute';
      pixiApp.view.style.top = '0';
      pixiApp.view.style.left = '0';
      pixiApp.view.style.pointerEvents = 'none';
      pixiApp.view.style.zIndex = '0';
    }

    isInitialized = true;
    console.log('Pixi.js initialized successfully for GPU acceleration');
    
    return pixiApp;
  } catch (error) {
    console.error('Failed to initialize Pixi.js:', error);
    pixiApp = null;
    isInitialized = false;
    return null;
  }
}

/**
 * Get the Pixi application instance
 * @returns {PIXI.Application|null}
 */
export function getPixiApp() {
  return pixiApp;
}

/**
 * Check if Pixi is available and initialized
 * @returns {boolean}
 */
export function isPixiAvailable() {
  return pixiApp !== null && isInitialized;
}

/**
 * Resize Pixi application
 * @param {number} width - New width
 * @param {number} height - New height
 */
export function resizePixi(width, height) {
  if (!pixiApp) return;
  
  try {
    pixiApp.renderer.resize(width, height);
  } catch (error) {
    console.error('Failed to resize Pixi application:', error);
  }
}

/**
 * Add or update a sprite for a Fabric object
 * @param {string} fabricObjectId - Fabric object ID
 * @param {PIXI.Texture|HTMLImageElement|HTMLCanvasElement} source - Texture source
 * @param {Object} options - Sprite options (x, y, scaleX, scaleY, rotation, alpha, visible)
 * @returns {PIXI.Sprite|null}
 */
export function addOrUpdateSprite(fabricObjectId, source, options = {}) {
  if (!pixiApp) {
    return null;
  }

  try {
    let sprite = spriteMap.get(fabricObjectId);
    let texture;

    // Create texture from source
    if (source instanceof PIXI.Texture) {
      texture = source;
    } else {
      texture = PIXI.Texture.from(source);
    }

    if (!sprite) {
      // Create new sprite
      sprite = new PIXI.Sprite(texture);
      pixiApp.stage.addChild(sprite);
      spriteMap.set(fabricObjectId, sprite);
    } else {
      // Update existing sprite texture
      sprite.texture = texture;
    }

    // Apply options
    if (options.x !== undefined) sprite.x = options.x;
    if (options.y !== undefined) sprite.y = options.y;
    if (options.scaleX !== undefined) sprite.scale.x = options.scaleX;
    if (options.scaleY !== undefined) sprite.scale.y = options.scaleY;
    if (options.rotation !== undefined) sprite.rotation = options.rotation;
    if (options.alpha !== undefined) sprite.alpha = options.alpha;
    if (options.visible !== undefined) sprite.visible = options.visible;
    if (options.anchor !== undefined) {
      sprite.anchor.set(options.anchor.x || 0, options.anchor.y || 0);
    }

    return sprite;
  } catch (error) {
    console.error('Failed to add/update sprite:', error);
    return null;
  }
}

/**
 * Get sprite for a Fabric object
 * @param {string} fabricObjectId - Fabric object ID
 * @returns {PIXI.Sprite|null}
 */
export function getSprite(fabricObjectId) {
  return spriteMap.get(fabricObjectId) || null;
}

/**
 * Remove sprite for a Fabric object
 * @param {string} fabricObjectId - Fabric object ID
 */
export function removeSprite(fabricObjectId) {
  const sprite = spriteMap.get(fabricObjectId);
  if (sprite && pixiApp) {
    try {
      pixiApp.stage.removeChild(sprite);
      sprite.destroy({ children: true, texture: true });
      spriteMap.delete(fabricObjectId);
    } catch (error) {
      console.error('Failed to remove sprite:', error);
    }
  }
}

/**
 * Clear all sprites
 */
export function clearSprites() {
  if (!pixiApp) return;

  spriteMap.forEach((sprite) => {
    try {
      pixiApp.stage.removeChild(sprite);
      sprite.destroy({ children: true, texture: true });
    } catch (error) {
      console.error('Failed to clear sprite:', error);
    }
  });

  spriteMap.clear();
}

/**
 * Update sprite position and transform from Fabric object
 * @param {string} fabricObjectId - Fabric object ID
 * @param {Object} fabricObject - Fabric object
 */
export function syncSpriteFromFabric(fabricObjectId, fabricObject) {
  if (!pixiApp || !fabricObject) return;

  const sprite = spriteMap.get(fabricObjectId);
  if (!sprite) return;

  try {
    const bounds = fabricObject.getBoundingRect();
    
    sprite.x = bounds.left;
    sprite.y = bounds.top;
    sprite.scale.x = (fabricObject.scaleX || 1) * (bounds.width / (fabricObject.width || 1));
    sprite.scale.y = (fabricObject.scaleY || 1) * (bounds.height / (fabricObject.height || 1));
    sprite.rotation = (fabricObject.angle || 0) * (Math.PI / 180);
    sprite.alpha = fabricObject.opacity !== undefined ? fabricObject.opacity : 1;
    sprite.visible = fabricObject.visible !== false;
  } catch (error) {
    console.error('Failed to sync sprite from Fabric:', error);
  }
}

/**
 * Destroy Pixi application
 */
export function destroyPixi() {
  if (pixiApp) {
    try {
      clearSprites();
      pixiApp.destroy(true, { children: true, texture: true });
      pixiApp = null;
      isInitialized = false;
      spriteMap.clear();
    } catch (error) {
      console.error('Failed to destroy Pixi application:', error);
    }
  }
}


