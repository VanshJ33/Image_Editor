/**
 * Layer Details Panel - MiniPaint-inspired layer properties editor
 * Displays and allows editing of selected layer properties
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useEditor } from '../../contexts/EditorContext.tsx';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RotateCcw, Maximize2 } from 'lucide-react';
import * as fabric from 'fabric';

const LayerDetailsPanel = ({ layerId }) => {
  const { 
    canvas, 
    activeObject, 
    layerMetadata, 
    setLayerOpacity,
    saveToHistory,
    updateLayers
  } = useEditor();

  const [values, setValues] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotate: 0,
    opacity: 100
  });

  const [originalValues, setOriginalValues] = useState(null);
  const [isTextLayer, setIsTextLayer] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [color, setColor] = useState('#000000');

  // Get the Fabric object for this layer
  const getFabricObject = useCallback(() => {
    if (!canvas || !layerId) return null;
    
    const objects = canvas.getObjects();
    const layerMeta = layerMetadata?.get?.(layerId);
    if (!layerMeta) return null;

    // Find object by fabricObjectId
    return objects.find((obj) => {
      const fabricId = obj.id || obj.name;
      return fabricId === layerMeta.fabricObjectId;
    });
  }, [canvas, layerId, layerMetadata]);

  // Update values from Fabric object
  const updateValuesFromObject = useCallback(() => {
    const obj = getFabricObject();
    if (!obj) {
      setValues({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotate: 0,
        opacity: 100
      });
      return;
    }

    const bounds = obj.getBoundingRect();
    const isText = obj.type === 'textbox' || obj.type === 'text';
    
    setIsTextLayer(isText);
    
    // Check if object has color property (shapes)
    const hasColor = obj.type !== 'image' && obj.type !== 'textbox' && obj.fill;
    setShowColor(hasColor);
    if (hasColor && obj.fill) {
      const fillColor = typeof obj.fill === 'string' ? obj.fill : (obj.fill?.color || '#000000');
      setColor(fillColor);
    }

    const newValues = {
      x: Math.round(bounds.left),
      y: Math.round(bounds.top),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
      rotate: Math.round(obj.angle || 0),
      opacity: Math.round((obj.opacity !== undefined ? obj.opacity : 1) * 100)
    };

    setValues(newValues);
    if (!originalValues) {
      setOriginalValues({ ...newValues });
    }
  }, [getFabricObject, originalValues]);

  // Update values when object changes
  useEffect(() => {
    updateValuesFromObject();
  }, [updateValuesFromObject, activeObject, layerId]);

  // Listen to canvas events for real-time updates
  useEffect(() => {
    if (!canvas) return;

    const handleObjectModified = () => {
      updateValuesFromObject();
    };

    const handleObjectMoving = () => {
      updateValuesFromObject();
    };

    const handleObjectScaling = () => {
      updateValuesFromObject();
    };

    const handleObjectRotating = () => {
      updateValuesFromObject();
    };

    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:moving', handleObjectMoving);
    canvas.on('object:scaling', handleObjectScaling);
    canvas.on('object:rotating', handleObjectRotating);

    return () => {
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:moving', handleObjectMoving);
      canvas.off('object:scaling', handleObjectScaling);
      canvas.off('object:rotating', handleObjectRotating);
    };
  }, [canvas, updateValuesFromObject]);

  // Handle input change (real-time preview)
  const handleInputChange = useCallback((key, value, isBlur = false) => {
    const obj = getFabricObject();
    if (!obj || !canvas) return;

    let processedValue = parseFloat(value);
    if (isNaN(processedValue)) return;

    if (key === 'opacity') {
      processedValue = Math.max(0, Math.min(100, processedValue));
      obj.set('opacity', processedValue / 100);
      if (setLayerOpacity && layerId) {
        setLayerOpacity(layerId, processedValue);
      }
      obj.setCoords();
    } else if (key === 'rotate') {
      processedValue = Math.max(-360, Math.min(360, processedValue));
      obj.set('angle', processedValue);
      obj.setCoords();
    } else if (key === 'x') {
      const bounds = obj.getBoundingRect();
      const diff = processedValue - bounds.left;
      const newLeft = (obj.left || 0) + diff;
      obj.set('left', newLeft);
      obj.setCoords();
    } else if (key === 'y') {
      const bounds = obj.getBoundingRect();
      const diff = processedValue - bounds.top;
      const newTop = (obj.top || 0) + diff;
      obj.set('top', newTop);
      obj.setCoords();
    } else if (key === 'width') {
      const currentWidth = obj.getScaledWidth();
      if (currentWidth > 0) {
        const scale = processedValue / currentWidth;
        const newScaleX = (obj.scaleX || 1) * scale;
        obj.set('scaleX', newScaleX);
        obj.setCoords();
      }
    } else if (key === 'height') {
      const currentHeight = obj.getScaledHeight();
      if (currentHeight > 0) {
        const scale = processedValue / currentHeight;
        const newScaleY = (obj.scaleY || 1) * scale;
        obj.set('scaleY', newScaleY);
        obj.setCoords();
      }
    }

    // Update local state
    setValues(prev => ({ ...prev, [key]: processedValue }));

    // Real-time preview
    canvas.renderAll();
    canvas.requestRenderAll();

    // Save to history on blur
    if (isBlur) {
      saveToHistory();
      updateLayers();
    }
  }, [getFabricObject, canvas, layerId, setLayerOpacity, saveToHistory, updateLayers]);

  // Handle reset buttons
  const handleReset = useCallback((key) => {
    const obj = getFabricObject();
    if (!obj || !canvas) return;

    if (key === 'x') {
      obj.set('left', 0);
      obj.setCoords();
      canvas.renderAll();
      updateValuesFromObject();
      saveToHistory();
      updateLayers();
    } else if (key === 'y') {
      obj.set('top', 0);
      obj.setCoords();
      canvas.renderAll();
      updateValuesFromObject();
      saveToHistory();
      updateLayers();
    } else if (key === 'rotate') {
      obj.set('angle', 0);
      obj.setCoords();
      canvas.renderAll();
      updateValuesFromObject();
      saveToHistory();
      updateLayers();
    } else if (key === 'opacity') {
      obj.set('opacity', 1);
      obj.setCoords();
      if (setLayerOpacity && layerId) {
        setLayerOpacity(layerId, 100);
      }
      canvas.renderAll();
      updateValuesFromObject();
      saveToHistory();
      updateLayers();
    } else if (key === 'size') {
      // Reset to original size (scale = 1)
      obj.set({
        scaleX: 1,
        scaleY: 1
      });
      obj.setCoords();
      canvas.renderAll();
      updateValuesFromObject();
      saveToHistory();
      updateLayers();
    }
  }, [getFabricObject, canvas, layerId, setLayerOpacity, updateValuesFromObject, saveToHistory, updateLayers]);

  // Handle color change
  const handleColorChange = useCallback((e) => {
    const newColor = e.target.value;
    setColor(newColor);
    
    const obj = getFabricObject();
    if (!obj || !canvas) return;

    obj.set('fill', newColor);
    obj.setCoords();
    canvas.renderAll();
    canvas.requestRenderAll();
    saveToHistory();
    updateLayers();
  }, [getFabricObject, canvas, saveToHistory, updateLayers]);

  const obj = getFabricObject();
  if (!obj || !layerId) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        <p className="text-sm">No layer selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-3">
        {/* Position */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Label htmlFor="detail_x" className="text-xs">X</Label>
              </div>
              <div className="flex gap-1">
                <Input
                  id="detail_x"
                  type="number"
                  step="any"
                  value={values.x}
                  onChange={(e) => handleInputChange('x', e.target.value)}
                  onBlur={(e) => handleInputChange('x', e.target.value, true)}
                  className="h-8 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleReset('x')}
                  title="Reset X"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Label htmlFor="detail_y" className="text-xs">Y</Label>
              </div>
              <div className="flex gap-1">
                <Input
                  id="detail_y"
                  type="number"
                  step="any"
                  value={values.y}
                  onChange={(e) => handleInputChange('y', e.target.value)}
                  onBlur={(e) => handleInputChange('y', e.target.value, true)}
                  className="h-8 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleReset('y')}
                  title="Reset Y"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Size</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="detail_width" className="text-xs">Width</Label>
              <Input
                id="detail_width"
                type="number"
                step="any"
                value={values.width}
                onChange={(e) => handleInputChange('width', e.target.value)}
                onBlur={(e) => handleInputChange('width', e.target.value, true)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="detail_height" className="text-xs">Height</Label>
              <Input
                id="detail_height"
                type="number"
                step="any"
                value={values.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                onBlur={(e) => handleInputChange('height', e.target.value, true)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={() => handleReset('size')}
          >
            <Maximize2 className="w-3 h-3 mr-1" />
            Reset Size
          </Button>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-3"></div>

        {/* Transform */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Transform</Label>
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="detail_rotate" className="text-xs">Rotate</Label>
                <span className="text-xs text-slate-500">{values.rotate}°</span>
              </div>
              <div className="flex gap-1">
                <Input
                  id="detail_rotate"
                  type="number"
                  min="-360"
                  max="360"
                  value={values.rotate}
                  onChange={(e) => handleInputChange('rotate', e.target.value)}
                  onBlur={(e) => handleInputChange('rotate', e.target.value, true)}
                  className="h-8 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleReset('rotate')}
                  title="Reset Rotation"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="detail_opacity" className="text-xs">Opacity</Label>
                <span className="text-xs text-slate-500">{values.opacity}%</span>
              </div>
              <div className="flex gap-1">
                <Input
                  id="detail_opacity"
                  type="number"
                  min="0"
                  max="100"
                  value={values.opacity}
                  onChange={(e) => handleInputChange('opacity', e.target.value)}
                  onBlur={(e) => handleInputChange('opacity', e.target.value, true)}
                  className="h-8 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleReset('opacity')}
                  title="Reset Opacity"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Color (for shapes) */}
        {showColor && (
          <div className="space-y-2">
            <Label htmlFor="detail_color" className="text-xs font-medium text-slate-600 dark:text-slate-400">Color</Label>
            <div className="flex gap-2">
              <Input
                id="detail_color"
                type="color"
                value={color}
                onChange={handleColorChange}
                className="h-8 w-16 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  handleColorChange({ target: { value: e.target.value } });
                }}
                className="h-8 flex-1 text-xs font-mono"
                placeholder="#000000"
              />
            </div>
          </div>
        )}

        {/* Text-specific properties */}
        {isTextLayer && obj.type === 'textbox' && (
          <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Text Properties</Label>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="detail_text_align" className="text-xs">Alignment</Label>
                <select
                  id="detail_text_align"
                  value={obj.textAlign || 'left'}
                  onChange={(e) => {
                    obj.set('textAlign', e.target.value);
                    obj.setCoords();
                    canvas.renderAll();
                    canvas.requestRenderAll();
                    saveToHistory();
                    updateLayers();
                  }}
                  className="w-full h-8 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                  <option value="justify">Justify</option>
                </select>
              </div>
              {obj.fontSize && (
                <div className="space-y-1">
                  <Label htmlFor="detail_font_size" className="text-xs">Font Size</Label>
                  <Input
                    id="detail_font_size"
                    type="number"
                    min="8"
                    max="200"
                    value={Math.round(obj.fontSize || 32)}
                    onChange={(e) => {
                      obj.set('fontSize', parseInt(e.target.value) || 32);
                      obj.setCoords();
                      canvas.renderAll();
                      canvas.requestRenderAll();
                    }}
                    onBlur={() => {
                      saveToHistory();
                      updateLayers();
                    }}
                    className="h-8 text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayerDetailsPanel;

