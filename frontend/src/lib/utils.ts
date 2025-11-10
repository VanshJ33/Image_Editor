import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a color value to hex format for color inputs
 * Handles rgb(), rgba(), and hex formats
 * Preserves gradients and other non-rgb formats
 */
export function colorToHex(color: string | undefined | null): string {
  if (!color || typeof color !== 'string') {
    return '#000000';
  }

  // If already hex format, return as is
  if (color.startsWith('#')) {
    return color;
  }

  // Preserve gradients and other special formats
  if (color.includes('gradient') || color.includes('url(') || color === 'transparent') {
    return color;
  }

  // Handle rgb() and rgba() formats
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return `#${[r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
  }

  // If it's a named color or other format, return default
  return '#000000';
}

