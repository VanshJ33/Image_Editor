/**
 * Image Effects Utilities
 * Based on MiniPaint's effects implementation
 * Provides various image effects for Fabric.js images
 */

/**
 * Apply CSS filter effect to image
 * @param {FabricImage} fabricImage - Fabric.js image object
 * @param {string} filterType - Filter type (blur, sepia, grayscale, invert, saturate, etc.)
 * @param {number|object} valueOrParams - Filter value or params object
 * @returns {Promise<void>}
 */
export async function applyCSSFilter(fabricImage, filterType, valueOrParams) {
  const value = typeof valueOrParams === 'object' ? valueOrParams.value : valueOrParams;
  if (!fabricImage || fabricImage.type !== 'image') {
    throw new Error('Object must be an image');
  }

  const imgElement = fabricImage.getElement();
  if (!imgElement) {
    throw new Error('Cannot access image element');
  }

  // Create temporary canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imgElement.width || fabricImage.width || 1;
  tempCanvas.height = imgElement.height || fabricImage.height || 1;
  const ctx = tempCanvas.getContext('2d');

  // Draw image
  ctx.drawImage(imgElement, 0, 0);

  // Apply CSS filter
  let filterString = '';
  switch (filterType) {
    case 'blur':
      filterString = `blur(${value}px)`;
      break;
    case 'sepia':
      filterString = `sepia(${value / 100})`;
      break;
    case 'grayscale':
      filterString = `grayscale(${value / 100})`;
      break;
    case 'invert':
      filterString = `invert(${value / 100})`;
      break;
    case 'saturate':
      filterString = `saturate(${1 + value / 100})`;
      break;
    case 'brightness':
      filterString = `brightness(${1 + value / 100})`;
      break;
    case 'contrast':
      filterString = `contrast(${1 + value / 100})`;
      break;
    case 'hue-rotate':
      filterString = `hue-rotate(${value}deg)`;
      break;
    case 'shadow':
      filterString = `drop-shadow(${value}px ${value}px ${value}px #000000)`;
      break;
    default:
      throw new Error(`Unknown filter type: ${filterType}`);
  }

  ctx.filter = filterString;
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.filter = 'none';

  // Update Fabric.js image
  const dataUrl = tempCanvas.toDataURL();
  await fabricImage.setSrc(dataUrl);
  if (fabricImage.canvas) {
    fabricImage.canvas.renderAll();
  }
}

/**
 * Apply pixel-based effect (destructive)
 * @param {FabricImage} fabricImage - Fabric.js image object
 * @param {Function} effectFunction - Function that processes ImageData
 * @param {object} params - Parameters for the effect
 * @returns {Promise<void>}
 */
export async function applyPixelEffect(fabricImage, effectFunction, params = {}) {
  if (!fabricImage || fabricImage.type !== 'image') {
    throw new Error('Object must be an image');
  }

  const imgElement = fabricImage.getElement();
  if (!imgElement) {
    throw new Error('Cannot access image element');
  }

  // Create temporary canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imgElement.width || fabricImage.width || 1;
  tempCanvas.height = imgElement.height || fabricImage.height || 1;
  const ctx = tempCanvas.getContext('2d');

  // Draw image
  ctx.drawImage(imgElement, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

  // Apply effect with parameters
  const result = effectFunction(imageData, params);

  // Put result back
  ctx.putImageData(result, 0, 0);

  // Update Fabric.js image
  const dataUrl = tempCanvas.toDataURL();
  await fabricImage.setSrc(dataUrl);
  if (fabricImage.canvas) {
    fabricImage.canvas.renderAll();
  }
}

/**
 * Grayscale effect
 */
export function grayscaleEffect(imageData, params = {}) {
  const data = imageData.data;
  const intensity = (params.intensity !== undefined ? params.intensity : 100) / 100;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = data[i] * (1 - intensity) + gray * intensity;
    data[i + 1] = data[i + 1] * (1 - intensity) + gray * intensity;
    data[i + 2] = data[i + 2] * (1 - intensity) + gray * intensity;
  }
  return imageData;
}

/**
 * Invert effect
 */
export function invertEffect(imageData, params = {}) {
  const data = imageData.data;
  const intensity = (params.intensity !== undefined ? params.intensity : 100) / 100;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] * (1 - intensity) + (255 - data[i]) * intensity;
    data[i + 1] = data[i + 1] * (1 - intensity) + (255 - data[i + 1]) * intensity;
    data[i + 2] = data[i + 2] * (1 - intensity) + (255 - data[i + 2]) * intensity;
  }
  return imageData;
}

