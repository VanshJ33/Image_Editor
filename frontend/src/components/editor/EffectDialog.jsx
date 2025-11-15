import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';

/**
 * Effect Dialog Component
 * Similar to MiniPaint's effect dialogs with preview and parameters
 */
const EffectDialog = ({ 
  open, 
  onOpenChange, 
  effect, 
  originalImage, 
  onApply 
}) => {
  const [params, setParams] = useState({});
  const previewLeftRef = useRef(null);
  const previewRightRef = useRef(null);
  const originalCanvasRef = useRef(null);

  // Initialize parameters from effect definition
  useEffect(() => {
    if (effect && effect.params) {
      const initialParams = {};
      effect.params.forEach(param => {
        initialParams[param.name] = param.value !== undefined ? param.value : 
          (param.range ? param.range[0] : 0);
      });
      setParams(initialParams);
    }
  }, [effect]);

  // Define updatePreview function BEFORE using it in useEffect
  const updatePreview = useCallback(() => {
    if (!effect || !previewRightRef.current || !originalCanvasRef.current) {
      return;
    }
    
    const rightCanvas = previewRightRef.current;
    const rightCtx = rightCanvas.getContext('2d');
    const img = originalCanvasRef.current;
    
    if (!rightCanvas || !rightCtx || !img) return;
    
    // Clear canvas
    rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);
    
    // Draw original first
    rightCtx.drawImage(img, 0, 0, rightCanvas.width, rightCanvas.height);
    
    // Apply effect preview
    if (effect.onChange) {
      effect.onChange(params, rightCtx, rightCanvas.width, rightCanvas.height, rightCanvas);
    } else if (effect.type === 'css') {
      // Apply CSS filter preview
      const value = params.value !== undefined ? params.value : (effect.defaultParams?.value || 50);
      let filterString = '';
      switch (effect.key) {
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
      }
      if (filterString) {
        // Create a temporary canvas to apply filter
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = rightCanvas.width;
        tempCanvas.height = rightCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0, rightCanvas.width, rightCanvas.height);
        
        rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);
        rightCtx.filter = filterString;
        rightCtx.drawImage(tempCanvas, 0, 0);
        rightCtx.filter = 'none';
      }
    } else if (effect.type === 'pixel' && effect.effectFunction) {
      try {
        const imageData = rightCtx.getImageData(0, 0, rightCanvas.width, rightCanvas.height);
        const result = effect.effectFunction(imageData, params);
        rightCtx.putImageData(result, 0, 0);
      } catch (error) {
        console.error('Error applying pixel effect preview:', error);
      }
    }
  }, [effect, params]);

  // Load original image to preview canvases
  useEffect(() => {
    if (open && originalImage && previewLeftRef.current && previewRightRef.current) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const leftCanvas = previewLeftRef.current;
        const rightCanvas = previewRightRef.current;
        if (!leftCanvas || !rightCanvas) return;
        
        const leftCtx = leftCanvas.getContext('2d');
        const rightCtx = rightCanvas.getContext('2d');
        
        // Set canvas size
        const maxSize = 225;
        let width = img.width;
        let height = img.height;
        const scale = Math.min(maxSize / width, maxSize / height, 1);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        
        leftCanvas.width = width;
        leftCanvas.height = height;
        rightCanvas.width = width;
        rightCanvas.height = height;
        
        // Draw original on left
        leftCtx.clearRect(0, 0, width, height);
        leftCtx.drawImage(img, 0, 0, width, height);
        
        // Store original for preview updates
        originalCanvasRef.current = img;
        
        // Trigger initial preview after image loads and params are ready
        setTimeout(() => {
          if (updatePreview && Object.keys(params).length > 0) {
            updatePreview();
          }
        }, 200);
      };
      img.onerror = (e) => {
        console.error('Error loading image for preview:', e);
      };
      img.src = originalImage;
    }
  }, [open, originalImage, effect, params, updatePreview]);

  // Update preview when parameters change
  useEffect(() => {
    if (open && params && Object.keys(params).length > 0 && originalCanvasRef.current) {
      // Use requestAnimationFrame for smooth updates
      const timeoutId = setTimeout(() => {
        updatePreview();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [params, open, updatePreview]);

  const handleParamChange = (paramName, value) => {
    setParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleApply = () => {
    if (onApply) {
      onApply(params);
    }
    onOpenChange(false);
  };

  if (!effect) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{effect.title || 'Effect'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview Area */}
          {originalImage && (
            <div className="flex gap-4 justify-center items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-center">
                <Label className="text-xs text-slate-500 mb-2 block">Original</Label>
                <canvas
                  ref={previewLeftRef}
                  className="border-2 border-slate-200 dark:border-slate-700 rounded"
                  style={{ maxWidth: '225px', maxHeight: '200px' }}
                />
              </div>
              <div className="text-center">
                <Label className="text-xs text-slate-500 mb-2 block">Preview</Label>
                <canvas
                  ref={previewRightRef}
                  className="border-2 border-slate-200 dark:border-slate-700 rounded"
                  style={{ maxWidth: '225px', maxHeight: '200px' }}
                />
              </div>
            </div>
          )}

          {/* Parameters */}
          {effect.params && effect.params.length > 0 && (
            <div className="space-y-4">
              {effect.params.map((param, index) => {
                if (!param.name) return null; // Empty param for spacing
                
                const value = params[param.name] !== undefined ? params[param.name] : 
                  (param.range ? param.range[0] : param.value || 0);

                if (param.range) {
                  // Slider parameter
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{param.title || param.name}:</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={Math.round(value * 100) / 100}
                            onChange={(e) => handleParamChange(param.name, parseFloat(e.target.value) || 0)}
                            className="w-20 h-8"
                            min={param.range[0]}
                            max={param.range[1]}
                            step={param.step || 1}
                          />
                        </div>
                      </div>
                      <Slider
                        value={[value]}
                        onValueChange={(vals) => handleParamChange(param.name, vals[0])}
                        min={param.range[0]}
                        max={param.range[1]}
                        step={param.step || 1}
                        className="w-full"
                      />
                    </div>
                  );
                } else if (param.type === 'color') {
                  // Color picker
                  return (
                    <div key={index} className="space-y-2">
                      <Label>{param.title || param.name}:</Label>
                      <Input
                        type="color"
                        value={value}
                        onChange={(e) => handleParamChange(param.name, e.target.value)}
                        className="w-full h-10"
                      />
                    </div>
                  );
                } else if (typeof param.value === 'boolean') {
                  // Checkbox
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`param-${param.name}`}
                        checked={value}
                        onChange={(e) => handleParamChange(param.name, e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor={`param-${param.name}`}>{param.title || param.name}</Label>
                    </div>
                  );
                } else {
                  // Text/Number input
                  return (
                    <div key={index} className="space-y-2">
                      <Label>{param.title || param.name}:</Label>
                      <Input
                        type={typeof param.value === 'number' ? 'number' : 'text'}
                        value={value}
                        onChange={(e) => {
                          const newValue = typeof param.value === 'number' 
                            ? parseFloat(e.target.value) || 0 
                            : e.target.value;
                          handleParamChange(param.name, newValue);
                        }}
                        placeholder={param.placeholder}
                        className="w-full"
                      />
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EffectDialog;

