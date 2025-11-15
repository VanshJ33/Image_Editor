import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas as FabricCanvas, Line, FabricImage, Rect, Point, util } from 'fabric';
import { useEditor } from '../../contexts/EditorContext';
import { motion } from 'framer-motion';
import ContextMenu from './ContextMenu';
import CropDialog from './CropDialog';
import { toast } from 'sonner';
import * as fabric from 'fabric';
import { ActiveSelection } from 'fabric';
import AnimatedGifHandler from '../../utils/animated-gif-handler';
import { initPixi, getPixiApp, resizePixi, destroyPixi, isPixiAvailable } from '../../utils/pixiLayer';
import { setupFabricPixiSync } from '../../utils/fabricPixiSync';
import { syncToPixi, syncResize } from '../../utils/viewportSync';


// Minimal importer: Excalidraw -> Fabric objects (ellipse, text, arrow)
function importExcalidrawToFabric(canvas, scene) {
  try {
    if (!canvas || !scene || !Array.isArray(scene.elements)) return false;

    const mapDash = (style, width) => {
      if (style === 'dashed') return [width * 4, width * 3];
      if (style === 'dotted') return [width, width * 2];
      return undefined;
    };

    const mapFont = (id) => {
      switch (id) {
        case 1: return 'Virgil, Segoe UI, Arial, sans-serif';
        case 2: return 'Helvetica, Arial, sans-serif';
        case 3: return 'Cascadia Code, Consolas, monospace';
        default: return 'Arial, sans-serif';
      }
    };

    const addArrowHead = (x1, y1, x2, y2, stroke, strokeWidth) => {
      // Build a triangle polygon oriented along the line direction
      const angleRad = Math.atan2(y2 - y1, x2 - x1);
      const headLen = Math.max(10, strokeWidth * 4);
      const headWidth = Math.max(6, strokeWidth * 2.5);
      const backX = x2 - headLen * Math.cos(angleRad);
      const backY = y2 - headLen * Math.sin(angleRad);
      const leftX = backX + headWidth * Math.sin(angleRad);
      const leftY = backY - headWidth * Math.cos(angleRad);
      const rightX = backX - headWidth * Math.sin(angleRad);
      const rightY = backY + headWidth * Math.cos(angleRad);
      return new fabric.Polygon([
        { x: x2, y: y2 },
        { x: leftX, y: leftY },
        { x: rightX, y: rightY },
      ], {
        fill: stroke,
        stroke: stroke,
        strokeWidth: 0,
        selectable: false,
        evented: false,
      });
    };

    scene.elements.forEach((el) => {
      const opacity = (el.opacity ?? 100) / 100;
      const angleDeg = el.angle ? (el.angle * 180) / Math.PI : 0;
      const stroke = el.strokeColor || '#0f172a';
      const fill = el.backgroundColor && el.backgroundColor !== 'transparent' ? el.backgroundColor : 'transparent';
      const strokeWidth = el.strokeWidth || 1;
      const dashArray = mapDash(el.strokeStyle, strokeWidth);
      const roundness = el.roundness && el.roundness.type ? Math.min((Math.min(el.width || 0, el.height || 0)) * 0.15, 20) : 0;

      switch (el.type) {
        case 'ellipse': {
          const obj = new fabric.Ellipse({
            left: el.x,
            top: el.y,
            rx: (el.width || 0) / 2,
            ry: (el.height || 0) / 2,
            fill,
            stroke,
            strokeWidth,
            strokeDashArray: dashArray,
            opacity,
            angle: angleDeg,
            originX: 'left',
            originY: 'top',
          });
          canvas.add(obj);
          break;
        }
        case 'rectangle': {
          const obj = new fabric.Rect({
            left: el.x,
            top: el.y,
            width: el.width || 0,
            height: el.height || 0,
            rx: roundness,
            ry: roundness,
            fill,
            stroke,
            strokeWidth,
            strokeDashArray: dashArray,
            opacity,
            angle: angleDeg,
            originX: 'left',
            originY: 'top',
          });
          canvas.add(obj);
          break;
        }
        case 'diamond': {
          const w = el.width || 0;
          const h = el.height || 0;
          const points = [
            { x: w / 2, y: 0 },
            { x: w, y: h / 2 },
            { x: w / 2, y: h },
            { x: 0, y: h / 2 },
          ];
          const obj = new fabric.Polygon(points, {
            left: el.x,
            top: el.y,
            fill,
            stroke,
            strokeWidth,
            strokeDashArray: dashArray,
            opacity,
            angle: angleDeg,
            originX: 'left',
            originY: 'top',
          });
          canvas.add(obj);
          break;
        }
        case 'line': {
          const p0 = (el.points && el.points[0]) || [0, 0];
          const p1 = (el.points && el.points[1]) || [0, 0];
          const x1 = el.x + p0[0];
          const y1 = el.y + p0[1];
          const x2 = el.x + p1[0];
          const y2 = el.y + p1[1];
          const line = new fabric.Line([x1, y1, x2, y2], {
            stroke,
            strokeWidth: el.strokeWidth || 2,
            strokeDashArray: dashArray,
            opacity,
          });
          canvas.add(line);
          break;
        }
        case 'freedraw': {
          const pts = Array.isArray(el.points) ? el.points.map(([px, py]) => ({ x: el.x + px, y: el.y + py })) : [];
          if (pts.length >= 2) {
            const obj = new fabric.Polyline(pts, {
              fill: 'transparent',
              stroke,
              strokeWidth: el.strokeWidth || 2,
              strokeDashArray: dashArray,
              opacity,
            });
            canvas.add(obj);
          }
          break;
        }
        case 'text': {
          const obj = new fabric.Textbox(el.text || '', {
            left: el.x,
            top: el.y,
            width: el.width || undefined,
            fill: stroke,
            fontSize: el.fontSize || 20,
            fontFamily: mapFont(el.fontFamily),
            textAlign: el.textAlign || 'left',
            opacity,
            angle: angleDeg,
            originX: 'left',
            originY: 'top',
          });
          canvas.add(obj);
          break;
        }
        case 'arrow': {
          const p0 = (el.points && el.points[0]) || [0, 0];
          const p1 = (el.points && el.points[1]) || [0, 0];
          const x1 = el.x + p0[0];
          const y1 = el.y + p0[1];
          const x2 = el.x + p1[0];
          const y2 = el.y + p1[1];
          const line = new fabric.Line([x1, y1, x2, y2], {
            stroke,
            strokeWidth: el.strokeWidth || 2,
            strokeDashArray: dashArray,
            opacity,
          });
          if (el.endArrowhead === 'arrow' || el.startArrowhead === 'arrow') {
            const parts = [line];
            if (el.endArrowhead === 'arrow') parts.push(addArrowHead(x1, y1, x2, y2, stroke, strokeWidth));
            if (el.startArrowhead === 'arrow') parts.push(addArrowHead(x2, y2, x1, y1, stroke, strokeWidth));
            const group = new fabric.Group(parts, { subTargetCheck: true });
            canvas.add(group);
          } else {
            canvas.add(line);
          }
          break;
        }
        default:
          try { console.debug('[editor] unsupported excalidraw type:', el.type); } catch (_) {}
          break;
      }
    });

    canvas.renderAll();
    return true;
  } catch (err) {
    console.error('Import Excalidraw -> Fabric failed:', err);
    return false;
  }
}

