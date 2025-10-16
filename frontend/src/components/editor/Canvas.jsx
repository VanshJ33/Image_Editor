import React, { useEffect, useRef } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { useEditor } from '../../contexts/EditorContext';
import { motion } from 'framer-motion';

const Canvas = () => {
  const { canvas, setCanvas, canvasRef, setActiveObject, saveToHistory, updateLayers, canvasSize, zoom } = useEditor();
  const containerRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new FabricCanvas(canvasRef.current, {
        width: canvasSize.width,
        height: canvasSize.height,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        selection: true,
        renderOnAddRemove: false,
        enableRetinaScaling: true,
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
