import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { useEditor } from '../../contexts/EditorContext.tsx';
import { Undo, Redo, Download, Save, Plus, ZoomIn, ZoomOut, Moon, Sun, Grid3x3, ArrowUp, ArrowDown, Copy, Trash2, Keyboard, RotateCcw, Maximize2, Layers, RotateCw, Minimize2, CloudUpload, FileText, Image as ImageIcon, Eye, Menu, X, Printer, Link, FileImage, FlipHorizontal, FlipVertical, Expand, Crop, Info, Palette, BarChart3, Move, Sparkles, Scissors, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Toaster } from '../ui/sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { ScrollArea } from '../ui/scroll-area';
import { saveCanvasToOrganization } from '../../utils/canvasSave';
import { FabricImage, filters } from 'fabric';
import * as fabric from 'fabric';
import { HSLAdjustment, ColorTransformFilter } from '../../utils/imageFilters';
import { effectDefinitions, applyCSSFilter, applyPixelEffect } from '../../utils/imageEffects';
import EffectDialog from './EffectDialog';

// Effect Preview Item Component - Using Fabric.js filters
const EffectPreviewItem = ({ effect, previewCanvas, onApply }) => {
  const canvasRef = React.useRef(null);
  const fabricCanvasRef = React.useRef(null);

  React.useEffect(() => {
    if (previewCanvas && canvasRef.current) {
      // Create mini Fabric.js canvas for preview
      if (!fabricCanvasRef.current) {
        fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
          width: 120,
          height: 120,
          selection: false,
          interactive: false
        });
      }
      
      const miniCanvas = fabricCanvasRef.current;
      miniCanvas.clear();
      
      // Create image from preview canvas
      const imgElement = new Image();
      imgElement.onload = () => {
        const fabricImg = new fabric.Image(imgElement, {
          left: 0,
          top: 0,
          scaleX: 120 / imgElement.width,
          scaleY: 120 / imgElement.height,
          selectable: false,
          evented: false
        });
        
        // Apply Fabric.js filter based on effect type
        const value = effect.defaultParams?.value || 50;
        const filterArray = [];
        
        switch (effect.key) {
          case 'blur':
            filterArray.push(new filters.Blur({ blur: value / 100 }));
            break;
          case 'sepia':
            filterArray.push(new filters.Sepia());
            break;
          case 'brightness':
            filterArray.push(new filters.Brightness({ brightness: (value - 50) / 100 }));
            break;
          case 'contrast':
            filterArray.push(new filters.Contrast({ contrast: (value - 50) / 100 }));
            break;
          case 'saturate':
          case 'saturation':
            filterArray.push(new filters.Saturation({ saturation: (value - 50) / 100 }));
            break;
        }
        
        if (filterArray.length > 0) {
          fabricImg.filters = filterArray;
          fabricImg.applyFilters();
        }
        miniCanvas.add(fabricImg);
        miniCanvas.renderAll();
      };
      imgElement.src = previewCanvas.toDataURL();
    }
    
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [previewCanvas, effect]);

  return (
    <motion.button
      onClick={onApply}
      className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50 dark:bg-slate-800 transition-all hover:scale-105"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={effect.title}
    >
      <canvas
        ref={canvasRef}
        width={120}
        height={120}
        className="w-full h-24 object-cover rounded border border-slate-200 dark:border-slate-700"
      />
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
        {effect.title}
      </span>
    </motion.button>
  );
};