const Canvas = () => {
  const { canvas, setCanvas, canvasRef, setActiveObject, saveToHistory, updateLayers, canvasSize, zoom, setZoom, backgroundColor, showGrid, canvasRotation, activeObject, undo, redo, isDrawingCustom, setIsDrawingCustom, customPath, setCustomPath, fillShapeWithImage, createBoard, switchBoard, boards, setGifHandler } = useEditor();
  const containerRef = useRef(null);
  const pixiContainerRef = useRef(null);
  const pixiInitializedRef = useRef(false);

  const gifHandlerRef = useRef(null);
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
        centeredRotation: false,
        controlsAboveOverlay: false
      });
      
      // Disable default dimension overlay
      fabricCanvas.controlsAboveOverlay = false;

      // Custom overlay for object dimensions
      const renderObjectDimensions = (ctx) => {
        const activeObject = fabricCanvas.getActiveObject();
        if (!activeObject || activeObject.type === 'activeSelection') return;
        
        const bounds = activeObject.getBoundingRect();
        const zoom = fabricCanvas.getZoom();
        const vpt = fabricCanvas.viewportTransform;
        
        // Calculate position on canvas
        const x = bounds.left + bounds.width / 2;
        const y = bounds.top - 20;
        
        // Transform to viewport coordinates
        const point = new Point(x, y).transform(util.multiplyTransformMatrices(vpt, [zoom, 0, 0, zoom, 0, 0]));
        
        // Round dimensions
        const width = Math.round(bounds.width);
        const height = Math.round(bounds.height);
        
        // Draw background
        const text = `${width} × ${height}`;
        ctx.save();
        ctx.font = '12px Inter, sans-serif';
        const textWidth = ctx.measureText(text).width;
        const padding = 8;
        const bgWidth = textWidth + padding * 2;
        const bgHeight = 24;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(point.x - bgWidth / 2, point.y - bgHeight / 2, bgWidth, bgHeight);
        
        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, point.x, point.y);
        ctx.restore();
      };
      
      // Override after:render to show dimensions
      fabricCanvas.on('after:render', () => {
        const activeObject = fabricCanvas.getActiveObject();
        if (activeObject && activeObject.type !== 'activeSelection') {
          const ctx = fabricCanvas.getContext();
          renderObjectDimensions(ctx);
        }
      });

      fabricCanvas.on('selection:created', (e) => {
        const obj = e.selected[0];
        // Don't show selection border box for GIF objects, but keep resize handles
        if (obj.isAnimatedGif) {
          // Override the _renderBorders method to prevent selection box rendering
          // But keep controls (handles) visible for resizing
          if (!obj._renderBordersOverridden) {
            obj._renderBorders = function(ctx) {
              // Don't render borders/selection box for GIF objects
              return;
            };
            // Also override _drawBorder to ensure no border is drawn
            obj._drawBorder = function(ctx) {
              // Don't draw border for GIF objects
              return;
            };
            obj._renderBordersOverridden = true;
          }
          
          obj.set({
            opacity: 0,
            borderColor: 'transparent',
            borderScaleFactor: 0,
            hasBorders: false,
            // Ensure border is not drawn
            strokeWidth: 0,
            stroke: 'transparent',
            // Enable controls (handles) for resizing
            hasControls: true,
            cornerColor: '#4f46e5',
            cornerStrokeColor: '#ffffff',
            cornerSize: 12,
            cornerStyle: 'rect',
            transparentCorners: false,
            touchCornerSize: 16,
            rotatingPointOffset: 40,
            lockScalingFlip: true,
            lockUniScaling: false
          });
        } else {
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
        }
        
        fabricCanvas.renderAll();
        setActiveObject(obj);
      });

      fabricCanvas.on('selection:updated', (e) => {
        const obj = e.selected[0];
        // Don't show selection border box for GIF objects, but keep resize handles
        if (obj.isAnimatedGif) {
          // Override the _renderBorders method to prevent selection box rendering
          // But keep controls (handles) visible for resizing
          if (!obj._renderBordersOverridden) {
            obj._renderBorders = function(ctx) {
              // Don't render borders/selection box for GIF objects
              return;
            };
            // Also override _drawBorder to ensure no border is drawn
            obj._drawBorder = function(ctx) {
              // Don't draw border for GIF objects
              return;
            };
            obj._renderBordersOverridden = true;
          }
          
          obj.set({
            opacity: 0,
            borderColor: 'transparent',
            borderScaleFactor: 0,
            hasBorders: false,
            // Ensure border is not drawn
            strokeWidth: 0,
            stroke: 'transparent',
            // Enable controls (handles) for resizing
            hasControls: true,
            cornerColor: '#4f46e5',
            cornerStrokeColor: '#ffffff',
            cornerSize: 12,
            cornerStyle: 'rect',
            transparentCorners: false,
            touchCornerSize: 16,
            rotatingPointOffset: 40,
            lockScalingFlip: true,
            lockUniScaling: false
          });
        } else {
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
            hasBorders: true,
            controlsAboveOverlay: false
          });
          
          // Override _renderControls to prevent default dimension display
          if (!obj._dimensionOverlayDisabled) {
            const originalRenderControls = obj._renderControls;
            obj._renderControls = function(ctx) {
              if (originalRenderControls) {
                originalRenderControls.call(this, ctx);
              }
              // Don't render default dimension overlay
            };
            obj._dimensionOverlayDisabled = true;
          }
        }
        
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

      // Initialize GIF handler
      const gifHandler = new AnimatedGifHandler(fabricCanvas);
      gifHandlerRef.current = gifHandler;
      setGifHandler(gifHandler);

      // After canvas initializes, handle payload from Mind Map
      setTimeout(() => {
        try {
          // Load mindmap template if present
          const templateRaw = localStorage.getItem('mindmap-template');
          if (templateRaw) {
            const template = JSON.parse(templateRaw);
            if (template.timestamp && (Date.now() - template.timestamp < 60000)) { // 1 minute
              const ok = importExcalidrawToFabric(fabricCanvas, template);
              if (ok) {
                updateLayers();
                saveToHistory();
                // Loaded mindmap as template
                localStorage.removeItem('mindmap-template');
                return;
              }
            }
          }

          // Load Excalidraw scene (editable) if present
          const sceneKeys = ['excali-save', 'handoff:excalidrawSceneToEditor', 'excalidraw-local-save'];
          for (const key of sceneKeys) {
            const alreadyImported = sessionStorage.getItem(`imported:${key}`);
            const raw = window.localStorage.getItem(key);
            if (raw && !alreadyImported) {
              try {
                const scene = JSON.parse(raw);
                const ok = importExcalidrawToFabric(fabricCanvas, scene);
                if (ok) {
                  sessionStorage.setItem(`imported:${key}`, '1');
                  updateLayers();
                  saveToHistory();
                  // Loaded Excalidraw scene
                  // Do NOT remove keys automatically to avoid disappearance during debugging
                } else {
                  // Failed to load Excalidraw scene
                }
              } catch (e) {
                console.error('Invalid Excalidraw scene:', e);
              }
              break;
            } else {
              try { console.debug(`[editor] scene key not found or already imported: ${key}`); } catch (_) {}
            }
          }

          // Load full board image as background
          const rawImg = localStorage.getItem('handoff:mindmapImageToEditor');
          if (rawImg) {
            try { console.debug('[editor] consuming handoff:mindmapImageToEditor'); } catch (_) {}
            const data = JSON.parse(rawImg || '{}');
            const src = data && data.dataURL;
            if (src) {
              // Create a new board and switch to it
              createBoard && createBoard();
              // Wait a tick for state update before applying background
              setTimeout(() => {
                FabricImage.fromURL(src, { crossOrigin: 'anonymous' }).then((img) => {
                  const canvasWidth = fabricCanvas.getWidth();
                  const canvasHeight = fabricCanvas.getHeight();
                  const scaleX = canvasWidth / img.width;
                  const scaleY = canvasHeight / img.height;
                  const scale = Math.max(scaleX, scaleY);
                  img.set({
                    left: 0,
                    top: 0,
                    scaleX: scale,
                    scaleY: scale,
                    selectable: true,
                    evented: true,
                    isBackgroundImage: true
                  });
                  const existingBg = fabricCanvas.getObjects().find(obj => obj.isBackgroundImage);
                  if (existingBg) fabricCanvas.remove(existingBg);
                  fabricCanvas.add(img);
                  fabricCanvas.sendObjectToBack(img);
                  fabricCanvas.discardActiveObject();
                  fabricCanvas.renderAll();
                  updateLayers();
                  saveToHistory();
                  // Board loaded from Mind Map
                  // Delay removal so you can see it in devtools briefly
                  setTimeout(() => localStorage.removeItem('handoff:mindmapImageToEditor'), 5000);
                });
              }, 0);
            }
          }

           // If pending export, poll briefly for the payload to appear
           const pending = localStorage.getItem('handoff:mindmapImageToEditorPending');
           if (pending && !rawImg) {
             let attempts = 0;
             const maxAttempts = 150; // ~15s at 100ms
             const iv = setInterval(() => {
               const ready = localStorage.getItem('handoff:mindmapImageToEditor');
               attempts++;
               if (ready) {
                 clearInterval(iv);
                 try { console.debug('[editor] clearing handoff:mindmapImageToEditorPending'); } catch (_) {}
                 localStorage.removeItem('handoff:mindmapImageToEditorPending');
                 const data = JSON.parse(ready || '{}');
                 const src2 = data && data.dataURL;
                 if (src2) {
                   FabricImage.fromURL(src2, { crossOrigin: 'anonymous' }).then((img) => {
                     const canvasWidth = fabricCanvas.getWidth();
                     const canvasHeight = fabricCanvas.getHeight();
                     const scaleX = canvasWidth / img.width;
                     const scaleY = canvasHeight / img.height;
                     const scale = Math.max(scaleX, scaleY);
                     img.set({
                       left: 0,
                       top: 0,
                       scaleX: scale,
                       scaleY: scale,
                       selectable: true,
                       evented: true,
                       isBackgroundImage: true
                     });
                     const existingBg = fabricCanvas.getObjects().find(obj => obj.isBackgroundImage);
                     if (existingBg) fabricCanvas.remove(existingBg);
                     fabricCanvas.add(img);
                     fabricCanvas.sendObjectToBack(img);
                     fabricCanvas.discardActiveObject();
                     fabricCanvas.renderAll();
                     updateLayers();
                     saveToHistory();
                     // Board loaded from Mind Map
                    // Delay removal so you can see it in devtools briefly
                    setTimeout(() => localStorage.removeItem('handoff:mindmapImageToEditor'), 5000);
                  });
                 }
               } else if (attempts >= maxAttempts) {
                 clearInterval(iv);
                 localStorage.removeItem('handoff:mindmapImageToEditorPending');
               }
             }, 100);
           }

          const raw = localStorage.getItem('handoff:mindmapToEditor');
          if (raw) {
            localStorage.removeItem('handoff:mindmapToEditor');
            const data = JSON.parse(raw || '{}');
            const text = data && data.text ? String(data.text) : 'Mind Map Node';
            const textbox = new fabric.Textbox(text, {
              left: (fabricCanvas.getWidth() || 800) / 2 - 150,
              top: (fabricCanvas.getHeight() || 600) / 2 - 25,
              width: 300,
              fontSize: 28,
              fill: '#0f172a',
              fontFamily: 'Arial',
            });
            fabricCanvas.add(textbox);
            fabricCanvas.setActiveObject(textbox);
            fabricCanvas.renderAll();
            updateLayers();
            saveToHistory();
            // Added from Mind Map
          }
        } catch (_) {}
      }, 0);

      // Observe localStorage changes across tabs to detect deletions
      try {
        const handler = (e) => {
          if (!e || !e.key) return;
          if (e.key.indexOf('excali') >= 0 || e.key.indexOf('handoff:') === 0) {
            try { console.debug('[editor] storage change', { key: e.key, old: !!e.oldValue, new: !!e.newValue }); } catch (_) {}
          }
        };
        window.addEventListener('storage', handler);
        // Remove on dispose below
        (fabricCanvas)._storageHandler = handler;
      } catch (_) {}

      return () => {
        fabricCanvas.wrapperEl?.removeEventListener('contextmenu', handleContextMenu);
        fabricCanvas.wrapperEl?.removeEventListener('mousedown', handleClick);
        try { if ((fabricCanvas)._storageHandler) window.removeEventListener('storage', (fabricCanvas)._storageHandler); } catch (_) {}
        
        // Clean up GIF handler
        if (gifHandlerRef.current) {
          gifHandlerRef.current.destroy();
          gifHandlerRef.current = null;
        }
        
        // Clean up PixiJS
        if (pixiInitializedRef.current) {
          try {
            destroyPixi();
            pixiInitializedRef.current = false;
          } catch (error) {
            console.warn('Error destroying PixiJS:', error);
          }
        }
        
        fabricCanvas.dispose();
      };
    }
  }, []);

  // Initialize PixiJS after container is mounted
  useEffect(() => {
    if (canvas && pixiContainerRef.current && !pixiInitializedRef.current) {
      try {
        const pixiApp = initPixi(pixiContainerRef.current, {
          width: canvasSize.width,
          height: canvasSize.height,
          backgroundColor: backgroundColor === 'transparent' ? 0xffffff : (typeof backgroundColor === 'string' && backgroundColor.startsWith('#') 
            ? parseInt(backgroundColor.slice(1), 16) 
            : 0xffffff)
        });
        
        if (pixiApp) {
          pixiInitializedRef.current = true;
          console.log('PixiJS initialized successfully for GPU acceleration');
          
          // Setup Fabric-Pixi synchronization
          setupFabricPixiSync(canvas);
          
          // Sync initial viewport
          syncToPixi(canvas);
          syncResize(canvas);
        } else {
          console.warn('PixiJS initialization failed, continuing with Fabric-only rendering');
        }
      } catch (error) {
        console.warn('PixiJS initialization error:', error);
        // Continue with Fabric-only rendering
      }
    }
  }, [canvas, canvasSize, backgroundColor]);

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
      
      // Sync viewport to Pixi
      if (isPixiAvailable()) {
        syncToPixi(canvas);
        syncResize(canvas);
      }
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
        
        // Sync resize to Pixi
        if (isPixiAvailable()) {
          resizePixi(canvasSize.width, canvasSize.height);
          syncResize(canvas);
        }
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
      
      // Update Pixi background color if available
      if (isPixiAvailable()) {
        const pixiApp = getPixiApp();
        if (pixiApp) {
          const bgColor = backgroundColor === 'transparent' ? 0xffffff : (typeof backgroundColor === 'string' && backgroundColor.startsWith('#') 
            ? parseInt(backgroundColor.slice(1), 16) 
            : 0xffffff);
          pixiApp.renderer.backgroundColor = bgColor;
        }
      }
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
        // Custom shape finished
      } else {
        // Need at least 3 points to create a shape
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
          // Object duplicated
        });
        break;
        
      case 'delete':
        canvas.remove(activeObject);
        canvas.renderAll();
        updateLayers();
        saveToHistory();
        // Object deleted
        break;
        
      case 'lock':
        activeObject.set({
          selectable: !activeObject.selectable,
          evented: !activeObject.evented
        });
        canvas.renderAll();
        updateLayers();
        // Object lock toggled
        break;
        
      case 'visibility':
        activeObject.set('visible', !activeObject.visible);
        canvas.renderAll();
        updateLayers();
        // Object visibility toggled
        break;
        
      case 'bringToFront':
        canvas.bringObjectToFront(activeObject);
        canvas.renderAll();
        updateLayers();
        saveToHistory();
        // Brought to front
        break;
        
      case 'sendToBack':
        canvas.sendObjectToBack(activeObject);
        canvas.renderAll();
        updateLayers();
        saveToHistory();
        // Sent to back
        break;
        
      case 'flipHorizontal':
        activeObject.set('flipX', !activeObject.flipX);
        canvas.renderAll();
        saveToHistory();
        // Flipped horizontally
        break;
        
      case 'flipVertical':
        activeObject.set('flipY', !activeObject.flipY);
        canvas.renderAll();
        saveToHistory();
        // Flipped vertically
        break;
        
      case 'rotate90':
        activeObject.set('angle', (activeObject.angle || 0) + 90);
        canvas.renderAll();
        saveToHistory();
        // Rotated 90°
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
            // Set as background
          });
        }
        break;
        
      case 'editText':
        if (activeObject.type === 'textbox') {
          activeObject.enterEditing();
          activeObject.selectAll();
          canvas.renderAll();
          // Text editing mode activated
        }
        break;
        
      case 'textColor':
        if (activeObject.type === 'textbox') {
          const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          activeObject.set('fill', randomColor);
          canvas.renderAll();
          saveToHistory();
          // Text color changed
        }
        break;
        
      case 'crop':
        if (activeObject.type === 'image') {
          setCropDialog({ open: true, imageObject: activeObject });
          setContextMenu({ visible: false, x: 0, y: 0 });
          // Crop mode activated
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
          {/* PixiJS canvas container (background layer for GPU rendering) */}
          <div 
            ref={pixiContainerRef}
            className="absolute inset-0"
            style={{
              zIndex: 0,
              pointerEvents: 'none',
              transform: `rotate(${canvasRotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
          />
          {/* FabricJS canvas (foreground layer for interactions) */}
          <canvas 
            ref={canvasRef} 
            className="block relative" 
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
              transform: `rotate(${canvasRotation}deg)`,
              transition: 'transform 0.3s ease',
              zIndex: 1,
              position: 'relative'
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