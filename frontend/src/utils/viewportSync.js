/**
 * viewportSync.js
 * 
 * Viewport synchronization between Fabric.js and Pixi.js.
 * Ensures both canvases maintain pixel-perfect alignment.
 */

import { getPixiApp } from './pixiLayer';

/**
 * Sync viewport transform from Fabric to Pixi
 * @param {fabric.Canvas} fabricCanvas - Fabric canvas instance
 */
export function syncToPixi(fabricCanvas) {
  const pixiApp = getPixiApp();
  if (!pixiApp || !fabricCanvas) return;

  try {
    // Get Fabric viewport transform
    const vpt = fabricCanvas.viewportTransform;
    if (!vpt || vpt.length !== 6) return;

    // Fabric viewport transform: [scaleX, skewY, skewX, scaleY, translateX, translateY]
    // Pixi uses a different transform system, so we need to apply it to the stage
    const scaleX = vpt[0];
    const skewY = vpt[1];
    const skewX = vpt[2];
    const scaleY = vpt[3];
    const translateX = vpt[4];
    const translateY = vpt[5];

    // Apply transform to Pixi stage
    // Note: Pixi uses a different coordinate system, so we may need to adjust
    pixiApp.stage.scale.x = scaleX;
    pixiApp.stage.scale.y = scaleY;
    pixiApp.stage.position.x = translateX;
    pixiApp.stage.position.y = translateY;
    pixiApp.stage.skew.x = skewX;
    pixiApp.stage.skew.y = skewY;
  } catch (error) {
    console.error('Failed to sync viewport to Pixi:', error);
  }
}

/**
 * Sync resize from Fabric to Pixi
 * @param {fabric.Canvas} fabricCanvas - Fabric canvas instance
 */
export function syncResize(fabricCanvas) {
  const pixiApp = getPixiApp();
  if (!pixiApp || !fabricCanvas) return;

  try {
    const width = fabricCanvas.getWidth();
    const height = fabricCanvas.getHeight();
    pixiApp.renderer.resize(width, height);
  } catch (error) {
    console.error('Failed to sync resize to Pixi:', error);
  }
}

/**
 * Convert Fabric coordinates to Pixi coordinates
 * @param {fabric.Canvas} fabricCanvas - Fabric canvas instance
 * @param {number} x - Fabric X coordinate
 * @param {number} y - Fabric Y coordinate
 * @returns {{x: number, y: number}}
 */
export function fabricToPixiCoords(fabricCanvas, x, y) {
  const vpt = fabricCanvas.viewportTransform;
  if (!vpt || vpt.length !== 6) {
    return { x, y };
  }

  // Apply inverse viewport transform
  const scaleX = vpt[0];
  const scaleY = vpt[3];
  const translateX = vpt[4];
  const translateY = vpt[5];

  return {
    x: (x - translateX) / scaleX,
    y: (y - translateY) / scaleY
  };
}

/**
 * Convert Pixi coordinates to Fabric coordinates
 * @param {fabric.Canvas} fabricCanvas - Fabric canvas instance
 * @param {number} x - Pixi X coordinate
 * @param {number} y - Pixi Y coordinate
 * @returns {{x: number, y: number}}
 */
export function pixiToFabricCoords(fabricCanvas, x, y) {
  const vpt = fabricCanvas.viewportTransform;
  if (!vpt || vpt.length !== 6) {
    return { x, y };
  }

  // Apply viewport transform
  const scaleX = vpt[0];
  const scaleY = vpt[3];
  const translateX = vpt[4];
  const translateY = vpt[5];

  return {
    x: x * scaleX + translateX,
    y: y * scaleY + translateY
  };
}