/**
 * Sepia effect
 */
export function sepiaEffect(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
  }
  return imageData;
}

/**
 * Vintage/1977 Instagram filter
 */
export function vintage1977Effect(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Apply warm tone
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] * 1.1); // Increase red
    data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Slight green increase
    data[i + 2] = Math.min(255, data[i + 2] * 0.9); // Decrease blue
  }
  
  return imageData;
}

/**
 * Clarendon Instagram filter
 */
export function clarendonEffect(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Increase contrast and saturation
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const avg = (r + g + b) / 3;
    const contrast = 1.2;
    
    data[i] = Math.min(255, Math.max(0, avg + (r - avg) * contrast * 1.1));
    data[i + 1] = Math.min(255, Math.max(0, avg + (g - avg) * contrast * 1.05));
    data[i + 2] = Math.min(255, Math.max(0, avg + (b - avg) * contrast * 0.95));
  }
  return imageData;
}

/**
 * Gingham Instagram filter
 */
export function ginghamEffect(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Desaturate and add slight blue tint
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = gray * 0.95;
    data[i + 1] = gray * 0.98;
    data[i + 2] = gray * 1.05;
  }
  return imageData;
}

/**
 * Inkwell Instagram filter (black and white with contrast)
 */
export function inkwellEffect(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const contrast = 1.3;
    const adjusted = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));
    data[i] = adjusted;
    data[i + 1] = adjusted;
    data[i + 2] = adjusted;
  }
  return imageData;
}

/**
 * Lo-Fi Instagram filter
 */
export function lofiEffect(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Increase saturation and contrast
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const avg = (r + g + b) / 3;
    const contrast = 1.15;
    
    data[i] = Math.min(255, Math.max(0, avg + (r - avg) * contrast * 1.2));
    data[i + 1] = Math.min(255, Math.max(0, avg + (g - avg) * contrast * 1.1));
    data[i + 2] = Math.min(255, Math.max(0, avg + (b - avg) * contrast * 0.9));
  }
  return imageData;
}

/**
 * Toaster Instagram filter
 */
export function toasterEffect(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Warm, high contrast effect
    data[i] = Math.min(255, data[i] * 1.15);
    data[i + 1] = Math.min(255, data[i + 1] * 1.05);
    data[i + 2] = Math.min(255, data[i + 2] * 0.85);
    
    // Increase contrast
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const contrast = 1.2;
    data[i] = Math.min(255, Math.max(0, avg + (data[i] - avg) * contrast));
    data[i + 1] = Math.min(255, Math.max(0, avg + (data[i + 1] - avg) * contrast));
    data[i + 2] = Math.min(255, Math.max(0, avg + (data[i + 2] - avg) * contrast));
  }
  return imageData;
}

/**
 * Valencia Instagram filter
 */
export function valenciaEffect(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Warm, slightly desaturated
    data[i] = Math.min(255, data[i] * 1.08);
    data[i + 1] = Math.min(255, data[i + 1] * 1.02);
    data[i + 2] = Math.min(255, data[i + 2] * 0.95);
    
    // Slight desaturation
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = data[i] * 0.9 + gray * 0.1;
    data[i + 1] = data[i + 1] * 0.9 + gray * 0.1;
    data[i + 2] = data[i + 2] * 0.9 + gray * 0.1;
  }
  return imageData;
}

/**
 * X-Pro II Instagram filter
 */
export function xpro2Effect(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Strong contrast and saturation
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const avg = (r + g + b) / 3;
    const contrast = 1.25;
    
    data[i] = Math.min(255, Math.max(0, avg + (r - avg) * contrast * 1.15));
    data[i + 1] = Math.min(255, Math.max(0, avg + (g - avg) * contrast * 1.1));
    data[i + 2] = Math.min(255, Math.max(0, avg + (b - avg) * contrast * 1.05));
    
    // Add slight warm tint
    data[i] = Math.min(255, data[i] * 1.05);
    data[i + 2] = Math.min(255, data[i + 2] * 0.95);
  }
  return imageData;
}

/**
 * Aden Instagram filter
 */
