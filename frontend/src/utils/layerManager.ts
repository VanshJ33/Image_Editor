/**
 * Layer Manager - MiniPaint-inspired layer system
 * 
 * Manages layer metadata separately from Fabric.js objects.
 * Each layer has properties like opacity, composition mode, filters, etc.
 */

export interface LayerFilter {
  id: string;
  name: string;
  params: Record<string, any>;
}

export interface LayerMetadata {
  id: string;
  fabricObjectId?: string; // Reference to Fabric.js object
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0-100
  composition: string; // Blend mode: 'source-over', 'multiply', 'screen', etc.
  filters: LayerFilter[];
  order: number; // Z-index order
  parentId?: string;
  isGroup: boolean;
  children?: string[]; // Child layer IDs
}

export class LayerManager {
  private layers: Map<string, LayerMetadata> = new Map();
  private autoIncrement: number = 1;

  /**
   * Create a new layer
   */
  createLayer(fabricObjectId: string, type: string, name?: string): LayerMetadata {
    const layerId = `layer-${this.autoIncrement++}`;
    const layer: LayerMetadata = {
      id: layerId,
      fabricObjectId,
      name: name || `${type} #${this.autoIncrement - 1}`,
      type,
      visible: true,
      locked: false,
      opacity: 100,
      composition: 'source-over',
      filters: [],
      order: this.autoIncrement - 1,
      isGroup: false,
    };

    this.layers.set(layerId, layer);
    return layer;
  }

  /**
   * Get layer by ID
   */
  getLayer(layerId: string): LayerMetadata | undefined {
    return this.layers.get(layerId);
  }

  /**
   * Get layer by Fabric object ID
   */
  getLayerByFabricId(fabricObjectId: string): LayerMetadata | undefined {
    const layersArray = Array.from(this.layers.values());
    for (const layer of layersArray) {
      if (layer.fabricObjectId === fabricObjectId) {
        return layer;
      }
    }
    return undefined;
  }

  /**
   * Get all layers sorted by order (top to bottom)
   */
  getSortedLayers(): LayerMetadata[] {
    return Array.from(this.layers.values())
      .sort((a, b) => b.order - a.order);
  }

  /**
   * Update layer properties
   */
  updateLayer(layerId: string, updates: Partial<LayerMetadata>): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      Object.assign(layer, updates);
    }
  }

  /**
   * Delete layer
   */
  deleteLayer(layerId: string): void {
    this.layers.delete(layerId);
  }

  /**
   * Add filter to layer
   */
  addFilter(layerId: string, filterName: string, params: Record<string, any>): string {
    const layer = this.layers.get(layerId);
    if (!layer) {
      throw new Error(`Layer ${layerId} not found`);
    }

    const filterId = `filter-${Date.now()}-${Math.random()}`;
    const filter: LayerFilter = {
      id: filterId,
      name: filterName,
      params,
    };

    layer.filters.push(filter);
    return filterId;
  }

  /**
   * Remove filter from layer
   */
  removeFilter(layerId: string, filterId: string): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.filters = layer.filters.filter(f => f.id !== filterId);
    }
  }

  /**
   * Update filter
   */
  updateFilter(layerId: string, filterId: string, params: Record<string, any>): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      const filter = layer.filters.find(f => f.id === filterId);
      if (filter) {
        filter.params = { ...filter.params, ...params };
      }
    }
  }

  /**
   * Set layer opacity
   */
  setOpacity(layerId: string, opacity: number): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(100, opacity));
    }
  }

  /**
   * Set layer composition mode
   */
  setComposition(layerId: string, composition: string): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.composition = composition;
    }
  }

  /**
   * Toggle layer visibility
   */
  toggleVisibility(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.visible = !layer.visible;
    }
  }

  /**
   * Reorder layer
   */
  reorderLayer(layerId: string, newOrder: number): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.order = newOrder;
    }
  }

  /**
   * Clear all layers
   */
  clear(): void {
    this.layers.clear();
    this.autoIncrement = 1;
  }

  /**
   * Get all layers
   */
  getAllLayers(): LayerMetadata[] {
    return Array.from(this.layers.values());
  }

  /**
   * Sync with Fabric.js objects
   */
  syncWithFabricObjects(fabricObjects: any[]): void {
    // Remove layers for objects that no longer exist
    const existingFabricIds = new Set(fabricObjects.map(obj => obj.id || obj.name));
    const layersToRemove: string[] = [];

    const layersArray = Array.from(this.layers.values());
    for (const layer of layersArray) {
      if (layer.fabricObjectId && !existingFabricIds.has(layer.fabricObjectId)) {
        layersToRemove.push(layer.id);
      }
    }

    layersToRemove.forEach(id => this.deleteLayer(id));

    // Create layers for new objects
    fabricObjects.forEach((obj, index) => {
      const fabricId = obj.id || obj.name || `obj-${index}`;
      const existingLayer = this.getLayerByFabricId(fabricId);
      
      if (!existingLayer) {
        this.createLayer(fabricId, obj.type || 'object', obj.name);
      }
    });
  }
}

