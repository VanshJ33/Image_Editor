/**
 * fabricPixiSync.js
 * 
 * Real-time synchronization between Fabric.js and Pixi.js layers.
 * Handles filter synchronization, object updates, and event coordination.
 */

// import * as PIXI from 'pixi.js';
// import { ColorMatrixFilter, BlurFilter } from 'pixi.js';
// import { getPixiApp, getSprite, addOrUpdateSprite, syncSpriteFromFabric } from './pixiLayer';

/**
 * Generate or get ID for a Fabric object
 * @param {fabric.Object} fabricObject - Fabric object
 * @returns {string} Object ID
 */
function getOrCreateObjectId(fabricObject) {
  if (fabricObject.id) {
    return fabricObject.id;
  }
  if (fabricObject._id) {
    return fabricObject._id;
  }
  // Generate a unique ID if none exists
  const newId = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  fabricObject.id = newId;
  return newId;
}

export function syncFiltersToPixi(fabricObject, pixiAppOverride = null) {
  // PixiJS disabled - using Fabric-only rendering
  return;

  try {
    const fabricObjectId = getOrCreateObjectId(fabricObject);

    let sprite = getSprite(fabricObjectId);
    
    // If sprite doesn't exist, try to create it from the image element
    if (!sprite) {
      const imgElement = fabricObject.getElement();
      if (imgElement) {
        sprite = addOrUpdateSprite(fabricObjectId, imgElement, {
          x: fabricObject.left || 0,
          y: fabricObject.top || 0,
          scaleX: fabricObject.scaleX || 1,
          scaleY: fabricObject.scaleY || 1,
          rotation: (fabricObject.angle || 0) * (Math.PI / 180),
          alpha: fabricObject.opacity !== undefined ? fabricObject.opacity : 1,
          visible: fabricObject.visible !== false
        });
      } else {
        return; // Can't create sprite without image element
      }
    }

    if (!sprite) {
      return;
    }

    // Clear existing filters
    sprite.filters = [];

    // Apply Pixi filters based on Fabric filters
    if (fabricObject.filters && Array.isArray(fabricObject.filters)) {
      fabricObject.filters.forEach((fabricFilter) => {
        const filterName = fabricFilter.constructor.name;
        let pixiFilter = null;

        switch (filterName) {
          case 'Brightness':
            // Brightness filter using ColorMatrixFilter
            const brightnessValue = fabricFilter.brightness || 0;
            pixiFilter = new ColorMatrixFilter();
            pixiFilter.brightness(brightnessValue, false);
            break;

          case 'Contrast':
            // Contrast filter using ColorMatrixFilter
            const contrastValue = fabricFilter.contrast || 0;
            pixiFilter = new ColorMatrixFilter();
            pixiFilter.contrast(contrastValue, false);
            break;

          case 'Saturation':
            // Saturation filter using ColorMatrixFilter
            const saturationValue = fabricFilter.saturation || 0;
            pixiFilter = new ColorMatrixFilter();
            pixiFilter.saturate(saturationValue, false);
            break;

          case 'Blur':
            // Blur filter
            const blurValue = fabricFilter.blur || 0;
            // Convert Fabric blur (0-1) to Pixi blur (pixels)
            const pixiBlur = blurValue * 10; // Scale factor
            pixiFilter = new BlurFilter({ strength: pixiBlur });
            break;

          case 'Sepia':
            // Sepia filter using ColorMatrixFilter
            pixiFilter = new ColorMatrixFilter();
            pixiFilter.sepia(false);
            break;

          case 'BlackWhite':
          case 'Grayscale':
            // Grayscale filter using ColorMatrixFilter
            pixiFilter = new ColorMatrixFilter();
            pixiFilter.greyscale(0.3, false); // 0.3 is a good default
            break;

          default:
            // Unknown filter type, skip
            console.debug(`Filter type ${filterName} not mapped to Pixi, using Fabric-only`);
            break;
        }

        if (pixiFilter) {
          sprite.filters.push(pixiFilter);
        }
      });
    }

    // Update sprite transform to match Fabric object
    syncSpriteFromFabric(fabricObjectId, fabricObject);
  } catch (error) {
    console.warn('Failed to sync filters to Pixi:', error);
    // Fallback: continue with Fabric-only rendering
  }
}

/**
 * Setup Fabric-Pixi synchronization
 * @param {fabric.Canvas} fabricCanvas - Fabric canvas instance
 */
export function setupFabricPixiSync(fabricCanvas) {
  // PixiJS disabled - using Fabric-only rendering
  return;

  try {
    // Sync on object added
    fabricCanvas.on('object:added', (e) => {
      const obj = e.target;
      if (obj && obj.type === 'image') {
        const imgElement = obj.getElement();
        if (imgElement) {
          const fabricObjectId = getOrCreateObjectId(obj);
          addOrUpdateSprite(fabricObjectId, imgElement, {
            x: obj.left || 0,
            y: obj.top || 0,
            scaleX: obj.scaleX || 1,
            scaleY: obj.scaleY || 1,
            rotation: (obj.angle || 0) * (Math.PI / 180),
            alpha: obj.opacity !== undefined ? obj.opacity : 1,
            visible: obj.visible !== false
          });
        }
      }
    });

    // Sync on object removed
    fabricCanvas.on('object:removed', (e) => {
      const obj = e.target;
      if (obj && obj.type === 'image') {
        const fabricObjectId = obj.id || obj._id;
        if (fabricObjectId) {
          // Import at top level to avoid circular dependency
          const pixiLayer = require('./pixiLayer');
          pixiLayer.removeSprite(fabricObjectId);
        }
      }
    });

    // Sync on object modified (moved, resized, rotated)
    fabricCanvas.on('object:modified', (e) => {
      const obj = e.target;
      if (obj && obj.type === 'image') {
        const fabricObjectId = getOrCreateObjectId(obj);
        syncSpriteFromFabric(fabricObjectId, obj);
      }
    });

    // Sync on object moved
    fabricCanvas.on('object:moving', (e) => {
      const obj = e.target;
      if (obj && obj.type === 'image') {
        const fabricObjectId = getOrCreateObjectId(obj);
        syncSpriteFromFabric(fabricObjectId, obj);
      }
    });

    // Sync on object scaled
    fabricCanvas.on('object:scaling', (e) => {
      const obj = e.target;
      if (obj && obj.type === 'image') {
        const fabricObjectId = getOrCreateObjectId(obj);
        syncSpriteFromFabric(fabricObjectId, obj);
      }
    });

    // Sync on object rotated
    fabricCanvas.on('object:rotating', (e) => {
      const obj = e.target;
      if (obj && obj.type === 'image') {
        const fabricObjectId = getOrCreateObjectId(obj);
        syncSpriteFromFabric(fabricObjectId, obj);
      }
    });

    console.log('Fabric-Pixi synchronization setup complete');
  } catch (error) {
    console.error('Failed to setup Fabric-Pixi sync:', error);
  }
}