export function adenEffect(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Apply darken overlay
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Darken blend
    data[i] = Math.min(255, r * 0.8);
    data[i + 1] = Math.min(255, g * 0.8);
    data[i + 2] = Math.min(255, b * 0.8);
  }
  
  // Apply hue-rotate, contrast, saturate, brightness via color adjustments
  for (let i = 0; i < data.length; i += 4) {
    // Hue shift (warm)
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Warm tint
    data[i] = Math.min(255, r * 1.05);
    data[i + 2] = Math.min(255, b * 0.95);
    
    // Contrast and saturation
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const contrast = 0.9;
    data[i] = Math.min(255, Math.max(0, avg + (data[i] - avg) * contrast));
    data[i + 1] = Math.min(255, Math.max(0, avg + (data[i + 1] - avg) * contrast));
    data[i + 2] = Math.min(255, Math.max(0, avg + (data[i + 2] - avg) * contrast));
    
    // Brightness
    data[i] = Math.min(255, data[i] * 1.2);
    data[i + 1] = Math.min(255, data[i + 1] * 1.2);
    data[i + 2] = Math.min(255, data[i + 2] * 1.2);
  }
  
  return imageData;
}

/**
 * Black and White effect (threshold)
 */
export function blackAndWhiteEffect(imageData, params = {}) {
  const data = imageData.data;
  const threshold = params.threshold !== undefined ? params.threshold : 128;
  
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue; // transparent
    const gray = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
    const c = gray <= threshold ? 0 : 255;
    data[i] = c;
    data[i + 1] = c;
    data[i + 2] = c;
  }
  return imageData;
}

/**
 * Edge detection effect
 */
export function edgeEffect(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const newData = new ImageData(width, height);
  const newPixels = newData.data;
  
  // Sobel edge detection kernel
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          gx += gray * sobelX[kernelIdx];
          gy += gray * sobelY[kernelIdx];
        }
      }
      
      const magnitude = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      const idx = (y * width + x) * 4;
      newPixels[idx] = magnitude;
      newPixels[idx + 1] = magnitude;
      newPixels[idx + 2] = magnitude;
      newPixels[idx + 3] = data[idx + 3];
    }
  }
  
  return newData;
}

/**
 * Emboss effect
 */
export function embossEffect(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const newData = new ImageData(width, height);
  const newPixels = newData.data;
  
  const embossKernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          sum += gray * embossKernel[kernelIdx];
        }
      }
      
      const value = Math.min(255, Math.max(0, sum + 128));
      const idx = (y * width + x) * 4;
      newPixels[idx] = value;
      newPixels[idx + 1] = value;
      newPixels[idx + 2] = value;
      newPixels[idx + 3] = data[idx + 3];
    }
  }
  
  return newData;
}

/**
 * Box Blur effect (with h-radius, v-radius, quality like MiniPaint)
 */
export function boxBlurEffect(imageData, hRadius = 3, vRadius = 3, quality = 3) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const newData = new ImageData(width, height);
  const newPixels = newData.data;
  
  // Apply box blur multiple times based on quality
  let currentData = new Uint8ClampedArray(data);
  
  for (let q = 0; q < quality; q++) {
    const tempData = new Uint8ClampedArray(currentData);
    
    // Horizontal blur
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        
        for (let dx = -hRadius; dx <= hRadius; dx++) {
          const px = Math.max(0, Math.min(width - 1, x + dx));
          const idx = (y * width + px) * 4;
          r += tempData[idx];
          g += tempData[idx + 1];
          b += tempData[idx + 2];
          a += tempData[idx + 3];
          count++;
        }
        
        const idx = (y * width + x) * 4;
        currentData[idx] = r / count;
        currentData[idx + 1] = g / count;
        currentData[idx + 2] = b / count;
        currentData[idx + 3] = a / count;
      }
    }
    
    // Vertical blur
    const tempData2 = new Uint8ClampedArray(currentData);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        
        for (let dy = -vRadius; dy <= vRadius; dy++) {
          const py = Math.max(0, Math.min(height - 1, y + dy));
          const idx = (py * width + x) * 4;
          r += tempData2[idx];
          g += tempData2[idx + 1];
          b += tempData2[idx + 2];
          a += tempData2[idx + 3];
          count++;
        }
        
        const idx = (y * width + x) * 4;
        currentData[idx] = r / count;
        currentData[idx + 1] = g / count;
        currentData[idx + 2] = b / count;
        currentData[idx + 3] = a / count;
      }
    }
  }
  
  newPixels.set(currentData);
  return newData;
}

