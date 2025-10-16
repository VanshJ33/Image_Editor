import React, { useEffect, useRef } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { useEditor } from '../../contexts/EditorContext';
import { motion } from 'framer-motion';

const Canvas = () => {
  const { canvas, setCanvas, canvasRef, setActiveObject, saveToHistory, updateLayers, canvasSize, zoom, backgroundColor, showGrid } = useEditor();
  const containerRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new FabricCanvas(canvasRef.current, {
        width: canvasSize.width,
        height: canvasSize.height,
        backgroundColor: backgroundColor,
        preserveObjectStacking: true,
        selection: true,
        renderOnAddRemove: false,
        enableRetinaScaling: true,
        snapAngle: 15,
        snapThreshold: 10,
      });

      // Enable snapping
      fabricCanvas.on('object:moving', (e) => {
        const obj = e.target;
        const snapZone = 10;
        
        // Snap to canvas edges
        if (Math.abs(obj.left) < snapZone) obj.left = 0;
        if (Math.abs(obj.top) < snapZone) obj.top = 0;
        if (Math.abs(obj.left + obj.width * obj.scaleX - fabricCanvas.width) < snapZone) {
          obj.left = fabricCanvas.width - obj.width * obj.scaleX;
        }
        if (Math.abs(obj.top + obj.height * obj.scaleY - fabricCanvas.height) < snapZone) {
          obj.top = fabricCanvas.height - obj.height * obj.scaleY;
        }

        // Snap to center
        const centerX = fabricCanvas.width / 2;
        const centerY = fabricCanvas.height / 2;
        const objCenterX = obj.left + (obj.width * obj.scaleX) / 2;
        const objCenterY = obj.top + (obj.height * obj.scaleY) / 2;

        if (Math.abs(objCenterX - centerX) < snapZone) {
          obj.left = centerX - (obj.width * obj.scaleX) / 2;
        }
        if (Math.abs(objCenterY - centerY) < snapZone) {
          obj.top = centerY - (obj.height * obj.scaleY) / 2;
        }
      });

      fabricCanvas.on('selection:created', (e) => {
        setActiveObject(e.selected[0]);
      });

      fabricCanvas.on('selection:updated', (e) => {
        setActiveObject(e.selected[0]);
      });

      fabricCanvas.on('selection:cleared', () => {
        setActiveObject(null);
      });

      fabricCanvas.on('object:modified', () => {
        saveToHistory();
        updateLayers();
      });

      fabricCanvas.on('object:added', () => {
        updateLayers();
      });

      fabricCanvas.on('object:removed', () => {
        updateLayers();
      });

      setCanvas(fabricCanvas);

      return () => {
        fabricCanvas.dispose();
      };
    }
  }, []);

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
      canvas.backgroundColor = backgroundColor;
      canvas.renderAll();
    }
  }, [backgroundColor, canvas]);

  // Draw grid
  useEffect(() => {
    if (canvas && showGrid) {
      const gridSize = 50;
      const width = canvasSize.width;
      const height = canvasSize.height;

      // Remove existing grid lines
      const objects = canvas.getObjects();
      objects.forEach(obj => {
        if (obj.id === 'grid-line') {
          canvas.remove(obj);
        }
      });

      // Draw vertical lines
      for (let i = 0; i < width / gridSize; i++) {
        const line = new fabric.Line([i * gridSize, 0, i * gridSize, height], {
          stroke: '#e2e8f0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          id: 'grid-line'
        });
        canvas.add(line);
        canvas.sendToBack(line);
      }

      // Draw horizontal lines
      for (let i = 0; i < height / gridSize; i++) {
        const line = new fabric.Line([0, i * gridSize, width, i * gridSize], {
          stroke: '#e2e8f0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          id: 'grid-line'
        });
        canvas.add(line);
        canvas.sendToBack(line);
      }

      canvas.renderAll();
    } else if (canvas) {
      // Remove grid
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
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8 overflow-auto" ref={containerRef}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="shadow-2xl rounded-lg overflow-hidden"
        style={{ willChange: 'transform' }}
      >
        <canvas ref={canvasRef} className="border border-slate-300 dark:border-slate-700" />
      </motion.div>
    </div>
  );
};

export default Canvas;
