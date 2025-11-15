/**
 * rasterizer.js
 * 
 * Utility to convert Fabric.js objects/groups to Pixi.js textures.
 * Used when GPU-only composite rendering is needed.
 * 
 * Creates offscreen canvas, renders Fabric objects, and produces PIXI.Texture.
 */

import * as PIXI from 'pixi.js';
import { Canvas as FabricCanvas } from 'fabric';

/**
 * Rasterize a Fabric object to a PIXI texture
 * @param {fabric.Object} fabricObject - Fabric object to rasterize
 * @param {Object} options - Rasterization options
 * @returns {Promise<PIXI.Texture>}
 */
export async function rasterizeFabricObject(fabricObject, options = {}) {
  if (!fabricObject) {
    throw new Error('Fabric object is required');
  }

  try {
    const {
      scale = 1,
      backgroundColor = '#ffffff',
      devicePixelRatio = window.devicePixelRatio || 1
    } = options;

    // Get object bounds
    const bounds = fabricObject.getBoundingRect();
    const width = Math.ceil(bounds.width * scale * devicePixelRatio);
    const height = Math.ceil(bounds.height * scale * devicePixelRatio);

    // Create offscreen canvas
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get 2D context');
    }

    // Scale context for high DPI
    ctx.scale(devicePixelRatio * scale, devicePixelRatio * scale);

    // Set background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, bounds.width, bounds.height);

    // Create temporary Fabric canvas for rendering
    const tempCanvas = new FabricCanvas(offscreenCanvas, {
      width: bounds.width,
      height: bounds.height,
      backgroundColor: backgroundColor,
      renderOnAddRemove: false
    });

    // Clone object to avoid modifying original
    const cloned = await fabricObject.clone();
    
    // Adjust position relative to bounds
    cloned.set({
      left: cloned.left - bounds.left,
      top: cloned.top - bounds.top
    });

    // Add to temp canvas and render
    tempCanvas.add(cloned);
    tempCanvas.renderAll();

    // Create PIXI texture from canvas
    const texture = PIXI.Texture.from(offscreenCanvas);

    // Cleanup
    tempCanvas.dispose();

    return texture;
  } catch (error) {
    console.error('Failed to rasterize Fabric object:', error);
    throw error;
  }
}

/**
 * Rasterize a Fabric group to a PIXI texture
 * @param {fabric.Group} fabricGroup - Fabric group to rasterize
 * @param {Object} options - Rasterization options
 * @returns {Promise<PIXI.Texture>}
 */
export async function rasterizeFabricGroup(fabricGroup, options = {}) {
  return rasterizeFabricObject(fabricGroup, options);
}

/**
 * Rasterize entire Fabric canvas to a PIXI texture
 * @param {fabric.Canvas} fabricCanvas - Fabric canvas to rasterize
 * @param {Object} options - Rasterization options
 * @returns {Promise<PIXI.Texture>}
 */
export async function rasterizeFabricCanvas(fabricCanvas, options = {}) {
  if (!fabricCanvas) {
    throw new Error('Fabric canvas is required');
  }

  try {
    const {
      scale = 1,
      backgroundColor = fabricCanvas.backgroundColor || '#ffffff',
      devicePixelRatio = window.devicePixelRatio || 1
    } = options;

    const width = fabricCanvas.getWidth();
    const height = fabricCanvas.getHeight();

    // Create offscreen canvas
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width * scale * devicePixelRatio;
    offscreenCanvas.height = height * scale * devicePixelRatio;
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get 2D context');
    }

    // Scale context
    ctx.scale(devicePixelRatio * scale, devicePixelRatio * scale);

    // Set background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Create temporary Fabric canvas
    const tempCanvas = new FabricCanvas(offscreenCanvas, {
      width: width,
      height: height,
      backgroundColor: backgroundColor,
      renderOnAddRemove: false
    });

    // Copy all objects from original canvas
    const objects = fabricCanvas.getObjects();
    for (const obj of objects) {
      const cloned = await obj.clone();
      tempCanvas.add(cloned);
    }

    // Render
    tempCanvas.renderAll();

    // Create PIXI texture
    const texture = PIXI.Texture.from(offscreenCanvas);

    // Cleanup
    tempCanvas.dispose();

    return texture;
  } catch (error) {
    console.error('Failed to rasterize Fabric canvas:', error);
    throw error;
  }
}

/**
 * Convert HTMLImageElement or HTMLCanvasElement to PIXI texture
 * @param {HTMLImageElement|HTMLCanvasElement} source - Image or canvas element
 * @returns {PIXI.Texture}
 */
export function imageToPixiTexture(source) {
  try {
    return PIXI.Texture.from(source);
  } catch (error) {
    console.error('Failed to convert image to Pixi texture:', error);
    throw error;
  }
}