/**
 * Sharpen effect
 */
export function sharpenEffect(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const newData = new ImageData(width, height);
  const newPixels = newData.data;
  
  const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * sharpenKernel[kernelIdx];
          }
        }
        const idx = (y * width + x) * 4 + c;
        newPixels[idx] = Math.min(255, Math.max(0, sum));
      }
      newPixels[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3];
    }
  }
  
  return newData;
}

/**
 * Solarize effect
 */
export function solarizeEffect(imageData, params = {}) {
  const data = imageData.data;
  const threshold = params.threshold !== undefined ? params.threshold : 128;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] > threshold ? 255 - data[i] : data[i];
    data[i + 1] = data[i + 1] > threshold ? 255 - data[i + 1] : data[i + 1];
    data[i + 2] = data[i + 2] > threshold ? 255 - data[i + 2] : data[i + 2];
  }
  return imageData;
}

/**
 * Mosaic effect
 */
export function mosaicEffect(imageData, blockSize = 10) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      let r = 0, g = 0, b = 0, count = 0;
      
      for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
        for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }
      }
      
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      
      for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
        for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
        }
      }
    }
  }
  
  return imageData;
}

/**
 * Oil painting effect
 */
export function oilEffect(imageData, range = 3, levels = 20) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const newData = new ImageData(width, height);
  const newPixels = newData.data;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const intensityCount = new Array(levels).fill(0);
      const avgR = new Array(levels).fill(0);
      const avgG = new Array(levels).fill(0);
      const avgB = new Array(levels).fill(0);
      
      for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
          const px = Math.min(width - 1, Math.max(0, x + dx));
          const py = Math.min(height - 1, Math.max(0, y + dy));
          const idx = (py * width + px) * 4;
          
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const intensity = Math.round(((r + g + b) / 3 / 255) * (levels - 1));
          
          intensityCount[intensity]++;
          avgR[intensity] += r;
          avgG[intensity] += g;
          avgB[intensity] += b;
        }
      }
      
      let maxIndex = 0;
      for (let i = 1; i < levels; i++) {
        if (intensityCount[i] > intensityCount[maxIndex]) {
          maxIndex = i;
        }
      }
      
      const idx = (y * width + x) * 4;
      newPixels[idx] = Math.round(avgR[maxIndex] / intensityCount[maxIndex]);
      newPixels[idx + 1] = Math.round(avgG[maxIndex] / intensityCount[maxIndex]);
      newPixels[idx + 2] = Math.round(avgB[maxIndex] / intensityCount[maxIndex]);
      newPixels[idx + 3] = data[idx + 3];
    }
  }
  
  return newData;
}

/**
 * Vignette effect
 */
export function vignetteEffect(imageData, intensity = 0.5) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = 1 - (dist / maxDist) * intensity;
      
      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, Math.max(0, data[idx] * factor));
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] * factor));
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] * factor));
    }
  }
  
  return imageData;
}

/**
 * Vibrance effect
 */
export function vibranceEffect(imageData, amount = 50) {
  const data = imageData.data;
  const factor = amount / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const avg = (r + g + b) / 3;
    const sat = max === 0 ? 0 : 1 - Math.min(r, g, b) / max;
    
    const adjustment = sat * factor;
    data[i] = Math.min(255, Math.max(0, r + (r - avg) * adjustment));
    data[i + 1] = Math.min(255, Math.max(0, g + (g - avg) * adjustment));
    data[i + 2] = Math.min(255, Math.max(0, b + (b - avg) * adjustment));
  }
  
  return imageData;
}

/**
 * Vintage effect
 */
export function vintageEffect(imageData) {
  const data = imageData.data;
  
  // Apply sepia
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
  }
  
  // Add noise
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  
  return imageData;
}

/**
 * Effect definitions for browser
 */