const Navbar = ({ organizationName }) => {
  const { canvas, undo, redo, zoom, setZoom, isDarkMode, setIsDarkMode, saveToHistory, showGrid, setShowGrid, activeObject, bringForward, sendBackward, copyObject, deleteObject, exportCanvas, duplicateObject, centerObject, resetCanvas, isLoading, rotateCanvas, history, historyStep, gifHandler, canvasSize, resizeCanvas, clipboardObject, pasteObject } = useEditor();
  const location = useLocation();
  const navigate = useNavigate();

  const handleExport = async () => {
    try {
      // Always export as PNG (static image with all elements including GIFs as static frames)
      await exportCanvas('png', 1);
    } catch (error) {
      // Export failed silently
    }
  };

  const handleSendToMindMap = () => {
    try {
      if (!canvas) return;
      const obj = canvas.getActiveObject();
      const payload = obj && obj.type === 'textbox'
        ? { source: 'editor', kind: 'text', text: obj.text, fill: obj.fill || '#0f172a' }
        : { source: 'editor', kind: 'shape', label: (obj && obj.type) || 'Design Element' };
      localStorage.setItem('handoff:editorToMindmap', JSON.stringify(payload));
      navigate('/mindmapping');
    } catch (e) {
      // Failed to send to Mind Map
    }
  };

  const handleSave = async () => {
    if (canvas) {
      // Save to localStorage
      const json = JSON.stringify(canvas.toJSON());
      localStorage.setItem('canva-design', json);
      
      // Also save to organization folder if organization name is available
      if (organizationName) {
        try {
          const result = await saveCanvasToOrganization(canvas, organizationName, 'editor');
          if (result.success) {
            toast.success('Canvas saved to organization folder!');
          } else {
            toast.error(result.error || 'Failed to save to organization folder');
          }
        } catch (error) {
          console.error('Error saving to organization:', error);
          toast.error('Failed to save to organization folder');
        }
      } else {
        toast.success('Design saved to local storage');
      }
    }
  };

  const handleNew = () => {
    if (window.confirm('Are you sure you want to create a new canvas? All unsaved changes will be lost.')) {
      resetCanvas();
      // New canvas created
    }
  };

  const handleZoomIn = () => {
    if (canvas) {
      const currentZoom = canvas.getZoom();
      const newZoom = Math.min(currentZoom * 1.2, 5);
      const center = { x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 };
      canvas.zoomToPoint(center, newZoom);
      setZoom(Math.round(newZoom * 100));
      canvas.requestRenderAll();
    } else {
      setZoom(prev => Math.min(prev + 10, 500));
    }
  };

  const handleZoomOut = () => {
    if (canvas) {
      const currentZoom = canvas.getZoom();
      const newZoom = Math.max(currentZoom * 0.8, 0.1);
      const center = { x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 };
      canvas.zoomToPoint(center, newZoom);
      setZoom(Math.round(newZoom * 100));
      canvas.requestRenderAll();
    } else {
      setZoom(prev => Math.max(prev - 10, 10));
    }
  };

  const handleFitToScreen = () => {
    if (canvas && canvas.wrapperEl) {
      const container = canvas.wrapperEl.parentElement;
      if (container) {
        const containerWidth = container.clientWidth - 100;
        const containerHeight = container.clientHeight - 100;
        
        const scaleX = containerWidth / canvasSize.width;
        const scaleY = containerHeight / canvasSize.height;
        const scale = Math.min(scaleX, scaleY, 1);
        
        const center = { x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 };
        canvas.zoomToPoint(center, scale);
        setZoom(Math.max(10, Math.round(scale * 100)));
        canvas.requestRenderAll();
      }
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
    // Grid toggled
  };

  // Additional state for dialogs
  const [openUrlDialog, setOpenUrlDialog] = useState(false);
  const [openDataUrlDialog, setOpenDataUrlDialog] = useState(false);
  const [canvasSizeDialog, setCanvasSizeDialog] = useState(false);
  const [resizeDialog, setResizeDialog] = useState(false);
  const [imageInfoDialog, setImageInfoDialog] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [dataUrlInput, setDataUrlInput] = useState('');
  const [newCanvasWidth, setNewCanvasWidth] = useState(1080);
  const [newCanvasHeight, setNewCanvasHeight] = useState(1080);
  const [resizeWidth, setResizeWidth] = useState(1080);
  const [resizeHeight, setResizeHeight] = useState(1080);
  const [opacityDialog, setOpacityDialog] = useState(false);
  const [colorCorrectionsDialog, setColorCorrectionsDialog] = useState(false);
  const [translateDialog, setTranslateDialog] = useState(false);
  const [trimDialog, setTrimDialog] = useState(false);
  const [trimLayer, setTrimLayer] = useState(true);
  const [trimAll, setTrimAll] = useState(true);
  const [trimRemoveWhite, setTrimRemoveWhite] = useState(false);
  const [trimPower, setTrimPower] = useState(0);
  const [colorPaletteDialog, setColorPaletteDialog] = useState(false);
  const [histogramDialog, setHistogramDialog] = useState(false);
  const [opacityValue, setOpacityValue] = useState(100);
  const [effectsBrowserDialog, setEffectsBrowserDialog] = useState(false);
  const [effectPreviewCanvas, setEffectPreviewCanvas] = useState(null);
  const [effectDialogOpen, setEffectDialogOpen] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [originalImageDataUrl, setOriginalImageDataUrl] = useState(null);
  const [colorCorrections, setColorCorrections] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
    luminance: 0,
    red: 0,
    green: 0,
    blue: 0
  });
  const [previewCanvas, setPreviewCanvas] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const fileInputRef = useRef(null);

  // Open URL handler
  const handleOpenUrl = async () => {
    if (!urlInput.trim() || !canvas) return;
    
    try {
      const img = await FabricImage.fromURL(urlInput, { crossOrigin: 'anonymous' });
      img.set({
        left: (canvas.getWidth() - (img.width || 0)) / 2,
        top: (canvas.getHeight() - (img.height || 0)) / 2,
        cornerStyle: 'circle',
        cornerSize: 12,
        transparentCorners: false,
        cornerColor: '#4f46e5',
        borderColor: '#4f46e5',
        borderScaleFactor: 2,
        selectable: true,
        evented: true
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      saveToHistory();
      setOpenUrlDialog(false);
      setUrlInput('');
      toast.success('Image loaded from URL');
    } catch (error) {
      toast.error('Failed to load image from URL');
    }
  };

  // Open Data URL handler
  const handleOpenDataUrl = async () => {
    if (!dataUrlInput.trim() || !canvas) return;
    
    try {
      const img = await FabricImage.fromURL(dataUrlInput, { crossOrigin: 'anonymous' });
      img.set({
        left: (canvas.getWidth() - (img.width || 0)) / 2,
        top: (canvas.getHeight() - (img.height || 0)) / 2,
        cornerStyle: 'circle',
        cornerSize: 12,
        transparentCorners: false,
        cornerColor: '#4f46e5',
        borderColor: '#4f46e5',
        borderScaleFactor: 2,
        selectable: true,
        evented: true
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      saveToHistory();
      setOpenDataUrlDialog(false);
      setDataUrlInput('');
      toast.success('Image loaded from Data URL');
    } catch (error) {
      toast.error('Failed to load image from Data URL');
    }
  };

  // Print handler
  const handlePrint = () => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print</title></head>
          <body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
            <img src="${dataURL}" style="max-width:100%;max-height:100vh;" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  // Quick Save/Load handlers
  const handleQuickSave = () => {
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    localStorage.setItem('quick_save_canvas', json);
    toast.success('Quick saved (F9)');
  };

  const handleQuickLoad = () => {
    if (!canvas) return;
    const saved = localStorage.getItem('quick_save_canvas');
    if (saved) {
      try {
        canvas.loadFromJSON(saved, () => {
          canvas.renderAll();
          saveToHistory();
          toast.success('Quick loaded (F10)');
        });
      } catch (error) {
        toast.error('Failed to load quick save');
      }
    } else {
      toast.error('No quick save found');
    }
  };

  // Canvas Size handler
  const handleCanvasSize = () => {
    if (!canvas) return;
    setNewCanvasWidth(canvasSize.width);
    setNewCanvasHeight(canvasSize.height);
    setCanvasSizeDialog(true);
  };

  const applyCanvasSize = () => {
    if (!canvas) return;
    resizeCanvas(newCanvasWidth, newCanvasHeight);
    setCanvasSizeDialog(false);
    toast.success('Canvas size updated');
  };

  // Resize handler
  const handleResize = () => {
    if (!canvas) return;
    setResizeWidth(canvasSize.width);
    setResizeHeight(canvasSize.height);
    setResizeDialog(true);
  };

  const applyResize = () => {
    if (!canvas) return;
    resizeCanvas(resizeWidth, resizeHeight);
    setResizeDialog(false);
    toast.success('Canvas resized');
  };

  // Flip handlers
  const handleFlipHorizontal = () => {
    if (!activeObject || !canvas) return;
    activeObject.set('flipX', !activeObject.flipX);
    canvas.renderAll();
    saveToHistory();
  };

  const handleFlipVertical = () => {
    if (!activeObject || !canvas) return;
    activeObject.set('flipY', !activeObject.flipY);
    canvas.renderAll();
    saveToHistory();
  };

  // Image Information handler
  const handleImageInfo = () => {
    if (!canvas) return;
    setImageInfoDialog(true);
  };

  // Opacity handler
  const handleOpacity = () => {
    if (!activeObject || !canvas) {
      toast.error('Please select an object first');
      return;
    }
    const currentOpacity = activeObject.opacity !== undefined ? activeObject.opacity * 100 : 100;
    setOpacityValue(currentOpacity);
    setOpacityDialog(true);
  };

  const applyOpacity = () => {
    if (!activeObject || !canvas) return;
    activeObject.set('opacity', opacityValue / 100);
    canvas.renderAll();
    saveToHistory();
    setOpacityDialog(false);
    toast.success('Opacity updated');
  };

  // Color Corrections handler - MiniPaint style
  const handleColorCorrections = () => {
    if (!activeObject || !canvas || activeObject.type !== 'image') {
      toast.error('Please select an image object first');
      return;
    }
    
    // Reset corrections
    setColorCorrections({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      luminance: 0,
      red: 0,
      green: 0,
      blue: 0
    });
    
    // Store original image for preview
    const imgElement = activeObject.getElement();
    if (imgElement) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = imgElement.width || activeObject.width || 1;
      tempCanvas.height = imgElement.height || activeObject.height || 1;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0);
      setPreviewImage(tempCanvas.toDataURL());
    }
    
    setColorCorrectionsDialog(true);
  };

  // Update preview when corrections change
  const updateColorCorrectionsPreview = useCallback(() => {
    if (!previewImage || !activeObject || !canvas) return;
    
    const img = new Image();
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      let imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Apply destructive corrections (luminance and RGB)
      if (colorCorrections.luminance !== 0) {
        imageData = HSLAdjustment(imageData, 0, 0, colorCorrections.luminance);
      }
      
      if (colorCorrections.red !== 0 || colorCorrections.green !== 0 || colorCorrections.blue !== 0) {
        imageData = ColorTransformFilter(
          imageData,
          1, 1, 1, 1,
          colorCorrections.red,
          colorCorrections.green,
          colorCorrections.blue,
          0
        );
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Apply non-destructive CSS filters
      const filterString = 
        `brightness(${1 + (colorCorrections.brightness / 100)}) ` +
        `contrast(${1 + (colorCorrections.contrast / 100)}) ` +
        `saturate(${1 + (colorCorrections.saturation / 100)}) ` +
        `hue-rotate(${colorCorrections.hue}deg)`;
      
      ctx.filter = filterString;
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.filter = 'none';
      
      setPreviewCanvas(tempCanvas.toDataURL());
    };
    img.src = previewImage;
  }, [previewImage, colorCorrections, activeObject, canvas]);

  useEffect(() => {
    if (colorCorrectionsDialog && previewImage) {
      updateColorCorrectionsPreview();
    }
  }, [colorCorrections, colorCorrectionsDialog, previewImage, updateColorCorrectionsPreview]);

  const applyColorCorrections = async () => {
    if (!activeObject || !canvas || activeObject.type !== 'image') {
      toast.error('Please select an image object');
      return;
    }
    
    try {
      const imgElement = activeObject.getElement();
      if (!imgElement) {
        toast.error('Cannot access image element');
        return;
      }

      // Create canvas with image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = imgElement.width || activeObject.width || 1;
      tempCanvas.height = imgElement.height || activeObject.height || 1;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0);
      
      let imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Apply destructive corrections (luminance and RGB) - like MiniPaint
      if (colorCorrections.luminance !== 0) {
        imageData = HSLAdjustment(imageData, 0, 0, colorCorrections.luminance);
      }
      
      if (colorCorrections.red !== 0 || colorCorrections.green !== 0 || colorCorrections.blue !== 0) {
        imageData = ColorTransformFilter(
          imageData,
          1, 1, 1, 1,
          colorCorrections.red,
          colorCorrections.green,
          colorCorrections.blue,
          0
        );
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Apply non-destructive filters (brightness, contrast, saturation, hue)
      const filterArray = [];
      
      if (colorCorrections.brightness !== 0) {
        filterArray.push(new filters.Brightness({ 
          brightness: colorCorrections.brightness / 100 
        }));
      }
      
      if (colorCorrections.contrast !== 0) {
        filterArray.push(new filters.Contrast({ 
          contrast: colorCorrections.contrast / 100 
        }));
      }
      
      if (colorCorrections.saturation !== 0) {
        filterArray.push(new filters.Saturation({ 
          saturation: colorCorrections.saturation / 100 
        }));
      }
      
      if (colorCorrections.hue !== 0) {
        const hueRad = (colorCorrections.hue * Math.PI) / 180;
        const cos = Math.cos(hueRad);
        const sin = Math.sin(hueRad);
        const lumR = 0.213;
        const lumG = 0.715;
        const lumB = 0.072;
        
        const matrix = [
          lumR + cos * (1 - lumR) + sin * (-lumR), lumG + cos * (-lumG) + sin * (-lumG), lumB + cos * (-lumB) + sin * (1 - lumB), 0, 0,
          lumR + cos * (-lumR) + sin * (0.143), lumG + cos * (1 - lumG) + sin * (0.140), lumB + cos * (-lumB) + sin * (-0.283), 0, 0,
          lumR + cos * (-lumR) + sin * (-(1 - lumR)), lumG + cos * (-lumG) + sin * (lumG), lumB + cos * (1 - lumB) + sin * (lumB), 0, 0,
          0, 0, 0, 1, 0
        ];
        
        filterArray.push(new filters.ColorMatrix({ matrix }));
      }
      
      // Update image with destructive corrections applied
      const dataUrl = tempCanvas.toDataURL();
      await activeObject.setSrc(dataUrl);
      
      // Apply non-destructive filters
      activeObject.filters = filterArray;
      activeObject.applyFilters();
      
      // Sync filters to Pixi for GPU acceleration
      try {
        const { syncFiltersToPixi } = require('../../utils/fabricPixiSync');
        syncFiltersToPixi(activeObject, null);
      } catch (error) {
        console.warn('Failed to sync filters to Pixi:', error);
      }
      
      canvas.renderAll();
      saveToHistory();
      setColorCorrectionsDialog(false);
      setPreviewImage(null);
      setPreviewCanvas(null);
      toast.success('Color corrections applied');
    } catch (error) {
      console.error('Color corrections error:', error);
      toast.error('Failed to apply color corrections');
    }
  };

  // Auto Adjust Colors handler
  const handleAutoAdjustColors = async () => {
    if (!activeObject || !canvas || activeObject.type !== 'image') {
      toast.error('Please select an image object');
      return;
    }

    try {
      // Get image data
      const imgElement = activeObject.getElement();
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = imgElement.width || activeObject.width || 1;
      tempCanvas.height = imgElement.height || activeObject.height || 1;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;
      
      // Auto adjust algorithm (simplified version)
      let minR = 255, minG = 255, minB = 255;
      let maxR = 0, maxG = 0, maxB = 0;
      
      // Find min/max values
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) continue; // Skip transparent
        minR = Math.min(minR, data[i]);
        minG = Math.min(minG, data[i + 1]);
        minB = Math.min(minB, data[i + 2]);
        maxR = Math.max(maxR, data[i]);
        maxG = Math.max(maxG, data[i + 1]);
        maxB = Math.max(maxB, data[i + 2]);
      }
      
      // Normalize
      const rangeR = maxR - minR || 1;
      const rangeG = maxG - minG || 1;
      const rangeB = maxB - minB || 1;
      
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) continue;
        data[i] = ((data[i] - minR) / rangeR) * 255;
        data[i + 1] = ((data[i + 1] - minG) / rangeG) * 255;
        data[i + 2] = ((data[i + 2] - minB) / rangeB) * 255;
      }
      
      ctx.putImageData(imageData, 0, 0);
      const dataUrl = tempCanvas.toDataURL();
      
      // Update image
      await activeObject.setSrc(dataUrl);
      canvas.renderAll();
      saveToHistory();
      toast.success('Colors auto-adjusted');
    } catch (error) {
      console.error('Auto adjust error:', error);
      toast.error('Failed to auto-adjust colors');
    }
  };

  // Translate handler
  const handleTranslate = () => {
    if (!activeObject || !canvas) {
      toast.error('Please select an object first');
      return;
    }
    setTranslateX(activeObject.left || 0);
    setTranslateY(activeObject.top || 0);
    setTranslateDialog(true);
  };

  const applyTranslate = () => {
    if (!activeObject || !canvas) return;
    activeObject.set({
      left: translateX,
      top: translateY
    });
    activeObject.setCoords();
    canvas.renderAll();
    saveToHistory();
    setTranslateDialog(false);
    toast.success('Object moved');
  };

  // Trim handler - MiniPaint style
  const handleTrim = () => {
    if (!canvas) return;
    setTrimDialog(true);
  };

  // Effects Browser handler
  const handleEffectsBrowser = () => {
    if (!activeObject || !canvas || activeObject.type !== 'image') {
      toast.error('Please select an image object first');
      return;
    }
    
    // Create preview canvas from active image
    const imgElement = activeObject.getElement();
    if (imgElement) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = Math.min(imgElement.width || activeObject.width || 200, 200);
      tempCanvas.height = Math.min(imgElement.height || activeObject.height || 200, 200);
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0, tempCanvas.width, tempCanvas.height);
      setEffectPreviewCanvas(tempCanvas);
    }
    
    setEffectsBrowserDialog(true);
  };

  // Apply effect handler - opens dialog for parameter adjustment
  const applyEffect = async (effectKey) => {
    if (!activeObject || !canvas || activeObject.type !== 'image') {
      toast.error('Please select an image object');
      return;
    }

    const effect = effectDefinitions.find(e => e.key === effectKey);
    if (!effect) {
      toast.error('Effect not found');
      return;
    }

    // Get original image data URL for preview
    try {
      const imgElement = activeObject.getElement();
      if (imgElement) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imgElement.width || activeObject.width || 1;
        tempCanvas.height = imgElement.height || activeObject.height || 1;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(imgElement, 0, 0);
        const dataUrl = tempCanvas.toDataURL();
        setOriginalImageDataUrl(dataUrl);
        setSelectedEffect(effect);
        setEffectDialogOpen(true);
        setEffectsBrowserDialog(false);
      }
    } catch (error) {
      console.error('Error preparing effect dialog:', error);
      toast.error('Failed to open effect dialog');
    }
  };

  // Handle effect application from dialog
  const handleEffectApply = async (params) => {
    if (!activeObject || !canvas || !selectedEffect) {
      toast.error('No effect selected or no active object');
      return;
    }

    try {
      console.log('Applying effect:', selectedEffect.key, 'with params:', params);
      
      if (selectedEffect.type === 'css') {
        // For CSS filters, pass params object with value property
        const value = params.value !== undefined ? params.value : (selectedEffect.defaultParams?.value || 50);
        await applyCSSFilter(activeObject, selectedEffect.key, { value });
      } else if (selectedEffect.type === 'pixel' && selectedEffect.effectFunction) {
        // For pixel effects, pass the params object directly
        await applyPixelEffect(activeObject, selectedEffect.effectFunction, params);
      } else {
        toast.error('Invalid effect type');
        return;
      }
      
      canvas.renderAll();
      saveToHistory();
      setEffectDialogOpen(false);
      setSelectedEffect(null);
      setOriginalImageDataUrl(null);
      toast.success(`${selectedEffect.title} effect applied`);
    } catch (error) {
      console.error('Error applying effect:', error);
      toast.error(`Failed to apply ${selectedEffect.title} effect: ${error.message}`);
    }
  };

  // Apply common filter with dialog
  const applyCommonFilter = async (filterType, defaultValue = 50) => {
    if (!activeObject || !canvas || activeObject.type !== 'image') {
      toast.error('Please select an image object');
      return;
    }

    // For now, apply with default value
    // In future, can add dialog for parameter adjustment
    try {
      await applyCSSFilter(activeObject, filterType, defaultValue);
      canvas.renderAll();
      saveToHistory();
      toast.success('Filter applied');
    } catch (error) {
      console.error('Error applying filter:', error);
      toast.error('Failed to apply filter');
    }
  };

  // Get trim info for a canvas (similar to MiniPaint's get_trim_info)
  const getTrimInfo = (sourceCanvas, removeWhite = false, power = 0) => {
    let tempCanvas, imageData;
    
    // Handle Fabric canvas
    if (sourceCanvas && typeof sourceCanvas.toDataURL === 'function' && sourceCanvas.getWidth) {
      // It's a Fabric canvas - convert to image data
      const dataURL = sourceCanvas.toDataURL();
      const img = new Image();
      img.src = dataURL;
      tempCanvas = document.createElement('canvas');
      tempCanvas.width = sourceCanvas.getWidth();
      tempCanvas.height = sourceCanvas.getHeight();
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    } else if (sourceCanvas && sourceCanvas.getContext) {
      // It's a regular canvas element
      tempCanvas = sourceCanvas;
      const ctx = tempCanvas.getContext('2d');
      imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    } else {
      throw new Error('Invalid canvas source');
    }
    
    const imgData = imageData.data;
    
    let top = 0;
    let left = 0;
    let bottom = 0;
    let right = 0;
    
    // Check top edge
    topLoop:
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const k = (y * imageData.width + x) * 4;
        // Skip transparent pixels
        if (imgData[k + 3] <= power) continue;
        // Skip white pixels if removeWhite is true
        if (removeWhite && imgData[k] >= 255 - power && imgData[k + 1] >= 255 - power && imgData[k + 2] >= 255 - power) continue;
        // Found a non-empty pixel, stop
        break topLoop;
      }
      top++;
    }
    
    // Check left edge
    leftLoop:
    for (let x = 0; x < imageData.width; x++) {
      for (let y = 0; y < imageData.height; y++) {
        const k = (y * imageData.width + x) * 4;
        if (imgData[k + 3] <= power) continue;
        if (removeWhite && imgData[k] >= 255 - power && imgData[k + 1] >= 255 - power && imgData[k + 2] >= 255 - power) continue;
        break leftLoop;
      }
      left++;
    }
    
    // Check bottom edge
    bottomLoop:
    for (let y = imageData.height - 1; y >= 0; y--) {
      for (let x = imageData.width - 1; x >= 0; x--) {
        const k = (y * imageData.width + x) * 4;
        if (imgData[k + 3] <= power) continue;
        if (removeWhite && imgData[k] >= 255 - power && imgData[k + 1] >= 255 - power && imgData[k + 2] >= 255 - power) continue;
        break bottomLoop;
      }
      bottom++;
    }
    
    // Check right edge
    rightLoop:
    for (let x = imageData.width - 1; x >= 0; x--) {
      for (let y = imageData.height - 1; y >= 0; y--) {
        const k = (y * imageData.width + x) * 4;
        if (imgData[k + 3] <= power) continue;
        if (removeWhite && imgData[k] >= 255 - power && imgData[k + 1] >= 255 - power && imgData[k + 2] >= 255 - power) continue;
        break rightLoop;
      }
      right++;
    }
    
    return {
      top,
      left,
      bottom,
      right,
      width: Math.max(1, imageData.width - left - right),
      height: Math.max(1, imageData.height - top - bottom)
    };
  };

  // Trim selected layer (like MiniPaint's trim_layer)
  const trimSelectedLayer = async (removeWhite, power) => {
    if (!activeObject || !canvas || activeObject.type !== 'image') {
      toast.error('Please select an image object to trim');
      return;
    }

    try {
      const imgElement = activeObject.getElement();
      if (!imgElement) {
        toast.error('Cannot access image element');
        return;
      }

      // Create temporary canvas with the image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = imgElement.width || activeObject.width || 1;
      tempCanvas.height = imgElement.height || activeObject.height || 1;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0);

      // Get trim info
      const trim = getTrimInfo(tempCanvas, removeWhite, power);

      // Create trimmed canvas
      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = trim.width;
      trimmedCanvas.height = trim.height;
      const trimmedCtx = trimmedCanvas.getContext('2d');
      
      // Draw the trimmed portion
      trimmedCtx.drawImage(
        tempCanvas,
        trim.left, trim.top, trim.width, trim.height,
        0, 0, trim.width, trim.height
      );

      // Update the image object
      const dataUrl = trimmedCanvas.toDataURL();
      await activeObject.setSrc(dataUrl);
      
      // Adjust position to account for trim
      activeObject.set({
        left: (activeObject.left || 0) + trim.left,
        top: (activeObject.top || 0) + trim.top
      });
      activeObject.setCoords();
      
      canvas.renderAll();
      saveToHistory();
      toast.success('Layer trimmed');
    } catch (error) {
      console.error('Trim layer error:', error);
      toast.error('Failed to trim layer');
    }
  };

  // Trim all borders (like MiniPaint's trim_all)
  const trimAllBorders = async (removeWhite, power) => {
    if (!canvas) return;

    try {
      const objects = canvas.getObjects();
      if (objects.length === 0) {
        toast.error('No objects to trim');
        return;
      }

      // Get trim info from entire canvas
      const trim = getTrimInfo(canvas, removeWhite, power);

      if (trim.left === 0 && trim.top === 0 && trim.right === 0 && trim.bottom === 0) {
        toast.info('No empty space to trim');
        return;
      }

      // Move all objects
      objects.forEach(obj => {
        obj.set({
          left: (obj.left || 0) - trim.left,
          top: (obj.top || 0) - trim.top
        });
        obj.setCoords();
      });

      // Resize canvas
      const newWidth = Math.max(1, canvas.getWidth() - trim.left - trim.right);
      const newHeight = Math.max(1, canvas.getHeight() - trim.top - trim.bottom);
      resizeCanvas(newWidth, newHeight);

      canvas.renderAll();
      saveToHistory();
      toast.success('Canvas trimmed');
    } catch (error) {
      console.error('Trim all error:', error);
      toast.error('Failed to trim canvas');
    }
  };

  const applyTrim = async () => {
    if (!canvas) return;

    try {
      if (trimLayer) {
        await trimSelectedLayer(trimRemoveWhite, trimPower);
      }
      if (trimAll) {
        await trimAllBorders(trimRemoveWhite, trimPower);
      }
      setTrimDialog(false);
    } catch (error) {
      console.error('Trim error:', error);
      toast.error('Failed to trim');
    }
  };

  // Color Palette handler
  const handleColorPalette = () => {
    if (!canvas) return;
    setColorPaletteDialog(true);
  };

  // Histogram handler
  const handleHistogram = () => {
    if (!canvas) return;
    setHistogramDialog(true);
  };

  // Open File handler
  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const img = await FabricImage.fromURL(event.target.result, { crossOrigin: 'anonymous' });
        img.set({
          left: (canvas.getWidth() - (img.width || 0)) / 2,
          top: (canvas.getHeight() - (img.height || 0)) / 2,
          cornerStyle: 'circle',
          cornerSize: 12,
          transparentCorners: false,
          cornerColor: '#4f46e5',
          borderColor: '#4f46e5',
          borderScaleFactor: 2,
          selectable: true,
          evented: true
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        saveToHistory();
        toast.success('Image loaded');
      } catch (error) {
        toast.error('Failed to load image');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'F9' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        handleQuickSave();
      } else if (e.key === 'F10' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        handleQuickLoad();
      } else if (e.key === 'p' && e.ctrlKey) {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'o' && e.ctrlKey) {
        e.preventDefault();
        handleOpenFile();
      } else if (e.key === 'i' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handleImageInfo();
      } else if (e.key === 'r' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handleResize();
      } else if (e.key === 't' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handleTrim();
      } else if (e.key === 'f' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handleAutoAdjustColors();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas, activeObject]);

  return (
    <>
      <Toaster position="top-center" richColors />
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg flex items-center justify-between px-6 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <motion.h1
            className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
          >
           3YUGA Editor
          </motion.h1>

          {/* Menu Bar - Similar to MiniPaint */}
          <div className="hidden md:flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-4 ml-4">
            {/* File Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <FileText className="w-4 h-4 mr-1" />
                  File
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={handleNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  New
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FileImage className="w-4 h-4 mr-2" />
                    Open
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={handleOpenFile}>
                      <span className="text-xs">Open File</span>
                      <span className="ml-auto text-xs text-slate-500">O</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenUrlDialog(true)}>
                      <Link className="w-4 h-4 mr-2" />
                      <span className="text-xs">Open URL</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenDataUrlDialog(true)}>
                      <FileImage className="w-4 h-4 mr-2" />
                      <span className="text-xs">Open Data URL</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                  <span className="ml-auto text-xs text-slate-500">S</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save As
                  <span className="ml-auto text-xs text-slate-500">Shift+S</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                  <span className="ml-auto text-xs text-slate-500">Ctrl+P</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleQuickSave}>
                  <span className="text-xs">Quick Save</span>
                  <span className="ml-auto text-xs text-slate-500">F9</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleQuickLoad}>
                  <span className="text-xs">Quick Load</span>
                  <span className="ml-auto text-xs text-slate-500">F10</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  Edit
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={undo} disabled={historyStep <= 0}>
                  <Undo className="w-4 h-4 mr-2" />
                  Undo
                  <span className="ml-auto text-xs text-slate-500">Ctrl+Z</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={redo} disabled={historyStep >= history.length - 1}>
                  <Redo className="w-4 h-4 mr-2" />
                  Redo
                  <span className="ml-auto text-xs text-slate-500">Ctrl+Y</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={deleteObject} disabled={!activeObject}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selection
                  <span className="ml-auto text-xs text-slate-500">Del</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyObject} disabled={!activeObject}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                  <span className="ml-auto text-xs text-slate-500">Ctrl+C</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={pasteObject} disabled={!clipboardObject}>
                  <span className="text-xs">Paste</span>
                  <span className="ml-auto text-xs text-slate-500">Ctrl+V</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={duplicateObject} disabled={!activeObject}>
                  <Layers className="w-4 h-4 mr-2" />
                  Duplicate
                  <span className="ml-auto text-xs text-slate-500">Ctrl+D</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ZoomIn className="w-4 h-4 mr-2" />
                    Zoom
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={handleZoomIn}>
                      <ZoomIn className="w-4 h-4 mr-2" />
                      <span className="text-xs">Zoom In</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleZoomOut}>
                      <ZoomOut className="w-4 h-4 mr-2" />
                      <span className="text-xs">Zoom Out</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      if (canvas) {
                        const center = { x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 };
                        canvas.zoomToPoint(center, 1);
                        setZoom(100);
                        canvas.requestRenderAll();
                      }
                    }}>
                      <span className="text-xs">Original Size (100%)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleFitToScreen}>
                      <Minimize2 className="w-4 h-4 mr-2" />
                      <span className="text-xs">Fit Window</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={toggleGrid}>
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  Grid
                  <span className="ml-auto text-xs text-slate-500">G</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Image Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <ImageIcon className="w-4 h-4 mr-1" />
                  Image
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={handleImageInfo}>
                  <Info className="w-4 h-4 mr-2" />
                  Information
                  <span className="ml-auto text-xs text-slate-500">I</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCanvasSize}>
                  <Expand className="w-4 h-4 mr-2" />
                  Canvas Size
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleResize}>
                  <Expand className="w-4 h-4 mr-2" />
                  Resize
                  <span className="ml-auto text-xs text-slate-500">R</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTrim}>
                  <Scissors className="w-4 h-4 mr-2" />
                  Trim
                  <span className="ml-auto text-xs text-slate-500">T</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => rotateCanvas('left')}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Rotate Left
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => rotateCanvas('right')}>
                  <RotateCw className="w-4 h-4 mr-2" />
                  Rotate Right
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FlipHorizontal className="w-4 h-4 mr-2" />
                    Flip
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={handleFlipHorizontal} disabled={!activeObject}>
                      <FlipHorizontal className="w-4 h-4 mr-2" />
                      <span className="text-xs">Horizontal</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleFlipVertical} disabled={!activeObject}>
                      <FlipVertical className="w-4 h-4 mr-2" />
                      <span className="text-xs">Vertical</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={handleTranslate} disabled={!activeObject}>
                  <Move className="w-4 h-4 mr-2" />
                  Translate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpacity} disabled={!activeObject}>
                  <span className="text-xs">Opacity</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleColorCorrections} disabled={!activeObject}>
                  <Palette className="w-4 h-4 mr-2" />
                  Color Corrections
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAutoAdjustColors} disabled={!activeObject || activeObject?.type !== 'image'}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Auto Adjust Colors
                  <span className="ml-auto text-xs text-slate-500">F</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleColorPalette}>
                  <Palette className="w-4 h-4 mr-2" />
                  Color Palette
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleHistogram}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Histogram
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Effects Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <Wand2 className="w-4 h-4 mr-1" />
                  Effects
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={handleEffectsBrowser} disabled={!activeObject || activeObject?.type !== 'image'}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Effect Browser
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Common Filters
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => applyCommonFilter('blur', 5)} disabled={!activeObject || activeObject?.type !== 'image'}>
                      <span className="text-xs">Blur</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => applyCommonFilter('brightness', 30)} disabled={!activeObject || activeObject?.type !== 'image'}>
                      <span className="text-xs">Brightness</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => applyCommonFilter('contrast', 40)} disabled={!activeObject || activeObject?.type !== 'image'}>
                      <span className="text-xs">Contrast</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                      if (activeObject && activeObject.type === 'image') {
                        const { grayscaleEffect } = await import('../../utils/imageEffects');
                        await applyPixelEffect(activeObject, grayscaleEffect);
                        if (canvas) {
                          canvas.renderAll();
                          saveToHistory();
                          toast.success('Grayscale applied');
                        }
                      }
                    }} disabled={!activeObject || activeObject?.type !== 'image'}>
                      <span className="text-xs">Grayscale</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => applyCommonFilter('hue-rotate', 90)} disabled={!activeObject || activeObject?.type !== 'image'}>
                      <span className="text-xs">Hue Rotate</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                      if (activeObject && activeObject.type === 'image') {
                        const { invertEffect } = await import('../../utils/imageEffects');
                        await applyPixelEffect(activeObject, invertEffect);
                        if (canvas) {
                          canvas.renderAll();
                          saveToHistory();
                          toast.success('Invert applied');
                        }
                      }
                    }} disabled={!activeObject || activeObject?.type !== 'image'}>
                      <span className="text-xs">Invert</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => applyCommonFilter('saturate', -50)} disabled={!activeObject || activeObject?.type !== 'image'}>
                      <span className="text-xs">Saturate</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => applyCommonFilter('sepia', 60)} disabled={!activeObject || activeObject?.type !== 'image'}>
                      <span className="text-xs">Sepia</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => applyCommonFilter('shadow', 5)} disabled={!activeObject || activeObject?.type !== 'image'}>
                      <span className="text-xs">Shadow</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Instagram Filters
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {effectDefinitions.filter(e => e.category === 'instagram').map(effect => (
                      <DropdownMenuItem 
                        key={effect.key}
                        onClick={() => applyEffect(effect.key)}
                        disabled={!activeObject || activeObject?.type !== 'image'}
                      >
                        <span className="text-xs">{effect.title}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Other Effects
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {effectDefinitions.filter(e => e.category === 'other').map(effect => (
                      <DropdownMenuItem 
                        key={effect.key}
                        onClick={() => applyEffect(effect.key)}
                        disabled={!activeObject || activeObject?.type !== 'image'}
                      >
                        <span className="text-xs">{effect.title}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button onClick={handleSendToMindMap} variant="outline" size="sm" className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <Layers className="w-4 h-4" />
            Send to Mind Map
          </Button>
          <Button onClick={handleNew} variant="outline" size="sm" className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <Plus className="w-4 h-4" />
            New
          </Button>
          <Button onClick={() => rotateCanvas('left')} variant="outline" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Rotate Left">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button onClick={() => rotateCanvas('right')} variant="outline" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Rotate Right">
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button onClick={handleSave} variant="outline" size="sm" className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <Save className="w-4 h-4" />
            Save
          </Button>
          <Button 
            onClick={handleExport} 
            variant="default" 
            size="sm" 
            className="gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            disabled={isLoading}
          >
            <Download className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Exporting...' : 'Export'}
          </Button>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2" />

          <Button 
            onClick={undo} 
            variant="ghost" 
            size="icon" 
            className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={historyStep <= 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button 
            onClick={redo} 
            variant="ghost" 
            size="icon" 
            className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={historyStep >= history.length - 1}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </Button>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2" />

          {activeObject && (
            <>
              <Button onClick={copyObject} variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Copy (Ctrl+C)">
                <Copy className="w-4 h-4" />
              </Button>
              <Button onClick={duplicateObject} variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Duplicate">
                <Layers className="w-4 h-4" />
              </Button>
              <Button onClick={centerObject} variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Center Object">
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button onClick={bringForward} variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Bring Forward">
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button onClick={sendBackward} variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Send Backward">
                <ArrowDown className="w-4 h-4" />
              </Button>
              <Button onClick={deleteObject} variant="ghost" size="icon" className="hover:bg-red-100 dark:hover:bg-red-900 text-red-600 transition-all" title="Delete (Del)">
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2" />
            </>
          )}

          <Button onClick={handleZoomOut} variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <button 
            onClick={handleFitToScreen}
            className="px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all min-w-[60px]"
            title="Fit to Screen (Ctrl+0)"
          >
            {zoom}%
          </button>
          <Button onClick={handleZoomIn} variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button onClick={handleFitToScreen} variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Fit to Screen">
            <Minimize2 className="w-4 h-4" />
          </Button>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2" />

          <Button onClick={toggleGrid} variant="ghost" size="icon" className={`hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${showGrid ? 'bg-slate-100 dark:bg-slate-800' : ''}`} title="Toggle Grid">
            <Grid3x3 className="w-4 h-4" />
          </Button>

          <Button onClick={toggleTheme} variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Keyboard Shortcuts">
                <Keyboard className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Keyboard Shortcuts</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Undo</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+Z</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Redo</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+Y</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Copy</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+C</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Paste</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+V</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Delete</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Del</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Duplicate</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+D</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Select All</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+A</kbd>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </motion.nav>

      {/* Dialogs */}
      {/* Open URL Dialog */}
      <Dialog open={openUrlDialog} onOpenChange={setOpenUrlDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open URL</DialogTitle>
            <DialogDescription>Enter an image URL to load</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url-input">Image URL</Label>
              <Input
                id="url-input"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleOpenUrl();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenUrlDialog(false)}>Cancel</Button>
              <Button onClick={handleOpenUrl} disabled={!urlInput.trim()}>Load</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Open Data URL Dialog */}
      <Dialog open={openDataUrlDialog} onOpenChange={setOpenDataUrlDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open Data URL</DialogTitle>
            <DialogDescription>Paste a data URL (data:image/...) to load</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dataurl-input">Data URL</Label>
              <Input
                id="dataurl-input"
                value={dataUrlInput}
                onChange={(e) => setDataUrlInput(e.target.value)}
                placeholder="data:image/png;base64,..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleOpenDataUrl();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenDataUrlDialog(false)}>Cancel</Button>
              <Button onClick={handleOpenDataUrl} disabled={!dataUrlInput.trim()}>Load</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Canvas Size Dialog */}
      <Dialog open={canvasSizeDialog} onOpenChange={setCanvasSizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Canvas Size</DialogTitle>
            <DialogDescription>Change the canvas dimensions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="canvas-width">Width</Label>
                <Input
                  id="canvas-width"
                  type="number"
                  value={newCanvasWidth}
                  onChange={(e) => setNewCanvasWidth(parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canvas-height">Height</Label>
                <Input
                  id="canvas-height"
                  type="number"
                  value={newCanvasHeight}
                  onChange={(e) => setNewCanvasHeight(parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCanvasSizeDialog(false)}>Cancel</Button>
              <Button onClick={applyCanvasSize} disabled={newCanvasWidth < 1 || newCanvasHeight < 1}>Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resize Dialog */}
      <Dialog open={resizeDialog} onOpenChange={setResizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resize Canvas</DialogTitle>
            <DialogDescription>Resize the canvas to new dimensions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resize-width">Width</Label>
                <Input
                  id="resize-width"
                  type="number"
                  value={resizeWidth}
                  onChange={(e) => setResizeWidth(parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resize-height">Height</Label>
                <Input
                  id="resize-height"
                  type="number"
                  value={resizeHeight}
                  onChange={(e) => setResizeHeight(parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResizeDialog(false)}>Cancel</Button>
              <Button onClick={applyResize} disabled={resizeWidth < 1 || resizeHeight < 1}>Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Information Dialog */}
      <Dialog open={imageInfoDialog} onOpenChange={setImageInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Image Information</DialogTitle>
            <DialogDescription>Canvas and image details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Canvas Width:</span>
                <span className="font-medium">{canvasSize.width}px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Canvas Height:</span>
                <span className="font-medium">{canvasSize.height}px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Objects:</span>
                <span className="font-medium">{canvas?.getObjects().length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Zoom:</span>
                <span className="font-medium">{zoom}%</span>
              </div>
              {activeObject && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Selected Type:</span>
                    <span className="font-medium">{activeObject.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Position:</span>
                    <span className="font-medium">({Math.round(activeObject.left || 0)}, {Math.round(activeObject.top || 0)})</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setImageInfoDialog(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Opacity Dialog */}
      <Dialog open={opacityDialog} onOpenChange={setOpacityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opacity</DialogTitle>
            <DialogDescription>Adjust object opacity (0-100%)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Opacity: {opacityValue}%</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={opacityValue}
                  onChange={(e) => setOpacityValue(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  className="w-20"
                />
              </div>
              <Slider
                value={[opacityValue]}
                onValueChange={(values) => setOpacityValue(values[0])}
                min={0}
                max={100}
                step={1}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpacityDialog(false)}>Cancel</Button>
              <Button onClick={applyOpacity}>Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Color Corrections Dialog - MiniPaint Style */}
      <Dialog open={colorCorrectionsDialog} onOpenChange={(open) => {
        setColorCorrectionsDialog(open);
        if (!open) {
          setPreviewImage(null);
          setPreviewCanvas(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Color Corrections</DialogTitle>
            <DialogDescription>Adjust brightness, contrast, saturation, hue, luminance, and RGB channels</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Left side - Controls */}
            <div className="space-y-6">
              {/* Brightness */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Brightness: {colorCorrections.brightness}%</Label>
                  <Input
                    type="number"
                    min="-100"
                    max="100"
                    value={colorCorrections.brightness}
                    onChange={(e) => setColorCorrections({...colorCorrections, brightness: parseInt(e.target.value) || 0})}
                    className="w-20"
                  />
                </div>
                <Slider
                  value={[colorCorrections.brightness]}
                  onValueChange={(values) => setColorCorrections({...colorCorrections, brightness: values[0]})}
                  min={-100}
                  max={100}
                  step={1}
                />
              </div>

              {/* Contrast */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Contrast: {colorCorrections.contrast}%</Label>
                  <Input
                    type="number"
                    min="-100"
                    max="100"
                    value={colorCorrections.contrast}
                    onChange={(e) => setColorCorrections({...colorCorrections, contrast: parseInt(e.target.value) || 0})}
                    className="w-20"
                  />
                </div>
                <Slider
                  value={[colorCorrections.contrast]}
                  onValueChange={(values) => setColorCorrections({...colorCorrections, contrast: values[0]})}
                  min={-100}
                  max={100}
                  step={1}
                />
              </div>

              {/* Saturation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Saturation: {colorCorrections.saturation}%</Label>
                  <Input
                    type="number"
                    min="-100"
                    max="100"
                    value={colorCorrections.saturation}
                    onChange={(e) => setColorCorrections({...colorCorrections, saturation: parseInt(e.target.value) || 0})}
                    className="w-20"
                  />
                </div>
                <Slider
                  value={[colorCorrections.saturation]}
                  onValueChange={(values) => setColorCorrections({...colorCorrections, saturation: values[0]})}
                  min={-100}
                  max={100}
                  step={1}
                />
              </div>

              {/* Hue */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Hue: {colorCorrections.hue}°</Label>
                  <Input
                    type="number"
                    min="-180"
                    max="180"
                    value={colorCorrections.hue}
                    onChange={(e) => setColorCorrections({...colorCorrections, hue: parseInt(e.target.value) || 0})}
                    className="w-20"
                  />
                </div>
                <Slider
                  value={[colorCorrections.hue]}
                  onValueChange={(values) => setColorCorrections({...colorCorrections, hue: values[0]})}
                  min={-180}
                  max={180}
                  step={1}
                />
              </div>

              <div className="border-t pt-4">
                {/* Luminance */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <Label>Luminance: {colorCorrections.luminance}%</Label>
                    <Input
                      type="number"
                      min="-100"
                      max="100"
                      value={colorCorrections.luminance}
                      onChange={(e) => setColorCorrections({...colorCorrections, luminance: parseInt(e.target.value) || 0})}
                      className="w-20"
                    />
                  </div>
                  <Slider
                    value={[colorCorrections.luminance]}
                    onValueChange={(values) => setColorCorrections({...colorCorrections, luminance: values[0]})}
                    min={-100}
                    max={100}
                    step={1}
                  />
                </div>

                <h4 className="text-sm font-semibold mb-3">RGB Channels</h4>
              
              {/* Red */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <Label className="text-red-600">Red: {colorCorrections.red}</Label>
                  <Input
                    type="number"
                    min="-255"
                    max="255"
                    value={colorCorrections.red}
                    onChange={(e) => setColorCorrections({...colorCorrections, red: parseInt(e.target.value) || 0})}
                    className="w-20"
                  />
                </div>
                <Slider
                  value={[colorCorrections.red]}
                  onValueChange={(values) => setColorCorrections({...colorCorrections, red: values[0]})}
                  min={-255}
                  max={255}
                  step={1}
                  className="[&>span]:bg-red-500"
                />
              </div>

              {/* Green */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <Label className="text-green-600">Green: {colorCorrections.green}</Label>
                  <Input
                    type="number"
                    min="-255"
                    max="255"
                    value={colorCorrections.green}
                    onChange={(e) => setColorCorrections({...colorCorrections, green: parseInt(e.target.value) || 0})}
                    className="w-20"
                  />
                </div>
                <Slider
                  value={[colorCorrections.green]}
                  onValueChange={(values) => setColorCorrections({...colorCorrections, green: values[0]})}
                  min={-255}
                  max={255}
                  step={1}
                  className="[&>span]:bg-green-500"
                />
              </div>

              {/* Blue */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-blue-600">Blue: {colorCorrections.blue}</Label>
                  <Input
                    type="number"
                    min="-255"
                    max="255"
                    value={colorCorrections.blue}
                    onChange={(e) => setColorCorrections({...colorCorrections, blue: parseInt(e.target.value) || 0})}
                    className="w-20"
                  />
                </div>
                <Slider
                  value={[colorCorrections.blue]}
                  onValueChange={(values) => setColorCorrections({...colorCorrections, blue: values[0]})}
                  min={-255}
                  max={255}
                  step={1}
                  className="[&>span]:bg-blue-500"
                />
              </div>
              </div>
            </div>

            {/* Right side - Preview */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border-2 border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800 p-4">
                  {previewCanvas ? (
                    <img 
                      src={previewCanvas} 
                      alt="Preview" 
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  ) : previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Original" 
                      className="w-full h-auto max-h-96 object-contain opacity-50"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                      <p className="text-sm">Loading preview...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setColorCorrections({
                brightness: 0,
                contrast: 0,
                saturation: 0,
                hue: 0,
                luminance: 0,
                red: 0,
                green: 0,
                blue: 0
              });
            }}>Reset</Button>
            <Button variant="outline" onClick={() => {
              setColorCorrectionsDialog(false);
              setPreviewImage(null);
              setPreviewCanvas(null);
            }}>Cancel</Button>
            <Button onClick={applyColorCorrections}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Effects Browser Dialog */}
      <Dialog open={effectsBrowserDialog} onOpenChange={(open) => {
        setEffectsBrowserDialog(open);
        if (!open) {
          setEffectPreviewCanvas(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Effects Browser</DialogTitle>
            <DialogDescription>Select an effect to apply to the image</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 p-4">
              {effectDefinitions.map((effect) => (
                <EffectPreviewItem
                  key={effect.key}
                  effect={effect}
                  previewCanvas={effectPreviewCanvas}
                  onApply={() => applyEffect(effect.key)}
                />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Effect Dialog with Parameters */}
      <EffectDialog
        open={effectDialogOpen}
        onOpenChange={(open) => {
          setEffectDialogOpen(open);
          if (!open) {
            setSelectedEffect(null);
            setOriginalImageDataUrl(null);
          }
        }}
        effect={selectedEffect}
        originalImage={originalImageDataUrl}
        onApply={handleEffectApply}
      />

      {/* Translate Dialog */}
      <Dialog open={translateDialog} onOpenChange={setTranslateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Translate</DialogTitle>
            <DialogDescription>Move object to specific position</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="translate-x">X Position</Label>
                <Input
                  id="translate-x"
                  type="number"
                  value={translateX}
                  onChange={(e) => setTranslateX(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="translate-y">Y Position</Label>
                <Input
                  id="translate-y"
                  type="number"
                  value={translateY}
                  onChange={(e) => setTranslateY(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTranslateDialog(false)}>Cancel</Button>
              <Button onClick={applyTranslate}>Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trim Dialog - MiniPaint Style */}
      <Dialog open={trimDialog} onOpenChange={setTrimDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trim</DialogTitle>
            <DialogDescription>Remove empty (transparent/white) space</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="trim-layer">Trim layer:</Label>
                <input
                  id="trim-layer"
                  type="checkbox"
                  checked={trimLayer}
                  onChange={(e) => setTrimLayer(e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="trim-all">Trim borders:</Label>
                <input
                  id="trim-all"
                  type="checkbox"
                  checked={trimAll}
                  onChange={(e) => setTrimAll(e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="trim-power">Power (tolerance):</Label>
                  <Input
                    id="trim-power"
                    type="number"
                    min="0"
                    max="255"
                    value={trimPower}
                    onChange={(e) => setTrimPower(Math.max(0, Math.min(255, parseInt(e.target.value) || 0)))}
                    className="w-20"
                  />
                </div>
                <Slider
                  value={[trimPower]}
                  onValueChange={(values) => setTrimPower(values[0])}
                  min={0}
                  max={255}
                  step={1}
                />
                <p className="text-xs text-slate-500">Tolerance for alpha channel and white detection (0-255)</p>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="trim-white">Trim white color?</Label>
                <input
                  id="trim-white"
                  type="checkbox"
                  checked={trimRemoveWhite}
                  onChange={(e) => setTrimRemoveWhite(e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setTrimDialog(false)}>Cancel</Button>
              <Button onClick={applyTrim} disabled={!trimLayer && !trimAll}>Trim</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Color Palette Dialog */}
      <Dialog open={colorPaletteDialog} onOpenChange={setColorPaletteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Color Palette</DialogTitle>
            <DialogDescription>Extract colors from canvas</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(() => {
              if (!canvas) return <p className="text-sm text-slate-500">No canvas available</p>;
              
              try {
                // Get canvas as image data
                const dataURL = canvas.toDataURL();
                const img = new Image();
                img.src = dataURL;
                
                // Extract dominant colors (simplified)
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = Math.min(canvas.getWidth(), 100);
                tempCanvas.height = Math.min(canvas.getHeight(), 100);
                const ctx = tempCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
                
                const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const data = imageData.data;
                const colorMap = new Map();
                
                // Sample colors
                for (let i = 0; i < data.length; i += 16) {
                  const r = data[i];
                  const g = data[i + 1];
                  const b = data[i + 2];
                  const a = data[i + 3];
                  if (a > 128) {
                    const color = `rgb(${r},${g},${b})`;
                    colorMap.set(color, (colorMap.get(color) || 0) + 1);
                  }
                }
                
                const colors = Array.from(colorMap.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 20)
                  .map(([color]) => color);
                
                return (
                  <div className="grid grid-cols-5 gap-2">
                    {colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-lg border-2 border-slate-300 dark:border-slate-600 cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                        onClick={() => {
                          navigator.clipboard.writeText(color);
                          toast.success('Color copied to clipboard');
                        }}
                      />
                    ))}
                  </div>
                );
              } catch (error) {
                return <p className="text-sm text-slate-500">Failed to extract colors</p>;
              }
            })()}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setColorPaletteDialog(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Histogram Dialog */}
      <Dialog open={histogramDialog} onOpenChange={setHistogramDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histogram</DialogTitle>
            <DialogDescription>Color distribution chart</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(() => {
              if (!canvas) return <p className="text-sm text-slate-500">No canvas available</p>;
              
              try {
                const dataURL = canvas.toDataURL();
                const img = new Image();
                img.src = dataURL;
                
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = Math.min(canvas.getWidth(), 200);
                tempCanvas.height = Math.min(canvas.getHeight(), 200);
                const ctx = tempCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
                
                const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const data = imageData.data;
                
                // Calculate histogram
                const histogram = { r: new Array(256).fill(0), g: new Array(256).fill(0), b: new Array(256).fill(0), gray: new Array(256).fill(0) };
                
                for (let i = 0; i < data.length; i += 4) {
                  if (data[i + 3] > 128) {
                    histogram.r[data[i]]++;
                    histogram.g[data[i + 1]]++;
                    histogram.b[data[i + 2]]++;
                    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
                    histogram.gray[gray]++;
                  }
                }
                
                const maxR = Math.max(...histogram.r);
                const maxG = Math.max(...histogram.g);
                const maxB = Math.max(...histogram.b);
                const maxGray = Math.max(...histogram.gray);
                
                return (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Grayscale</h4>
                      <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded flex items-end gap-px">
                        {histogram.gray.map((value, idx) => (
                          <div
                            key={idx}
                            className="flex-1 bg-slate-600"
                            style={{ height: `${(value / maxGray) * 100}%` }}
                            title={`${idx}: ${value}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-red-600">Red</h4>
                        <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded flex items-end gap-px">
                          {histogram.r.map((value, idx) => (
                            <div
                              key={idx}
                              className="flex-1 bg-red-500"
                              style={{ height: `${(value / maxR) * 100}%` }}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-green-600">Green</h4>
                        <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded flex items-end gap-px">
                          {histogram.g.map((value, idx) => (
                            <div
                              key={idx}
                              className="flex-1 bg-green-500"
                              style={{ height: `${(value / maxG) * 100}%` }}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-blue-600">Blue</h4>
                        <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded flex items-end gap-px">
                          {histogram.b.map((value, idx) => (
                            <div
                              key={idx}
                              className="flex-1 bg-blue-500"
                              style={{ height: `${(value / maxB) * 100}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } catch (error) {
                return <p className="text-sm text-slate-500">Failed to generate histogram</p>;
              }
            })()}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setHistogramDialog(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
