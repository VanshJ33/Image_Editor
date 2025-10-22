import React, { useEffect, useRef, useCallback } from 'react';
import { Canvas as FabricCanvas, Line } from 'fabric';
import { useEditor } from '../../contexts/EditorContext';
import { motion } from 'framer-motion';

const Canvas = () => {
  const { canvas, setCanvas, canvasRef, setActiveObject, saveToHistory, updateLayers, canvasSize, zoom, setZoom, backgroundColor, showGrid, canvasRotation } = useEditor();
  const containerRef = useRef(null);

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

      setCanvas(fabricCanvas);

      return () => {
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
    </div>
  );
};

export default Canvas;