export const effectDefinitions = [
  // Common Filters
  {
    key: 'blur',
    title: 'Blur',
    category: 'common',
    type: 'css',
    defaultParams: { value: 5 },
    params: [
      { name: 'value', title: 'Blur Amount', value: 5, range: [0, 20], step: 0.1 }
    ],
    icon: '🌫️'
  },
  {
    key: 'box-blur',
    title: 'Box Blur',
    category: 'common',
    type: 'pixel',
    effectFunction: (img, params) => boxBlurEffect(img, params?.hRadius || 3, params?.vRadius || 3, params?.quality || 3),
    params: [
      { name: 'hRadius', title: 'H Radius', value: 3, range: [1, 20], step: 1 },
      { name: 'vRadius', title: 'V Radius', value: 3, range: [1, 20], step: 1 },
      { name: 'quality', title: 'Quality', value: 3, range: [1, 20], step: 1 }
    ],
    icon: '📦'
  },
  {
    key: 'sepia',
    title: 'Sepia',
    category: 'common',
    type: 'css',
    defaultParams: { value: 60 },
    params: [
      { name: 'value', title: 'Sepia Intensity', value: 60, range: [0, 100], step: 1 }
    ],
    icon: '📸'
  },
  {
    key: 'grayscale',
    title: 'Grayscale',
    category: 'common',
    type: 'pixel',
    effectFunction: grayscaleEffect,
    params: [
      { name: 'intensity', title: 'Grayscale Intensity', value: 100, range: [0, 100], step: 1 }
    ],
    icon: '⚫'
  },
  {
    key: 'invert',
    title: 'Invert',
    category: 'common',
    type: 'pixel',
    effectFunction: invertEffect,
    params: [
      { name: 'intensity', title: 'Invert Intensity', value: 100, range: [0, 100], step: 1 }
    ],
    icon: '🔄'
  },
  {
    key: 'brightness',
    title: 'Brightness',
    category: 'common',
    type: 'css',
    defaultParams: { value: 30 },
    params: [
      { name: 'value', title: 'Brightness', value: 30, range: [-100, 100], step: 1 }
    ],
    icon: '☀️'
  },
  {
    key: 'contrast',
    title: 'Contrast',
    category: 'common',
    type: 'css',
    defaultParams: { value: 40 },
    params: [
      { name: 'value', title: 'Contrast', value: 40, range: [-100, 100], step: 1 }
    ],
    icon: '📊'
  },
  {
    key: 'saturate',
    title: 'Saturate',
    category: 'common',
    type: 'css',
    defaultParams: { value: -50 },
    params: [
      { name: 'value', title: 'Saturation', value: -50, range: [-100, 100], step: 1 }
    ],
    icon: '🎨'
  },
  {
    key: 'hue-rotate',
    title: 'Hue Rotate',
    category: 'common',
    type: 'css',
    defaultParams: { value: 90 },
    params: [
      { name: 'value', title: 'Hue Rotation', value: 90, range: [0, 360], step: 1 }
    ],
    icon: '🌈'
  },
  {
    key: 'shadow',
    title: 'Shadow',
    category: 'common',
    type: 'css',
    defaultParams: { value: 5 },
    params: [
      { name: 'value', title: 'Shadow Size', value: 5, range: [0, 20], step: 0.1 }
    ],
    icon: '🌑'
  },
  // Instagram Filters
  {
    key: '1977',
    title: '1977',
    category: 'instagram',
    type: 'pixel',
    effectFunction: vintage1977Effect,
    params: [
      { name: 'intensity', title: 'Intensity', value: 100, range: [0, 100], step: 1 }
    ],
    icon: '📷'
  },
  {
    key: 'aden',
    title: 'Aden',
    category: 'instagram',
    type: 'pixel',
    effectFunction: adenEffect,
    params: [
      { name: 'intensity', title: 'Intensity', value: 100, range: [0, 100], step: 1 }
    ],
    icon: '🌺'
  },
  {
    key: 'clarendon',
    title: 'Clarendon',
    category: 'instagram',
    type: 'pixel',
    effectFunction: clarendonEffect,
    params: [
      { name: 'intensity', title: 'Intensity', value: 100, range: [0, 100], step: 1 }
    ],
    icon: '✨'
  },
  {
    key: 'gingham',
    title: 'Gingham',
    category: 'instagram',
    type: 'pixel',
    effectFunction: ginghamEffect,
    params: [
      { name: 'intensity', title: 'Intensity', value: 100, range: [0, 100], step: 1 }
    ],
    icon: '🎨'
  },
  {
    key: 'inkwell',
    title: 'Inkwell',
    category: 'instagram',
    type: 'pixel',
    effectFunction: inkwellEffect,
    params: [
      { name: 'intensity', title: 'Intensity', value: 100, range: [0, 100], step: 1 }
    ],
    icon: '🖤'
  },
  {
    key: 'lofi',
    title: 'Lo-Fi',
    category: 'instagram',
    type: 'pixel',
    effectFunction: lofiEffect,
    params: [
      { name: 'intensity', title: 'Intensity', value: 100, range: [0, 100], step: 1 }
    ],
    icon: '🎵'
  },
  {
    key: 'toaster',
    title: 'Toaster',
    category: 'instagram',
    type: 'pixel',
    effectFunction: toasterEffect,
    params: [
      { name: 'intensity', title: 'Intensity', value: 100, range: [0, 100], step: 1 }
    ],
    icon: '🔥'
  },
  {
    key: 'valencia',
    title: 'Valencia',
    category: 'instagram',
    type: 'pixel',
    effectFunction: valenciaEffect,
    params: [
      { name: 'intensity', title: 'Intensity', value: 100, range: [0, 100], step: 1 }
    ],
    icon: '🌅'
  },
  {
    key: 'xpro2',
    title: 'X-Pro II',
    category: 'instagram',
    type: 'pixel',
    effectFunction: xpro2Effect,
    params: [
      { name: 'intensity', title: 'Intensity', value: 100, range: [0, 100], step: 1 }
    ],
    icon: '📹'
  },
  // Other Effects
  {
    key: 'black-and-white',
    title: 'Black and White',
    category: 'other',
    type: 'pixel',
    effectFunction: blackAndWhiteEffect,
    params: [
      { name: 'threshold', title: 'Threshold', value: 128, range: [0, 255], step: 1 }
    ],
    icon: '⚪'
  },
  {
    key: 'edge',
    title: 'Edge',
    category: 'other',
    type: 'pixel',
    effectFunction: edgeEffect,
    params: [
      { name: 'intensity', title: 'Edge Intensity', value: 100, range: [0, 200], step: 1 }
    ],
    icon: '🔲'
  },
  {
    key: 'emboss',
    title: 'Emboss',
    category: 'other',
    type: 'pixel',
    effectFunction: embossEffect,
    params: [
      { name: 'intensity', title: 'Emboss Intensity', value: 100, range: [0, 200], step: 1 }
    ],
    icon: '💎'
  },
  {
    key: 'sharpen',
    title: 'Sharpen',
    category: 'other',
    type: 'pixel',
    effectFunction: sharpenEffect,
    params: [
      { name: 'intensity', title: 'Sharpen Intensity', value: 100, range: [0, 200], step: 1 }
    ],
    icon: '🔪'
  },
  {
    key: 'solarize',
    title: 'Solarize',
    category: 'other',
    type: 'pixel',
    effectFunction: solarizeEffect,
    params: [
      { name: 'threshold', title: 'Threshold', value: 128, range: [0, 255], step: 1 }
    ],
    icon: '☀️'
  },
  {
    key: 'mosaic',
    title: 'Mosaic',
    category: 'other',
    type: 'pixel',
    effectFunction: (img, params) => mosaicEffect(img, params?.blockSize || 10),
    params: [
      { name: 'blockSize', title: 'Block Size', value: 10, range: [2, 50], step: 1 }
    ],
    icon: '🧩'
  },
  {
    key: 'oil',
    title: 'Oil',
    category: 'other',
    type: 'pixel',
    effectFunction: (img, params) => oilEffect(img, params?.range || 3, params?.levels || 20),
    params: [
      { name: 'range', title: 'Range', value: 3, range: [1, 10], step: 1 },
      { name: 'levels', title: 'Levels', value: 20, range: [1, 256], step: 1 }
    ],
    icon: '🖼️'
  },
  {
    key: 'vignette',
    title: 'Vignette',
    category: 'other',
    type: 'pixel',
    effectFunction: (img, params) => vignetteEffect(img, params?.intensity || 0.5),
    params: [
      { name: 'intensity', title: 'Intensity', value: 0.5, range: [0, 1], step: 0.01 }
    ],
    icon: '🖤'
  },
  {
    key: 'vibrance',
    title: 'Vibrance',
    category: 'other',
    type: 'pixel',
    effectFunction: (img, params) => vibranceEffect(img, params?.amount || 50),
    params: [
      { name: 'amount', title: 'Amount', value: 50, range: [0, 100], step: 1 }
    ],
    icon: '✨'
  },
  {
    key: 'vintage',
    title: 'Vintage',
    category: 'other',
    type: 'pixel',
    effectFunction: vintageEffect,
    params: [
      { name: 'intensity', title: 'Intensity', value: 100, range: [0, 100], step: 1 }
    ],
    icon: '📜'
  }
];

