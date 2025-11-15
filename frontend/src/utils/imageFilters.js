/**
 * Image filter utilities based on MiniPaint's implementation
 * Provides HSLAdjustment and ColorTransformFilter for pixel-level manipulation
 */

// RGB to HSL conversion
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = (r > g) ? (r > b) ? r : b : (g > b) ? g : b;
  const min = (r < g) ? (r < b) ? r : b : (g < b) ? g : b;
  const chroma = max - min;
  let h = 0;
  let s = 0;
  const l = (min + max) / 2;

  if (chroma !== 0) {
    // Hue
    if (r === max) {
      h = (g - b) / chroma + ((g < b) ? 6 : 0);
    } else if (g === max) {
      h = (b - r) / chroma + 2;
    } else {
      h = (r - g) / chroma + 4;
    }
    h /= 6;

    // Saturation
    s = (l > 0.5) ? chroma / (2 - max - min) : chroma / (max + min);
  }

  return [h, s, l];
}

// HSL to RGB conversion
function hslToRgb(h, s, l) {
  let m1, m2, hue;
  let r, g, b;
  const rgb = [];

  if (s === 0) {
    r = g = b = Math.round(l * 255);
    rgb.push(r, g, b);
  } else {
    if (l <= 0.5) {
      m2 = l * (s + 1);
    } else {
      m2 = l + s - l * s;
    }

    m1 = l * 2 - m2;
    hue = h + 1 / 3;

    for (let i = 0; i < 3; i++) {
      if (hue < 0) {
        hue += 1;
      } else if (hue > 1) {
        hue -= 1;
      }

      let tmp;
      if (6 * hue < 1) {
        tmp = m1 + (m2 - m1) * hue * 6;
      } else if (2 * hue < 1) {
        tmp = m2;
      } else if (3 * hue < 2) {
        tmp = m1 + (m2 - m1) * (2 / 3 - hue) * 6;
      } else {
        tmp = m1;
      }

      rgb[i] = Math.round(tmp * 255);
      hue -= 1 / 3;
    }
  }

  return rgb;
}

/**
 * HSL Adjustment filter (from MiniPaint)
 * @param {ImageData} srcImageData - Source image data
 * @param {number} hueDelta - Hue delta (-180 to 180)
 * @param {number} satDelta - Saturation delta (-100 to 100)
 * @param {number} lightness - Lightness (-100 to 100)
 * @returns {ImageData} - Adjusted image data
 */
export function HSLAdjustment(srcImageData, hueDelta, satDelta, lightness) {
  const srcPixels = srcImageData.data;
  const srcWidth = srcImageData.width;
  const srcHeight = srcImageData.height;
  const srcLength = srcPixels.length;
  const dstImageData = new ImageData(srcWidth, srcHeight);
  const dstPixels = dstImageData.data;

  hueDelta /= 360;
  satDelta /= 100;
  lightness /= 100;

  for (let i = 0; i < srcLength; i += 4) {
    // Convert to HSL
    const hsl = rgbToHsl(srcPixels[i], srcPixels[i + 1], srcPixels[i + 2]);

    // Hue
    let h = hsl[0] + hueDelta;
    while (h < 0) h += 1;
    while (h > 1) h -= 1;

    // Saturation
    let s = hsl[1] + hsl[1] * satDelta;
    if (s < 0) s = 0;
    else if (s > 1) s = 1;

    // Lightness
    let l = hsl[2];
    if (lightness > 0) {
      l += (1 - l) * lightness;
    } else if (lightness < 0) {
      l += l * lightness;
    }

    // Convert back to RGB
    const rgb = hslToRgb(h, s, l);

    dstPixels[i] = rgb[0];
    dstPixels[i + 1] = rgb[1];
    dstPixels[i + 2] = rgb[2];
    dstPixels[i + 3] = srcPixels[i + 3];
  }

  return dstImageData;
}

/**
 * Color Transform Filter (from MiniPaint)
 * @param {ImageData} srcImageData - Source image data
 * @param {number} redMultiplier - Red multiplier
 * @param {number} greenMultiplier - Green multiplier
 * @param {number} blueMultiplier - Blue multiplier
 * @param {number} alphaMultiplier - Alpha multiplier
 * @param {number} redOffset - Red offset (-255 to 255)
 * @param {number} greenOffset - Green offset (-255 to 255)
 * @param {number} blueOffset - Blue offset (-255 to 255)
 * @param {number} alphaOffset - Alpha offset
 * @returns {ImageData} - Transformed image data
 */
export function ColorTransformFilter(
  srcImageData,
  redMultiplier,
  greenMultiplier,
  blueMultiplier,
  alphaMultiplier,
  redOffset,
  greenOffset,
  blueOffset,
  alphaOffset
) {
  const srcPixels = srcImageData.data;
  const srcWidth = srcImageData.width;
  const srcHeight = srcImageData.height;
  const srcLength = srcPixels.length;
  const dstImageData = new ImageData(srcWidth, srcHeight);
  const dstPixels = dstImageData.data;

  for (let i = 0; i < srcLength; i += 4) {
    let v;
    dstPixels[i] = (v = srcPixels[i] * redMultiplier + redOffset) > 255 ? 255 : v < 0 ? 0 : v;
    dstPixels[i + 1] = (v = srcPixels[i + 1] * greenMultiplier + greenOffset) > 255 ? 255 : v < 0 ? 0 : v;
    dstPixels[i + 2] = (v = srcPixels[i + 2] * blueMultiplier + blueOffset) > 255 ? 255 : v < 0 ? 0 : v;
    dstPixels[i + 3] = (v = srcPixels[i + 3] * alphaMultiplier + alphaOffset) > 255 ? 255 : v < 0 ? 0 : v;
  }

  return dstImageData;
}

