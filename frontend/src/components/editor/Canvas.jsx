import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas as FabricCanvas, Line, FabricImage, Rect } from 'fabric';
import { useEditor } from '../../contexts/EditorContext';
import { motion } from 'framer-motion';
import ContextMenu from './ContextMenu';
import CropDialog from './CropDialog';
import { toast } from 'sonner';
import * as fabric from 'fabric';
import { ActiveSelection } from 'fabric';

const Canvas = () => {
  const { canvas, setCanvas, canvasRef, setActiveObject, saveToHistory, updateLayers, canvasSize, zoom, setZoom, backgroundColor, showGrid, canvasRotation, activeObject, undo, redo, isDrawingCustom, setIsDrawingCustom, customPath, setCustomPath, fillShapeWithImage } = useEditor();
  const containerRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [cropDialog, setCropDialog] = useState({ open: false, imageObject: null });

  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new FabricCanvas(canvasRef.current, {
        width: canvasSize.width,
        height: canvasSize.height,
        backgroundColor: backgroundColor,
        preserveObjectStacking: true,
        selection: true,
        enableRetinaScaling: true,
        imageSmoothingEnabled: true
      });
      
      
      fabricCanvas.set({
        cornerSize: 12,
        cornerStyle: 'rect',
        cornerColor: '#4f46e5',
        cornerStrokeColor: '#ffffff',
        borderColor: '#4f46e5',
        borderScaleFactor: 2,
        rotatingPointOffset: 40,
        transparentCorners: false,
        touchCornerSize: 16,
        centeredScaling: false,
        centeredRotation: false
      });

      fabricCanvas.on('selection:created', (e) => {
        const obj = e.selected[0];
        obj.set({
          cornerSize: 12,
          cornerStyle: 'rect',
          cornerColor: '#4f46e5',
          cornerStrokeColor: '#ffffff',
          borderColor: '#4f46e5',
          borderScaleFactor: 2,
          transparentCorners: false,
          touchCornerSize: 16,
          rotatingPointOffset: 40,
          lockScalingFlip: true,
          lockUniScaling: false,
          hasControls: true,
          hasBorders: true
        });
        fabricCanvas.renderAll();
        setActiveObject(obj);
      });

      fabricCanvas.on('selection:updated', (e) => {
        const obj = e.selected[0];
        obj.set({
          cornerSize: 12,
          cornerStyle: 'rect',
          cornerColor: '#4f46e5',
          cornerStrokeColor: '#ffffff',
          borderColor: '#4f46e5',
          borderScaleFactor: 2,
          transparentCorners: false,
          touchCornerSize: 16,
          rotatingPointOffset: 40,
          lockScalingFlip: true,
          lockUniScaling: false,
          hasControls: true,
          hasBorders: true
        });
        fabricCanvas.renderAll();
        setActiveObject(obj);
      });

      fabricCanvas.on('selection:cleared', () => {
        setActiveObject(null);
      });

      let saveTimeout;
      const debouncedSave = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          saveToHistory();
          updateLayers();
        }, 500);
      };

      fabricCanvas.on('object:modified', debouncedSave);
      fabricCanvas.on('object:added', () => updateLayers());
      fabricCanvas.on('object:removed', () => updateLayers());
      
      // Allow free movement - only prevent objects from completely disappearing
      // No constraints on object movement - users can move objects freely
      
      // Right-click context menu
      const handleContextMenu = (e) => {
        e.preventDefault();
        if (fabricCanvas.getActiveObject()) {
          setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY
          });
        }
      };
      
      const handleClick = (e) => {
        if (e.button !== 2) {
          setContextMenu({ visible: false, x: 0, y: 0 });
        }
      };
      
      fabricCanvas.wrapperEl.addEventListener('contextmenu', handleContextMenu);
      fabricCanvas.wrapperEl.addEventListener('mousedown', handleClick);

      setCanvas(fabricCanvas);

      return () => {
        fabricCanvas.wrapperEl?.removeEventListener('contextmenu', handleContextMenu);
        fabricCanvas.wrapperEl?.removeEventListener('mousedown', handleClick);
        fabricCanvas.dispose();
      };
    }
  }, []);

  const autoFitCanvas = useCallback(() => {
    if (canvas && containerRef.current) {
      const container = containerRef.current;
      const containerWidth = container.clientWidth - 100;
      const containerHeight = container.clientHeight - 100;
      
      const scaleX = containerWidth / canvasSize.width;
      const scaleY = containerHeight / canvasSize.height;
      const scale = Math.min(scaleX, scaleY, 1);
      
      const newZoom = Math.max(10, Math.round(scale * 100));
      setZoom(50);
      
      canvas.setZoom(scale);
      canvas.setWidth(canvasSize.width * scale);
      canvas.setHeight(canvasSize.height * scale);
      canvas.renderAll();
    }
  }, [canvas, canvasSize, setZoom]);

  useEffect(() => {
    if (canvas) {
      const scale = zoom / 100;
      canvas.setZoom(scale);
      canvas.setWidth(canvasSize.width * scale);
      canvas.setHeight(canvasSize.height * scale);
      canvas.renderAll();
    }
  }, [zoom, canvas, canvasSize]);

  useEffect(() => {
    if (canvas) {
      // Only set dimensions if they're actually different to avoid unnecessary re-renders
      const currentWidth = canvas.getWidth();
      const currentHeight = canvas.getHeight();
      
      if (currentWidth !== canvasSize.width || currentHeight !== canvasSize.height) {
        canvas.setDimensions(canvasSize);
        canvas.renderAll();
      }
    }
  }, [canvasSize, canvas]);

  useEffect(() => {
    autoFitCanvas();
  }, [canvasSize, autoFitCanvas]);

  useEffect(() => {
    const handleResize = () => autoFitCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [autoFitCanvas]);

  useEffect(() => {
    if (canvas) {
      canvas.backgroundColor = backgroundColor;
      canvas.renderAll();
    }
  }, [backgroundColor, canvas]);

  // Handle custom shape drawing
  useEffect(() => {
    if (!canvas || !isDrawingCustom) return;

    const handleMouseDown = (e) => {
      if (!isDrawingCustom) return;
      
      const pointer = canvas.getPointer(e.e);
      const newPath = [...customPath, { x: pointer.x, y: pointer.y }];
      setCustomPath(newPath);
      
      // Add visual indicator for the point
      const point = new fabric.Circle({
        left: pointer.x,
        top: pointer.y,
        radius: 5,
        fill: '#4f46e5',
        stroke: '#ffffff',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        name: 'customShapePoint'
      });
      
      canvas.add(point);
      
      // Draw connecting line if there are multiple points
      if (newPath.length > 1) {
        const prevPoint = newPath[newPath.length - 2];
        const line = new fabric.Line([prevPoint.x, prevPoint.y, pointer.x, pointer.y], {
          stroke: '#4f46e5',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
          name: 'customShapeLine'
        });
        canvas.add(line);
      }
      
      canvas.renderAll();
    };

    const handleRightClick = (e) => {
      e.preventDefault();
      if (!isDrawingCustom) return;
      
      // Finish custom shape
      if (customPath.length >= 3) {
        setIsDrawingCustom(false);
        toast.success('Custom shape finished. Click "Finish" to create.');
      } else {
        toast.error('Need at least 3 points to create a shape');
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.wrapperEl.addEventListener('contextmenu', handleRightClick);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.wrapperEl?.removeEventListener('contextmenu', handleRightClick);
      
      // Clear visual indicators when exiting drawing mode
      if (!isDrawingCustom) {
        const objects = canvas.getObjects();
        objects.forEach(obj => {
          if (obj.name === 'customShapePoint' || obj.name === 'customShapeLine') {
            canvas.remove(obj);
          }
        });
        canvas.renderAll();
      }
    };
  }, [canvas, isDrawingCustom, customPath]);

  useEffect(() => {
    if (canvas && showGrid) {
      const gridSize = 50;
      const width = canvasSize.width;
      const height = canvasSize.height;

      const objects = canvas.getObjects();
      objects.forEach(obj => {
        if (obj.id === 'grid-line') {
          canvas.remove(obj);
        }
      });

      for (let i = 0; i < width / gridSize; i++) {
        const line = new Line([i * gridSize, 0, i * gridSize, height], {
          stroke: '#e2e8f0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          id: 'grid-line'
        });
        canvas.add(line);
      }

      for (let i = 0; i < height / gridSize; i++) {
        const line = new Line([0, i * gridSize, width, i * gridSize], {
          stroke: '#e2e8f0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          id: 'grid-line'
        });
        canvas.add(line);
      }

      canvas.renderAll();
    } else if (canvas) {
      const objects = canvas.getObjects();
      objects.forEach(obj => {
        if (obj.id === 'grid-line') {
          canvas.remove(obj);
        }
      });
      canvas.renderAll();
    }
  }, [showGrid, canvas, canvasSize]);
  
  const handleContextMenuAction = (action) => {
    if (!activeObject || !canvas) return;
    
    switch (action) {
      case 'duplicate':
        activeObject.clone().then((cloned) => {
          cloned.set({
            left: activeObject.left + 20,
            top: activeObject.top + 20
          });
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          canvas.renderAll();
          updateLayers();
          saveToHistory();
          toast.success('Object duplicated');
        });
        break;
        
      case 'delete':
        canvas.remove(activeObject);
        canvas.renderAll();
        updateLayers();
        saveToHistory();
        toast.success('Object deleted');
        break;
        
      case 'lock':
        activeObject.set({
          selectable: !activeObject.selectable,
          evented: !activeObject.evented
        });
        canvas.renderAll();
        updateLayers();
        toast.success(activeObject.selectable ? 'Object unlocked' : 'Object locked');
        break;
        
      case 'visibility':
        activeObject.set('visible', !activeObject.visible);
        canvas.renderAll();
        updateLayers();
        toast.success(activeObject.visible ? 'Object shown' : 'Object hidden');
        break;
        
      case 'bringToFront':
        canvas.bringObjectToFront(activeObject);
        canvas.renderAll();
        updateLayers();
        saveToHistory();
        toast.success('Brought to front');
        break;
        
      case 'sendToBack':
        canvas.sendObjectToBack(activeObject);
        canvas.renderAll();
        updateLayers();
        saveToHistory();
        toast.success('Sent to back');
        break;
        
      case 'flipHorizontal':
        activeObject.set('flipX', !activeObject.flipX);
        canvas.renderAll();
        saveToHistory();
        toast.success('Flipped horizontally');
        break;
        
      case 'flipVertical':
        activeObject.set('flipY', !activeObject.flipY);
        canvas.renderAll();
        saveToHistory();
        toast.success('Flipped vertically');
        break;
        
      case 'rotate90':
        activeObject.set('angle', (activeObject.angle || 0) + 90);
        canvas.renderAll();
        saveToHistory();
        toast.success('Rotated 90°');
        break;
        
        
      case 'setBackground':
        if (activeObject.type === 'image') {
          const imgElement = activeObject.getElement();
          FabricImage.fromURL(imgElement.src, { crossOrigin: 'anonymous' }).then((img) => {
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const scaleX = canvasWidth / img.width;
            const scaleY = canvasHeight / img.height;
            const scale = Math.max(scaleX, scaleY);
            
            img.set({
              left: 0,
              top: 0,
              scaleX: scale,
              scaleY: scale,
              selectable: false,
              evented: false,
              isBackgroundImage: true
            });
            
            const existingBg = canvas.getObjects().find(obj => obj.isBackgroundImage);
            if (existingBg) canvas.remove(existingBg);
            
            canvas.remove(activeObject);
            canvas.add(img);
            canvas.sendObjectToBack(img);
            canvas.discardActiveObject();
            canvas.renderAll();
            updateLayers();
            saveToHistory();
            toast.success('Set as background');
          });
        }
        break;
        
      case 'editText':
        if (activeObject.type === 'textbox') {
          activeObject.enterEditing();
          activeObject.selectAll();
          canvas.renderAll();
          toast.success('Text editing mode activated');
        }
        break;
        
      case 'textColor':
        if (activeObject.type === 'textbox') {
          const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          activeObject.set('fill', randomColor);
          canvas.renderAll();
          saveToHistory();
          toast.success('Text color changed');
        }
        break;
        
      case 'crop':
        if (activeObject.type === 'image') {
          setCropDialog({ open: true, imageObject: activeObject });
          setContextMenu({ visible: false, x: 0, y: 0 });
          toast.success('Crop mode activated');
        }
        break;
        
      case 'fillWithImage':
        fillShapeWithImage();
        break;
        
      default:
        break;
    }
  };
  
  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ visible: false, x: 0, y: 0 });
    };
    
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      
      const isCtrl = e.ctrlKey || e.metaKey;
      
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (activeObject && canvas) {
            canvas.remove(activeObject);
            canvas.renderAll();
            updateLayers();
            saveToHistory();
            e.preventDefault();
          }
          break;
          
        case 'd':
          if (isCtrl && activeObject && canvas) {
            activeObject.clone().then((cloned) => {
              cloned.set({
                left: activeObject.left + 20,
                top: activeObject.top + 20
              });
              canvas.add(cloned);
              canvas.setActiveObject(cloned);
              canvas.renderAll();
              updateLayers();
              saveToHistory();
            });
            e.preventDefault();
          }
          break;
          
        case 'z':
          if (isCtrl && !e.shiftKey) {
            undo();
            e.preventDefault();
          }
          break;
          
        case 'y':
          if (isCtrl) {
            redo();
            e.preventDefault();
          }
          break;
          
        case 'Z':
          if (isCtrl && e.shiftKey) {
            redo();
            e.preventDefault();
          }
          break;
          
        case 'a':
          if (isCtrl && canvas) {
            canvas.discardActiveObject();
            const selection = new fabric.ActiveSelection(canvas.getObjects(), {
              canvas: canvas,
            });
            canvas.setActiveObject(selection);
            canvas.requestRenderAll();
            e.preventDefault();
          }
          break;
          
        case 'c':
          if (isCtrl && activeObject) {
            activeObject.clone().then((cloned) => {
              window.clipboardObject = cloned;
            });
            e.preventDefault();
          }
          break;
          
        case 'v':
          if (isCtrl && window.clipboardObject && canvas) {
            window.clipboardObject.clone().then((cloned) => {
              cloned.set({
                left: cloned.left + 20,
                top: cloned.top + 20
              });
              canvas.add(cloned);
              canvas.setActiveObject(cloned);
              canvas.renderAll();
              updateLayers();
              saveToHistory();
            });
            e.preventDefault();
          }
          break;
          
        case 'ArrowUp':
          if (activeObject && canvas) {
            activeObject.set('top', activeObject.top - (e.shiftKey ? 10 : 1));
            canvas.renderAll();
            saveToHistory();
            e.preventDefault();
          }
          break;
          
        case 'ArrowDown':
          if (activeObject && canvas) {
            activeObject.set('top', activeObject.top + (e.shiftKey ? 10 : 1));
            canvas.renderAll();
            saveToHistory();
            e.preventDefault();
          }
          break;
          
        case 'ArrowLeft':
          if (activeObject && canvas) {
            activeObject.set('left', activeObject.left - (e.shiftKey ? 10 : 1));
            canvas.renderAll();
            saveToHistory();
            e.preventDefault();
          }
          break;
          
        case 'ArrowRight':
          if (activeObject && canvas) {
            activeObject.set('left', activeObject.left + (e.shiftKey ? 10 : 1));
            canvas.renderAll();
            saveToHistory();
            e.preventDefault();
          }
          break;
          
        case 'Escape':
          if (canvas) {
            canvas.discardActiveObject();
            canvas.renderAll();
            setContextMenu({ visible: false, x: 0, y: 0 });
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeObject, canvas, updateLayers, saveToHistory, undo, redo]);

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 overflow-hidden" ref={containerRef}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative group"
      >
        <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200/50 dark:ring-slate-700/50 bg-white dark:bg-slate-800">
          <canvas 
            ref={canvasRef} 
            className="block" 
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
              transform: `rotate(${canvasRotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
          />
          
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {zoom}%
          </div>
          
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {canvasSize.width} × {canvasSize.height}
          </div>
        </div>
      </motion.div>
      
      <ContextMenu
        isVisible={contextMenu.visible}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        onClose={() => setContextMenu({ visible: false, x: 0, y: 0 })}
        activeObject={activeObject}
        onAction={handleContextMenuAction}
      />
      
      <CropDialog
        isOpen={cropDialog.open}
        onClose={() => setCropDialog({ open: false, imageObject: null })}
        imageObject={cropDialog.imageObject}
      />
    </div>
  );
};

export default Canvas;