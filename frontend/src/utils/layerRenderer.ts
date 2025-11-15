/**
 * Layer Renderer - Applies layer properties to Fabric.js objects
 * 
 * Inspired by MiniPaint's rendering pipeline, but adapted for Fabric.js
 * We apply filters and properties directly to Fabric objects
 */

import { LayerMetadata, LayerFilter } from './layerManager';
import { Canvas as FabricCanvas, FabricObject } from 'fabric';
import * as fabric from 'fabric';

export class LayerRenderer {
  /**
   * Apply layer properties to a Fabric.js object
   */
  static applyLayerToObject(
    fabricObj: FabricObject,
    layer: LayerMetadata
  ): void {
    // Apply opacity
    fabricObj.set('opacity', layer.opacity / 100);

    // Apply visibility
    fabricObj.set('visible', layer.visible);

    // Apply composition mode (blend mode)
    // Note: Fabric.js uses 'globalCompositeOperation' but it's limited
    // For full blend mode support, we'd need custom rendering

    // Apply filters (only if object supports filters)
    if (this.supportsFilters(fabricObj)) {
      this.applyFiltersToObject(fabricObj, layer.filters);
    }
  }

  /**
   * Check if object supports filters
   */
  private static supportsFilters(fabricObj: FabricObject): boolean {
    // Only certain Fabric.js object types support filters
    // Mainly: Image, ImageObject, and some other types
    const obj = fabricObj as any;
    return obj.type === 'image' || 
           obj.type === 'FabricImage' ||
           typeof obj.applyFilters === 'function';
  }

  /**
   * Apply filters to a Fabric.js object
   */
  static applyFiltersToObject(
    fabricObj: FabricObject,
    filters: LayerFilter[]
  ): void {
    const obj = fabricObj as any;
    
    // Check if object supports filters
    if (!this.supportsFilters(fabricObj)) {
      return;
    }

    const fabricFilters: any[] = [];

    for (const filter of filters) {
      const fabricFilter = this.createFabricFilter(filter);
      if (fabricFilter) {
        fabricFilters.push(fabricFilter);
      }
    }

    obj.set('filters', fabricFilters);
    
    // Only call applyFilters if it exists
    if (typeof obj.applyFilters === 'function') {
      obj.applyFilters();
    }
  }

  /**
   * Create a Fabric.js filter from layer filter
   */
  private static createFabricFilter(filter: LayerFilter): any {
    const { name, params } = filter;
    const filters = (fabric as any).filters;

    if (!filters) {
      console.warn('Fabric.js filters not available');
      return null;
    }

    switch (name) {
      case 'blur':
        return new filters.Blur({
          blur: (params.radius || params.value || 0) / 100
        });

      case 'brightness':
        return new filters.Brightness({
          brightness: (params.value || 0) / 100
        });

      case 'contrast':
        return new filters.Contrast({
          contrast: (params.value || 0) / 100
        });

      case 'saturation':
        return new filters.Saturation({
          saturation: (params.value || 0) / 100
        });

      case 'grayscale':
        return new filters.Grayscale();

      case 'sepia':
        return new filters.Sepia();

      case 'invert':
        // Use ColorMatrix filter for invert
        return new filters.ColorMatrix({
          matrix: [
            -1, 0, 0, 0, 1,
            0, -1, 0, 0, 1,
            0, 0, -1, 0, 1,
            0, 0, 0, 1, 0
          ]
        });

      default:
        return null;
    }
  }

  /**
   * Remove all filters from object
   */
  static removeFiltersFromObject(fabricObj: FabricObject): void {
    if (!this.supportsFilters(fabricObj)) {
      return;
    }
    
    const obj = fabricObj as any;
    obj.set('filters', []);
    
    if (typeof obj.applyFilters === 'function') {
      obj.applyFilters();
    }
  }

  /**
   * Update a single filter on an object
   */
  static updateFilterOnObject(
    fabricObj: FabricObject,
    filterId: string,
    filterName: string,
    params: Record<string, any>
  ): void {
    if (!this.supportsFilters(fabricObj)) {
      return;
    }
    
    const obj = fabricObj as any;
    const filters = (obj.filters || []) as any[];
    const filterIndex = filters.findIndex((f: any, idx: number) => {
      // We need to track which filter corresponds to which layer filter
      // This is a simplified approach - in production you'd want better tracking
      return true; // For now, update the first matching filter type
    });

    if (filterIndex >= 0) {
      const newFilter = this.createFabricFilter({ id: filterId, name: filterName, params });
      if (newFilter) {
        filters[filterIndex] = newFilter;
        obj.set('filters', filters);
        
        if (typeof obj.applyFilters === 'function') {
          obj.applyFilters();
        }
      }
    }
  }
}

