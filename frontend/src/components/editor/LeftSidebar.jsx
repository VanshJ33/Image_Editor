import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { LayoutTemplate, Upload, Type, Shapes, Image as ImageIcon, Sparkles, Palette, Search, Wand2, Zap, Crown, Layers3, Paintbrush } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEditor } from '../../contexts/EditorContext';
import { Textbox, Rect, Circle, Triangle, Line, FabricImage, FabricText, Polygon, Ellipse, Path, Gradient, Group, FabricObject } from 'fabric';

import { toast } from 'sonner';
import { loadGoogleFont } from '../../utils/googleFonts';
import { templates } from '../../data/templates';
import { canvaTemplates } from '../../data/canvaTemplates';
import ElementsPanel from './ElementsPanel';




const LeftSidebar = () => {
  const { canvas, saveToHistory, setCanvasSize, backgroundColor, setBackgroundColor, updateLayers, resizeCanvas } = useEditor();
  const [activeTab, setActiveTab] = useState('templates');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [templateSearch, setTemplateSearch] = useState('');


  const loadCanvaTemplate = async (template) => {
    if (!canvas) return;
    
    canvas.clear();
    backgroundObjRef.current = null;
    
    setCanvasSize({ width: 1080, height: 1080 });
    canvas.setWidth(1080);
    canvas.setHeight(1080);
    
    const fontsToLoad = new Set();
    template.json.objects.forEach(objData => {
      if (objData.type === 'textbox' && objData.fontFamily) {
        fontsToLoad.add(objData.fontFamily);
      }
    });
    
    for (const font of fontsToLoad) {
      await loadGoogleFont(font);
    }
    
    canvas.loadFromJSON(template.json, () => {
      // After loading, mark template elements
      canvas.getObjects().forEach(obj => {
        if (obj.isTemplateImage || obj.isTemplateText) {
          // Add visual indicators for template elements
          obj.set({
            borderColor: obj.isTemplateImage ? '#4f46e5' : '#10b981',
            borderScaleFactor: 2,
            cornerColor: obj.isTemplateImage ? '#4f46e5' : '#10b981',
            cornerSize: 12,
            transparentCorners: false,
            cornerStyle: 'circle'
          });
        }
      });
      
      canvas.renderAll();
      canvas.requestRenderAll();
      // Force canvas to fit viewport
      canvas.calcOffset();
      // Use setTimeout to ensure layers update after canvas is fully rendered
      setTimeout(() => {
        updateLayers();
        saveToHistory();
        canvas.renderAll();
        toast.success('Template loaded! Click on any element to customize it.');
      }, 150);

    });
  };


  const containerRef = useRef(null);
  const backgroundObjRef = useRef(null);
  const renderTimeoutRef = useRef(null);





  const addText = () => {
    if (canvas) {
      const text = new Textbox('Add your text here', {
        left: 100,
        top: 100,
        width: 300,
        fontSize: 32,
        fontFamily: 'Inter',
        fill: '#1e293b',
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      updateLayers();
    }
  };

  const addHeading = () => {
    if (canvas) {
      const text = new Textbox('Heading Text', {
        left: 100,
        top: 100,
        width: 500,
        fontSize: 64,
        fontFamily: 'Playfair Display',
        fontWeight: 'bold',
        fill: '#1e293b',
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      updateLayers();
    }
  };

  const addSubheading = () => {
    if (canvas) {
      const text = new Textbox('Subheading Text', {
        left: 100,
        top: 100,
        width: 400,
        fontSize: 36,
        fontFamily: 'Montserrat',
        fontWeight: '600',
        fill: '#475569',
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      updateLayers();
    }
  };

  const addTextWithEffect = (effect) => {
    if (canvas) {
      let textConfig = {
        left: 100,
        top: 100,
        width: 300,
        fontSize: 48,
        fontFamily: 'Inter',
        fontWeight: 'bold',
      };

      switch (effect) {
        case 'shadow':
          textConfig = {
            ...textConfig,
            text: 'Shadow Text',
            fill: '#1e293b',
            shadow: {
              color: 'rgba(0,0,0,0.3)',
              blur: 5,
              offsetX: 3,
              offsetY: 3
            }
          };
          break;
        case 'outline':
          textConfig = {
            ...textConfig,
            text: 'Outline Text',
            fill: 'transparent',
            stroke: '#1e293b',
            strokeWidth: 2
          };
          break;
        case 'gradient':
          textConfig = {
            ...textConfig,
            text: 'Gradient Text',
            fill: new Gradient({
              type: 'linear',
              coords: { x1: 0, y1: 0, x2: 100, y2: 0 },
              colorStops: [
                { offset: 0, color: '#8b5cf6' },
                { offset: 1, color: '#ec4899' }
              ]
            })
          };
          break;
        case 'glow':
          textConfig = {
            ...textConfig,
            text: 'Glow Text',
            fill: '#4f46e5',
            shadow: {
              color: '#4f46e5',
              blur: 15,
              offsetX: 0,
              offsetY: 0
            }
          };
          break;
        case '3d':
          textConfig = {
            ...textConfig,
            text: '3D Text',
            fill: '#1e293b',
            shadow: {
              color: 'rgba(0,0,0,0.8)',
              blur: 0,
              offsetX: 4,
              offsetY: 4
            },
            stroke: '#64748b',
            strokeWidth: 1
          };
          break;
        case 'neon':
          textConfig = {
            ...textConfig,
            text: 'Neon Text',
            fill: '#ff0080',
            shadow: {
              color: '#ff0080',
              blur: 20,
              offsetX: 0,
              offsetY: 0
            },
            stroke: '#ffffff',
            strokeWidth: 1
          };
          break;
        case 'vintage':
          textConfig = {
            ...textConfig,
            text: 'Vintage Text',
            fill: '#8b4513',
            shadow: {
              color: 'rgba(139, 69, 19, 0.4)',
              blur: 3,
              offsetX: 2,
              offsetY: 2
            },
            fontFamily: 'Playfair Display',
            opacity: 0.9
          };
          break;
        case 'metallic':
          textConfig = {
            ...textConfig,
            text: 'Metallic Text',
            fill: new Gradient({
              type: 'linear',
              coords: { x1: 0, y1: 0, x2: 0, y2: 100 },
              colorStops: [
                { offset: 0, color: '#e5e7eb' },
                { offset: 0.5, color: '#9ca3af' },
                { offset: 1, color: '#374151' }
              ]
            }),
            stroke: '#1f2937',
            strokeWidth: 1
          };
          break;
        case 'rainbow':
          textConfig = {
            ...textConfig,
            text: 'Rainbow Text',
            fill: new Gradient({
              type: 'linear',
              coords: { x1: 0, y1: 0, x2: 200, y2: 0 },
              colorStops: [
                { offset: 0, color: '#ff0000' },
                { offset: 0.16, color: '#ff8000' },
                { offset: 0.33, color: '#ffff00' },
                { offset: 0.5, color: '#00ff00' },
                { offset: 0.66, color: '#0080ff' },
                { offset: 0.83, color: '#8000ff' },
                { offset: 1, color: '#ff0080' }
              ]
            })
          };
          break;
        case 'emboss':
          textConfig = {
            ...textConfig,
            text: 'Emboss Text',
            fill: '#f3f4f6',
            shadow: {
              color: 'rgba(255,255,255,0.8)',
              blur: 1,
              offsetX: -1,
              offsetY: -1
            },
            stroke: 'rgba(0,0,0,0.2)',
            strokeWidth: 1
          };
          break;
        case 'glassmorphism':
          textConfig = {
            ...textConfig,
            text: 'Glass Text',
            fill: 'rgba(255,255,255,0.9)',
            shadow: {
              color: 'rgba(255,255,255,0.3)',
              blur: 10,
              offsetX: 0,
              offsetY: 0
            },
            stroke: 'rgba(255,255,255,0.2)',
            strokeWidth: 1,
            opacity: 0.8
          };
          break;
        case 'cyberpunk':
          textConfig = {
            ...textConfig,
            text: 'Cyber Text',
            fill: '#00ffff',
            shadow: {
              color: '#00ffff',
              blur: 25,
              offsetX: 0,
              offsetY: 0
            },
            fontFamily: 'Orbitron'
          };
          break;
        case 'holographic':
          textConfig = {
            ...textConfig,
            text: 'Holo Text',
            fill: new Gradient({
              type: 'linear',
              coords: { x1: 0, y1: 0, x2: 200, y2: 0 },
              colorStops: [
                { offset: 0, color: '#ff0080' },
                { offset: 0.25, color: '#8000ff' },
                { offset: 0.5, color: '#0080ff' },
                { offset: 0.75, color: '#00ff80' },
                { offset: 1, color: '#ff8000' }
              ]
            }),
            shadow: {
              color: 'rgba(255,255,255,0.5)',
              blur: 15,
              offsetX: 0,
              offsetY: 0
            }
          };
          break;
        case 'chrome':
          textConfig = {
            ...textConfig,
            text: 'Chrome Text',
            fill: new Gradient({
              type: 'linear',
              coords: { x1: 0, y1: 0, x2: 0, y2: 100 },
              colorStops: [
                { offset: 0, color: '#f8fafc' },
                { offset: 0.3, color: '#e2e8f0' },
                { offset: 0.7, color: '#94a3b8' },
                { offset: 1, color: '#475569' }
              ]
            }),
            stroke: '#1e293b',
            strokeWidth: 1
          };
          break;
        case 'fire':
          textConfig = {
            ...textConfig,
            text: 'Fire Text',
            fill: new Gradient({
              type: 'linear',
              coords: { x1: 0, y1: 100, x2: 0, y2: 0 },
              colorStops: [
                { offset: 0, color: '#dc2626' },
                { offset: 0.5, color: '#f97316' },
                { offset: 1, color: '#fbbf24' }
              ]
            }),
            shadow: {
              color: '#f97316',
              blur: 20,
              offsetX: 0,
              offsetY: 0
            }
          };
          break;
        case 'ice':
          textConfig = {
            ...textConfig,
            text: 'Ice Text',
            fill: new Gradient({
              type: 'linear',
              coords: { x1: 0, y1: 0, x2: 0, y2: 100 },
              colorStops: [
                { offset: 0, color: '#dbeafe' },
                { offset: 0.5, color: '#60a5fa' },
                { offset: 1, color: '#2563eb' }
              ]
            }),
            shadow: {
              color: '#60a5fa',
              blur: 15,
              offsetX: 0,
              offsetY: 0
            },
            stroke: '#ffffff',
            strokeWidth: 1
          };
          break;
        case 'gold':
          textConfig = {
            ...textConfig,
            text: 'Gold Text',
            fill: new Gradient({
              type: 'linear',
              coords: { x1: 0, y1: 0, x2: 0, y2: 100 },
              colorStops: [
                { offset: 0, color: '#fef3c7' },
                { offset: 0.3, color: '#fbbf24' },
                { offset: 0.7, color: '#d97706' },
                { offset: 1, color: '#92400e' }
              ]
            }),
            shadow: {
              color: '#fbbf24',
              blur: 10,
              offsetX: 2,
              offsetY: 2
            },
            stroke: '#92400e',
            strokeWidth: 1
          };
          break;
      }

      const text = new Textbox(textConfig.text, textConfig);
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      updateLayers();
      saveToHistory();
    }
  };

  const addCurvedText = (curveType) => {
    if (canvas) {
      let textConfig = {
        left: 100,
        top: 100,
        fontSize: 36,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        fill: '#1e293b',
      };

      let textContent = 'Curved Text';

      switch (curveType) {
        case 'arc':
          textConfig = {
            ...textConfig,
            angle: -15,
            skewX: 5
          };
          textContent = 'Arc Text';
          break;
        case 'circle':
          textConfig = {
            ...textConfig,
            angle: 45,
            originX: 'center',
            originY: 'center'
          };
          textContent = 'Circle Text';
          break;
        case 'wave':
          textConfig = {
            ...textConfig,
            skewY: 10,
            scaleY: 0.8
          };
          textContent = 'Wave Text';
          break;
        case 'spiral':
          textConfig = {
            ...textConfig,
            angle: 90,
            skewX: -10,
            skewY: 5
          };
          textContent = 'Spiral Text';
          break;
        case 'zigzag':
          textConfig = {
            ...textConfig,
            skewX: 15,
            skewY: -8,
            angle: 5
          };
          textContent = 'Zigzag Text';
          break;
        case 'bounce':
          textConfig = {
            ...textConfig,
            scaleY: 1.3,
            skewY: -5,
            angle: -8
          };
          textContent = 'Bounce Text';
          break;
        case 'tilt':
          textConfig = {
            ...textConfig,
            angle: 25,
            skewX: -5
          };
          textContent = 'Tilt Text';
          break;
        case 'perspective':
          textConfig = {
            ...textConfig,
            skewX: -20,
            scaleY: 0.7,
            angle: 10
          };
          textContent = 'Perspective';
          break;
        case 'wobble':
          textConfig = {
            ...textConfig,
            skewX: 8,
            skewY: 12,
            scaleX: 0.9
          };
          textContent = 'Wobble Text';
          break;
      }

      const text = new Textbox(textContent, textConfig);
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      updateLayers();
      saveToHistory();
    }
  };

  const addSpacedText = (spacing) => {
    if (canvas) {
      let letterSpacing;
      let textContent;

      switch (spacing) {
        case 'tight':
          letterSpacing = -50;
          textContent = 'Tight Text';
          break;
        case 'normal':
          letterSpacing = 0;
          textContent = 'Normal Text';
          break;
        case 'wide':
          letterSpacing = 100;
          textContent = 'Wide Text';
          break;
        case 'extra-wide':
          letterSpacing = 200;
          textContent = 'Extra Wide';
          break;
        case 'ultra-wide':
          letterSpacing = 300;
          textContent = 'Ultra Wide';
          break;
        case 'mega-wide':
          letterSpacing = 400;
          textContent = 'Mega Wide';
          break;
        case 'condensed':
          letterSpacing = -100;
          textContent = 'Condensed';
          break;
        case 'ultra-tight':
          letterSpacing = -150;
          textContent = 'Ultra Tight';
          break;
      }

      const text = new Textbox(textContent, {
        left: 100,
        top: 100,
        width: 400,
        fontSize: 36,
        fontFamily: 'Inter',
        fontWeight: '600',
        fill: '#1e293b',
        charSpacing: letterSpacing
      });

      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      updateLayers();
      saveToHistory();
    }
  };

  // Custom shape creation tool
  const [isDrawingCustom, setIsDrawingCustom] = useState(false);
  const [customPath, setCustomPath] = useState([]);
  const [isCustomPathComplete, setIsCustomPathComplete] = useState(false);

  const startCustomShape = () => {
    setIsDrawingCustom(true);
    setCustomPath([]);
    setIsCustomPathComplete(false);
    toast.info('Click on canvas to start drawing your custom shape. Right-click to finish.');
  };

  const finishCustomShape = () => {
    if (customPath.length < 3) {
      toast.error('Custom shape needs at least 3 points');
      return;
    }
    
    if (canvas) {
      const path = new Path(customPath.join(' '), {
        left: 100,
        top: 100,
        fill: '#4f46e5',
        stroke: '#3b82f6',
        strokeWidth: 2,
      });
      
      canvas.add(path);
      canvas.setActiveObject(path);
      canvas.renderAll();
      updateLayers();
      saveToHistory();
      
      setIsDrawingCustom(false);
      setCustomPath([]);
      setIsCustomPathComplete(false);
      toast.success('Custom shape created!');
    }
  };

  const addShape = (shapeType) => {
    if (canvas) {
      let shape;
      switch (shapeType) {
        case 'rectangle':
          shape = new Rect({
            left: 100,
            top: 100,
            width: 200,
            height: 150,
            fill: '#4f46e5',
            rx: 8,
            ry: 8,
          });
          break;
        case 'circle':
          shape = new Circle({
            left: 100,
            top: 100,
            radius: 75,
            fill: '#06b6d4',
          });
          break;
        case 'triangle':
          shape = new Triangle({
            left: 100,
            top: 100,
            width: 150,
            height: 150,
            fill: '#10b981',
          });
          break;
        case 'line':
          shape = new Line([50, 100, 200, 100], {
            left: 100,
            top: 100,
            stroke: '#1e293b',
            strokeWidth: 3,
          });
          break;
        case 'star':
          const starPoints = [];
          const outerRadius = 50;
          const innerRadius = 25;
          for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            starPoints.push({
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius
            });
          }
          shape = new Polygon(starPoints, {
            left: 100,
            top: 100,
            fill: '#f59e0b',
          });
          break;
        case 'diamond':
          shape = new Polygon([
            { x: 0, y: -50 },
            { x: 50, y: 0 },
            { x: 0, y: 50 },
            { x: -50, y: 0 }
          ], {
            left: 100,
            top: 100,
            fill: '#ec4899',
          });
          break;
        case 'hexagon':
          const hexPoints = [];
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            hexPoints.push({
              x: Math.cos(angle) * 40,
              y: Math.sin(angle) * 40
            });
          }
          shape = new Polygon(hexPoints, {
            left: 100,
            top: 100,
            fill: '#8b5cf6',
          });
          break;
        case 'arrow':
          shape = new Polygon([
            { x: -40, y: -15 },
            { x: 20, y: -15 },
            { x: 20, y: -30 },
            { x: 50, y: 0 },
            { x: 20, y: 30 },
            { x: 20, y: 15 },
            { x: -40, y: 15 }
          ], {
            left: 100,
            top: 100,
            fill: '#ef4444',
          });
          break;
        case 'heart':
          const heartPath = 'M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z';
          shape = new Path(heartPath, {
            left: 100,
            top: 100,
            fill: '#f43f5e',
            scaleX: 3,
            scaleY: 3,
          });
          break;
        case 'ellipse':
          shape = new Ellipse({
            left: 100,
            top: 100,
            rx: 80,
            ry: 50,
            fill: '#14b8a6',
          });
          break;
        case 'pentagon':
          const pentPoints = [];
          for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            pentPoints.push({
              x: Math.cos(angle) * 40,
              y: Math.sin(angle) * 40
            });
          }
          shape = new Polygon(pentPoints, {
            left: 100,
            top: 100,
            fill: '#f97316',
          });
          break;
        case 'octagon':
          const octPoints = [];
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            octPoints.push({
              x: Math.cos(angle) * 40,
              y: Math.sin(angle) * 40
            });
          }
          shape = new Polygon(octPoints, {
            left: 100,
            top: 100,
            fill: '#84cc16',
          });
          break;
        case 'cross':
          shape = new Polygon([
            { x: -10, y: -30 }, { x: 10, y: -30 },
            { x: 10, y: -10 }, { x: 30, y: -10 },
            { x: 30, y: 10 }, { x: 10, y: 10 },
            { x: 10, y: 30 }, { x: -10, y: 30 },
            { x: -10, y: 10 }, { x: -30, y: 10 },
            { x: -30, y: -10 }, { x: -10, y: -10 }
          ], {
            left: 100,
            top: 100,
            fill: '#dc2626',
          });
          break;
        case 'plus':
          shape = new Polygon([
            { x: -8, y: -25 }, { x: 8, y: -25 },
            { x: 8, y: -8 }, { x: 25, y: -8 },
            { x: 25, y: 8 }, { x: 8, y: 8 },
            { x: 8, y: 25 }, { x: -8, y: 25 },
            { x: -8, y: 8 }, { x: -25, y: 8 },
            { x: -25, y: -8 }, { x: -8, y: -8 }
          ], {
            left: 100,
            top: 100,
            fill: '#059669',
          });
          break;
        case 'minus':
          shape = new Rect({
            left: 100,
            top: 100,
            width: 50,
            height: 8,
            fill: '#6b7280',
            rx: 4,
            ry: 4,
          });
          break;
          case 'thinRectangle':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 120,
    height: 6,
    fill: '#4f46e5',
    rx: 3,
    ry: 3,
  });
  break;

case 'pill':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 80,
    height: 25,
    fill: '#06b6d4',
    rx: 12,
    ry: 12,
  });
  break;

case 'smallCircle':
  shape = new Circle({
    left: 100,
    top: 100,
    radius: 20,
    fill: '#10b981',
  });
  break;

case 'dot':
  shape = new Circle({
    left: 100,
    top: 100,
    radius: 8,
    fill: '#ef4444',
  });
  break;

case 'oval':
  shape = new Ellipse({
    left: 100,
    top: 100,
    rx: 40,
    ry: 25,
    fill: '#f59e0b',
  });
  break;

case 'smallSquare':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 60,
    height: 60,
    fill: '#8b5cf6',
    rx: 4,
    ry: 4,
  });
  break;

case 'verticalLine':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 6,
    height: 80,
    fill: '#ec4899',
    rx: 3,
    ry: 3,
  });
  break;

case 'thickLine':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 100,
    height: 12,
    fill: '#f97316',
    rx: 6,
    ry: 6,
  });
  break;

case 'capsule':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 60,
    height: 30,
    fill: '#84cc16',
    rx: 15,
    ry: 15,
  });
  break;

case 'tinyCircle':
  shape = new Circle({
    left: 100,
    top: 100,
    radius: 12,
    fill: '#dc2626',
  });
  break;

case 'smallPill':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 50,
    height: 15,
    fill: '#0ea5e9',
    rx: 7,
    ry: 7,
  });
  break;

case 'button':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 100,
    height: 40,
    fill: '#6366f1',
    rx: 8,
    ry: 8,
    stroke: '#4f46e5',
    strokeWidth: 2,
  });
  break;

case 'badge':
  shape = new Circle({
    left: 100,
    top: 100,
    radius: 25,
    fill: '#ec4899',
    stroke: '#be185d',
    strokeWidth: 3,
  });
  break;

case 'progressBar':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 200,
    height: 10,
    fill: '#06b6d4',
    rx: 5,
    ry: 5,
  });
  break;

case 'divider':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 180,
    height: 2,
    fill: '#6b7280',
    rx: 1,
    ry: 1,
  });
  break;

case 'indicator':
  shape = new Circle({
    left: 100,
    top: 100,
    radius: 6,
    fill: '#22c55e',
  });
  break;

case 'toggle':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 45,
    height: 25,
    fill: '#d1d5db',
    rx: 12,
    ry: 12,
  });
  break;

case 'toggleOn':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 45,
    height: 25,
    fill: '#10b981',
    rx: 12,
    ry: 12,
  });
  break;

case 'slider':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 150,
    height: 6,
    fill: '#e5e7eb',
    rx: 3,
    ry: 3,
  });
  break;

case 'sliderThumb':
  shape = new Circle({
    left: 100,
    top: 100,
    radius: 12,
    fill: '#3b82f6',
    stroke: '#1d4ed8',
    strokeWidth: 2,
  });
  break;

case 'inputField':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 180,
    height: 45,
    fill: 'white',
    stroke: '#d1d5db',
    strokeWidth: 2,
    rx: 8,
    ry: 8,
  });
  break;

case 'card':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 160,
    height: 120,
    fill: 'white',
    stroke: '#e5e7eb',
    strokeWidth: 2,
    rx: 12,
    ry: 12,
    shadow: 'rgba(0, 0, 0, 0.1) 0 2px 8px',
  });
  break;

case 'chip':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 80,
    height: 32,
    fill: '#e0e7ff',
    stroke: '#c7d2fe',
    strokeWidth: 1,
    rx: 16,
    ry: 16,
  });
  break;

case 'avatar':
  shape = new Circle({
    left: 100,
    top: 100,
    radius: 30,
    fill: '#6b7280',
    stroke: '#374151',
    strokeWidth: 2,
  });
  break;

case 'notification':
  shape = new Circle({
    left: 100,
    top: 100,
    radius: 10,
    fill: '#ef4444',
    stroke: '#dc2626',
    strokeWidth: 1,
  });
  break;

case 'statusOnline':
  shape = new Circle({
    left: 100,
    top: 100,
    radius: 8,
    fill: '#22c55e',
    stroke: '#16a34a',
    strokeWidth: 1,
  });
  break;

case 'statusOffline':
  shape = new Circle({
    left: 100,
    top: 100,
    radius: 8,
    fill: '#6b7280',
    stroke: '#4b5563',
    strokeWidth: 1,
  });
  break;

case 'statusAway':
  shape = new Circle({
    left: 100,
    top: 100,
    radius: 8,
    fill: '#f59e0b',
    stroke: '#d97706',
    strokeWidth: 1,
  });
  break;

case 'radio':
  shape = new Circle({
    left: 100,
    top: 100,
    radius: 12,
    fill: 'white',
    stroke: '#d1d5db',
    strokeWidth: 2,
  });
  break;

case 'radioSelected':
  shape = new Group([
    new Circle({
      radius: 12,
      fill: 'white',
      stroke: '#3b82f6',
      strokeWidth: 2,
    }),
    new Circle({
      radius: 6,
      fill: '#3b82f6',
    })
  ], {
    left: 100,
    top: 100,
  });
  break;

case 'checkbox':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 20,
    height: 20,
    fill: 'white',
    stroke: '#d1d5db',
    strokeWidth: 2,
    rx: 4,
    ry: 4,
  });
  break;

case 'checkboxChecked':
  shape = new Group([
    new Rect({
      width: 20,
      height: 20,
      fill: '#3b82f6',
      stroke: '#2563eb',
      strokeWidth: 2,
      rx: 4,
      ry: 4,
    })
  ], {
    left: 100,
    top: 100,
  });
  break;

case 'tag':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 70,
    height: 28,
    fill: '#f3f4f6',
    stroke: '#d1d5db',
    strokeWidth: 1,
    rx: 14,
    ry: 14,
  });
  break;

case 'breadcrumb':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 25,
    height: 25,
    fill: '#f3f4f6',
    stroke: '#d1d5db',
    strokeWidth: 1,
    rx: 4,
    ry: 4,
  });
  break;

case 'step':
  shape = new Rect({
    left: 100,
    top: 100,
    width: 30,
    height: 4,
    fill: '#3b82f6',
    rx: 2,
    ry: 2,
  });
  break;

case 'loader':
  shape = new Circle({
    left: 100,
    top: 100,
    radius: 20,
    fill: 'transparent',
    stroke: '#3b82f6',
    strokeWidth: 3,
    strokeDashArray: [5, 5],
  });
  break;
        case 'cloud':
          const cloudPath = 'M25,60 C10,60 5,45 15,35 C5,25 15,15 25,20 C30,10 45,15 45,25 C55,20 65,30 55,40 C65,45 60,60 45,60 Z';
          shape = new Path(cloudPath, {
            left: 100,
            top: 100,
            fill: '#0ea5e9',
            scaleX: 1.5,
            scaleY: 1.5,
          });
          break;
        case 'lightning':
          shape = new Polygon([
            { x: -15, y: -30 }, { x: 5, y: -30 },
            { x: -5, y: -5 }, { x: 15, y: -5 },
            { x: -10, y: 30 }, { x: -5, y: 5 },
            { x: -20, y: 5 }
          ], {
            left: 100,
            top: 100,
            fill: '#fbbf24',
          });
          break;
        case 'moon':
          const moonPath = 'M50,10 A40,40 0 1,0 50,90 A30,30 0 1,1 50,10 Z';
          shape = new Path(moonPath, {
            left: 100,
            top: 100,
            fill: '#fde047',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'sun':
          const sunPoints = [];
          for (let i = 0; i < 16; i++) {
            const angle = (i * Math.PI) / 8;
            const radius = i % 2 === 0 ? 35 : 20;
            sunPoints.push({
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius
            });
          }
          shape = new Polygon(sunPoints, {
            left: 100,
            top: 100,
            fill: '#f59e0b',
          });
          break;
        case 'speech':
          shape = new Polygon([
            { x: -40, y: -25 }, { x: 40, y: -25 },
            { x: 40, y: 10 }, { x: 5, y: 10 },
            { x: -10, y: 25 }, { x: -5, y: 10 },
            { x: -40, y: 10 }
          ], {
            left: 100,
            top: 100,
            fill: '#6366f1',
            rx: 10,
            ry: 10,
          });
          break;
        case 'badge':
          const badgePoints = [];
          for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI) / 6;
            const radius = i % 2 === 0 ? 45 : 35;
            badgePoints.push({
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius
            });
          }
          shape = new Polygon(badgePoints, {
            left: 100,
            top: 100,
            fill: '#dc2626',
          });
          break;
        case 'ribbon':
          shape = new Polygon([
            { x: -50, y: -20 }, { x: 50, y: -20 },
            { x: 50, y: 20 }, { x: 30, y: 20 },
            { x: 40, y: 35 }, { x: 20, y: 25 },
            { x: 0, y: 35 }, { x: -20, y: 25 },
            { x: -40, y: 35 }, { x: -30, y: 20 },
            { x: -50, y: 20 }
          ], {
            left: 100,
            top: 100,
            fill: '#7c3aed',
          });
          break;
        case 'banner':
          shape = new Polygon([
            { x: -60, y: -25 }, { x: 40, y: -25 },
            { x: 60, y: 0 }, { x: 40, y: 25 },
            { x: -60, y: 25 }
          ], {
            left: 100,
            top: 100,
            fill: '#059669',
          });
          break;
        case 'frame':
          shape = new Rect({
            left: 100,
            top: 100,
            width: 120,
            height: 120,
            fill: 'transparent',
            stroke: '#374151',
            strokeWidth: 8,
            rx: 15,
            ry: 15,
          });
          break;
        case 'burst':
          const burstPoints = [];
          for (let i = 0; i < 24; i++) {
            const angle = (i * Math.PI) / 12;
            const radius = i % 2 === 0 ? 50 : 25;
            burstPoints.push({
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius
            });
          }
          shape = new Polygon(burstPoints, {
            left: 100,
            top: 100,
            fill: '#f59e0b',
          });
          break;
        case 'shield':
          shape = new Polygon([
            { x: 0, y: -50 }, { x: 30, y: -40 },
            { x: 40, y: -10 }, { x: 40, y: 20 },
            { x: 30, y: 40 }, { x: 0, y: 50 },
            { x: -30, y: 40 }, { x: -40, y: 20 },
            { x: -40, y: -10 }, { x: -30, y: -40 }
          ], {
            left: 100,
            top: 100,
            fill: '#1d4ed8',
          });
          break;
        case 'flower':
          const flowerPoints = [];
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const radius = 40;
            flowerPoints.push({
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius
            });
            const midAngle = angle + Math.PI / 8;
            flowerPoints.push({
              x: Math.cos(midAngle) * 15,
              y: Math.sin(midAngle) * 15
            });
          }
          shape = new Polygon(flowerPoints, {
            left: 100,
            top: 100,
            fill: '#ec4899',
          });
          break;
        case 'gear':
          const gearPoints = [];
          for (let i = 0; i < 16; i++) {
            const angle = (i * Math.PI) / 8;
            const radius = i % 2 === 0 ? 45 : 30;
            gearPoints.push({
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius
            });
          }
          shape = new Polygon(gearPoints, {
            left: 100,
            top: 100,
            fill: '#6b7280',
          });
          break;
        case 'leaf':
          const leafPath = 'M50,100 Q25,75 25,50 Q25,25 50,0 Q75,25 75,50 Q75,75 50,100 Z';
          shape = new Path(leafPath, {
            left: 100,
            top: 100,
            fill: '#22c55e',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'crown':
          shape = new Polygon([
            { x: -40, y: 20 }, { x: -30, y: -10 },
            { x: -15, y: 10 }, { x: 0, y: -20 },
            { x: 15, y: 10 }, { x: 30, y: -10 },
            { x: 40, y: 20 }, { x: 35, y: 30 },
            { x: -35, y: 30 }
          ], {
            left: 100,
            top: 100,
            fill: '#fbbf24',
          });
          break;
        case 'butterfly':
          const butterflyPath = 'M50,50 Q30,30 20,40 Q10,50 20,60 Q30,70 50,50 Q70,30 80,40 Q90,50 80,60 Q70,70 50,50 M50,30 Q45,20 50,10 Q55,20 50,30 M50,70 Q45,80 50,90 Q55,80 50,70';
          shape = new Path(butterflyPath, {
            left: 100,
            top: 100,
            fill: '#a855f7',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'wave':
          const wavePath = 'M0,50 Q25,25 50,50 T100,50 L100,75 Q75,100 50,75 T0,75 Z';
          shape = new Path(wavePath, {
            left: 100,
            top: 100,
            fill: '#06b6d4',
            scaleX: 1.2,
            scaleY: 0.8,
          });
          break;
        case 'infinity':
          const infinityPath = 'M25,50 Q0,25 25,25 Q50,25 50,50 Q50,75 25,75 Q0,75 25,50 Q50,25 75,25 Q100,25 75,50 Q50,75 75,75 Q100,75 75,50';
          shape = new Path(infinityPath, {
            left: 100,
            top: 100,
            fill: '#8b5cf6',
            scaleX: 0.8,
            scaleY: 0.6,
          });
          break;
        case 'spiral':
          const spiralPath = 'M50,50 Q50,20 80,20 Q110,20 110,50 Q110,80 80,80 Q50,80 50,50 Q50,35 65,35 Q80,35 80,50 Q80,65 65,65 Q50,65 50,50';
          shape = new Path(spiralPath, {
            left: 100,
            top: 100,
            fill: '#f59e0b',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'sparkle':
          const sparklePoints = [];
          for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI) / 6;
            const radius = i % 2 === 0 ? 40 : 15;
            sparklePoints.push({
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius
            });
          }
          shape = new Polygon(sparklePoints, {
            left: 100,
            top: 100,
            fill: '#fbbf24',
          });
          break;
        case 'crescent':
          const crescentPath = 'M50,10 A40,40 0 1,0 50,90 A30,30 0 1,1 50,10 Z';
          shape = new Path(crescentPath, {
            left: 100,
            top: 100,
            fill: '#fde047',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'teardrop':
          const teardropPath = 'M50,10 Q30,30 30,60 Q30,80 50,80 Q70,80 70,60 Q70,30 50,10 Z';
          shape = new Path(teardropPath, {
            left: 100,
            top: 100,
            fill: '#06b6d4',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'lens':
          const lensPath = 'M50,10 Q30,30 30,50 Q30,70 50,90 Q70,70 70,50 Q70,30 50,10 Z';
          shape = new Path(lensPath, {
            left: 100,
            top: 100,
            fill: '#8b5cf6',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'bracket':
          shape = new Path('M20,20 L20,80 L40,80 L40,60 L60,60 L60,40 L40,40 L40,20 Z', {
            left: 100,
            top: 100,
            fill: '#6b7280',
            scaleX: 1.2,
            scaleY: 1.2,
          });
          break;
        case 'chevron':
          shape = new Polygon([
            { x: -40, y: 0 }, { x: -20, y: -20 },
            { x: 0, y: 0 }, { x: 20, y: -20 },
            { x: 40, y: 0 }, { x: 20, y: 20 },
            { x: 0, y: 0 }, { x: -20, y: 20 }
          ], {
            left: 100,
            top: 100,
            fill: '#3b82f6',
          });
          break;
        case 'zigzag':
          shape = new Path('M10,50 L30,20 L50,50 L70,20 L90,50 L110,20 L130,50', {
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: '#ef4444',
            strokeWidth: 4,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'squiggle':
          shape = new Path('M10,50 Q30,20 50,50 T90,50 T130,50', {
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: '#10b981',
            strokeWidth: 4,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'callout':
          shape = new Polygon([
            { x: -40, y: -25 }, { x: 40, y: -25 },
            { x: 40, y: 10 }, { x: 20, y: 10 },
            { x: 10, y: 25 }, { x: 0, y: 10 },
            { x: -40, y: 10 }
          ], {
            left: 100,
            top: 100,
            fill: '#fbbf24',
            rx: 10,
            ry: 10,
          });
          break;
        case 'bracket':
          shape = new Path('M20,20 L20,80 L40,80 L40,60 L60,60 L60,40 L40,40 L40,20 Z', {
            left: 100,
            top: 100,
            fill: '#6b7280',
            scaleX: 1.2,
            scaleY: 1.2,
          });
          break;
        case 'arrowUp':
          shape = new Polygon([
            { x: 0, y: 30 }, { x: -20, y: 10 },
            { x: -10, y: 10 }, { x: -10, y: -30 },
            { x: 10, y: -30 }, { x: 10, y: 10 },
            { x: 20, y: 10 }
          ], {
            left: 100,
            top: 100,
            fill: '#22c55e',
          });
          break;
        case 'arrowDown':
          shape = new Polygon([
            { x: 0, y: -30 }, { x: -20, y: -10 },
            { x: -10, y: -10 }, { x: -10, y: 30 },
            { x: 10, y: 30 }, { x: 10, y: -10 },
            { x: 20, y: -10 }
          ], {
            left: 100,
            top: 100,
            fill: '#22c55e',
          });
          break;
        case 'arrowLeft':
          shape = new Polygon([
            { x: 30, y: 0 }, { x: 10, y: -20 },
            { x: 10, y: -10 }, { x: -30, y: -10 },
            { x: -30, y: 10 }, { x: 10, y: 10 },
            { x: 10, y: 20 }
          ], {
            left: 100,
            top: 100,
            fill: '#22c55e',
          });
          break;
        case 'arrowRight':
          shape = new Polygon([
            { x: -30, y: 0 }, { x: -10, y: -20 },
            { x: -10, y: -10 }, { x: 30, y: -10 },
            { x: 30, y: 10 }, { x: -10, y: 10 },
            { x: -10, y: 20 }
          ], {
            left: 100,
            top: 100,
            fill: '#22c55e',
          });
          break;
        case 'doubleArrow':
          shape = new Group([
            new Polygon([
              { x: -30, y: 0 }, { x: -10, y: -15 },
              { x: -10, y: -5 }, { x: 10, y: -5 },
              { x: 10, y: 5 }, { x: -10, y: 5 },
              { x: -10, y: 15 }
            ], { fill: '#3b82f6' }),
            new Polygon([
              { x: 30, y: 0 }, { x: 10, y: -15 },
              { x: 10, y: -5 }, { x: -10, y: -5 },
              { x: -10, y: 5 }, { x: 10, y: 5 },
              { x: 10, y: 15 }
            ], { fill: '#3b82f6' })
          ], {
            left: 100,
            top: 100,
          });
          break;
        case 'curvedArrow':
          const curvedArrowPath = 'M20,50 Q50,20 80,50 Q50,80 20,50 M70,40 L80,50 L70,60';
          shape = new Path(curvedArrowPath, {
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: '#8b5cf6',
            strokeWidth: 4,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'bentArrow':
          shape = new Path('M20,50 L60,50 L60,30 L80,50 L60,70 L60,50', {
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: '#f59e0b',
            strokeWidth: 4,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'circularArrow':
          const circularArrowPath = 'M50,10 A40,40 0 1,1 50,90 M70,70 L80,80 L70,90';
          shape = new Path(circularArrowPath, {
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: '#ec4899',
            strokeWidth: 4,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'returnArrow':
          shape = new Path('M20,50 L60,50 L60,30 L80,50 L60,70 L60,50 M20,50 L20,30 L40,30 L40,50', {
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: '#10b981',
            strokeWidth: 4,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'playButton':
          shape = new Polygon([
            { x: -20, y: -25 }, { x: 20, y: 0 },
            { x: -20, y: 25 }
          ], {
            left: 100,
            top: 100,
            fill: '#22c55e',
          });
          break;
        case 'pauseButton':
          shape = new Group([
            new Rect({ width: 8, height: 30, fill: '#22c55e', left: -15, top: -15 }),
            new Rect({ width: 8, height: 30, fill: '#22c55e', left: 7, top: -15 })
          ], {
            left: 100,
            top: 100,
          });
          break;
        case 'stopButton':
          shape = new Rect({
            left: 100,
            top: 100,
            width: 30,
            height: 30,
            fill: '#ef4444',
            rx: 4,
            ry: 4,
          });
          break;
        case 'recordButton':
          shape = new Circle({
            left: 100,
            top: 100,
            radius: 15,
            fill: '#ef4444',
            stroke: '#dc2626',
            strokeWidth: 3,
          });
          break;
        case 'volumeIcon':
          shape = new Path('M15,30 L35,30 L50,45 L50,15 L35,30 M15,30 L15,50 L25,50 L35,40', {
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: '#6b7280',
            strokeWidth: 3,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'muteIcon':
          shape = new Group([
            new Path('M15,30 L35,30 L50,45 L50,15 L35,30 M15,30 L15,50 L25,50 L35,40', {
              fill: 'transparent',
              stroke: '#6b7280',
              strokeWidth: 3,
            }),
            new Line([10, 10, 50, 50], {
              stroke: '#ef4444',
              strokeWidth: 3,
            })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'wifiIcon':
          shape = new Group([
            new Path('M50,70 Q30,50 30,30 Q30,10 50,10 Q70,10 70,30 Q70,50 50,70', {
              fill: 'transparent',
              stroke: '#6b7280',
              strokeWidth: 2,
            }),
            new Path('M50,60 Q40,50 40,40 Q40,30 50,30 Q60,30 60,40 Q60,50 50,60', {
              fill: 'transparent',
              stroke: '#6b7280',
              strokeWidth: 2,
            }),
            new Circle({ radius: 3, fill: '#6b7280', left: 47, top: 47 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'bluetoothIcon':
          shape = new Path('M20,20 L40,40 L20,60 L30,70 L50,50 L30,30 L50,10 L40,20 L20,40 M40,40 L40,60', {
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: '#3b82f6',
            strokeWidth: 3,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'locationIcon':
          shape = new Path('M50,10 C30,10 15,25 15,45 C15,65 50,90 50,90 C50,90 85,65 85,45 C85,25 70,10 50,10 Z M50,35 C45,35 40,40 40,45 C40,50 45,55 50,55 C55,55 60,50 60,45 C60,40 55,35 50,35 Z', {
            left: 100,
            top: 100,
            fill: '#ef4444',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'phoneIcon':
          shape = new Path('M25,10 C20,10 15,15 15,20 L15,70 C15,75 20,80 25,80 L35,80 C40,80 45,75 45,70 L45,20 C45,15 40,10 35,10 L25,10 Z M30,15 C32,15 34,17 34,19 C34,21 32,23 30,23 C28,23 26,21 26,19 C26,17 28,15 30,15 Z', {
            left: 100,
            top: 100,
            fill: '#22c55e',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'mailIcon':
          shape = new Path('M10,20 L50,50 L90,20 L90,70 L10,70 Z M10,20 L50,40 L90,20', {
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: '#6b7280',
            strokeWidth: 3,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'calendarIcon':
          shape = new Group([
            new Rect({ width: 60, height: 50, fill: 'white', stroke: '#6b7280', strokeWidth: 2, left: 20, top: 30 }),
            new Rect({ width: 60, height: 15, fill: '#3b82f6', left: 20, top: 15 }),
            new Line([30, 30, 30, 45], { stroke: '#6b7280', strokeWidth: 1 }),
            new Line([40, 30, 40, 45], { stroke: '#6b7280', strokeWidth: 1 }),
            new Line([50, 30, 50, 45], { stroke: '#6b7280', strokeWidth: 1 }),
            new Line([60, 30, 60, 45], { stroke: '#6b7280', strokeWidth: 1 }),
            new Line([70, 30, 70, 45], { stroke: '#6b7280', strokeWidth: 1 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'clockIcon':
          shape = new Group([
            new Circle({ radius: 25, fill: 'white', stroke: '#6b7280', strokeWidth: 3 }),
            new Line([0, 0, 0, -15], { stroke: '#6b7280', strokeWidth: 2 }),
            new Line([0, 0, 10, 0], { stroke: '#6b7280', strokeWidth: 2 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'settingsIcon':
          shape = new Group([
            new Circle({ radius: 20, fill: 'transparent', stroke: '#6b7280', strokeWidth: 3 }),
            new Circle({ radius: 3, fill: '#6b7280', left: -3, top: -20 }),
            new Circle({ radius: 3, fill: '#6b7280', left: -3, top: 17 }),
            new Circle({ radius: 3, fill: '#6b7280', left: 17, top: -3 }),
            new Circle({ radius: 3, fill: '#6b7280', left: -20, top: -3 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'searchIcon':
          shape = new Group([
            new Circle({ radius: 15, fill: 'transparent', stroke: '#6b7280', strokeWidth: 3 }),
            new Line([10, 10, 20, 20], { stroke: '#6b7280', strokeWidth: 3 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'heartIcon':
          const heartIconPath = 'M50,85 C50,85 10,50 10,30 C10,15 20,5 35,5 C42,5 48,9 50,15 C52,9 58,5 65,5 C80,5 90,15 90,30 C90,50 50,85 50,85 Z';
          shape = new Path(heartIconPath, {
            left: 100,
            top: 100,
            fill: '#ef4444',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'starIcon':
          const starIconPoints = [];
          for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5;
            const radius = i % 2 === 0 ? 20 : 8;
            starIconPoints.push({
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius
            });
          }
          shape = new Polygon(starIconPoints, {
            left: 100,
            top: 100,
            fill: '#fbbf24',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'bookmarkIcon':
          shape = new Path('M20,10 L20,80 L50,60 L80,80 L80,10 Z', {
            left: 100,
            top: 100,
            fill: '#3b82f6',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'tagIcon':
          shape = new Path('M20,20 L60,20 L80,40 L60,60 L20,60 Z M50,30 L55,35 L50,40 L45,35 Z', {
            left: 100,
            top: 100,
            fill: '#10b981',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'flagIcon':
          shape = new Group([
            new Rect({ width: 4, height: 50, fill: '#8b5cf6', left: 20, top: 20 }),
            new Polygon([
              { x: 24, y: 20 }, { x: 60, y: 30 },
              { x: 24, y: 40 }
            ], { fill: '#ef4444' })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'thumbsUpIcon':
          shape = new Path('M20,60 L20,40 L30,40 L30,20 L50,20 L50,10 L60,10 L60,30 L50,30 L50,60 Z M10,60 L10,70 L70,70 L70,60', {
            left: 100,
            top: 100,
            fill: '#22c55e',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'thumbsDownIcon':
          shape = new Path('M60,20 L60,40 L50,40 L50,60 L30,60 L30,70 L20,70 L20,50 L30,50 L30,20 Z M10,20 L10,10 L70,10 L70,20', {
            left: 100,
            top: 100,
            fill: '#ef4444',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'shareIcon':
          shape = new Group([
            new Circle({ radius: 8, fill: 'transparent', stroke: '#6b7280', strokeWidth: 2, left: 12, top: 12 }),
            new Circle({ radius: 8, fill: 'transparent', stroke: '#6b7280', strokeWidth: 2, left: 52, top: 12 }),
            new Circle({ radius: 8, fill: 'transparent', stroke: '#6b7280', strokeWidth: 2, left: 32, top: 52 }),
            new Line([20, 20, 60, 20], { stroke: '#6b7280', strokeWidth: 2 }),
            new Line([60, 20, 40, 52], { stroke: '#6b7280', strokeWidth: 2 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'downloadIcon':
          shape = new Group([
            new Path('M30,20 L30,50 L40,50 L40,20 L50,20 L50,50 L60,50 L60,20 L70,20 L70,60 L30,60 Z', {
              fill: '#6b7280'
            }),
            new Line([40, 10, 40, 20], { stroke: '#6b7280', strokeWidth: 2 }),
            new Line([50, 10, 50, 20], { stroke: '#6b7280', strokeWidth: 2 }),
            new Line([60, 10, 60, 20], { stroke: '#6b7280', strokeWidth: 2 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'uploadIcon':
          shape = new Group([
            new Path('M30,40 L30,10 L40,10 L40,40 L50,40 L50,10 L60,10 L60,40 L70,40 L70,50 L30,50 Z', {
              fill: '#6b7280'
            }),
            new Line([40, 50, 40, 60], { stroke: '#6b7280', strokeWidth: 2 }),
            new Line([50, 50, 50, 60], { stroke: '#6b7280', strokeWidth: 2 }),
            new Line([60, 50, 60, 60], { stroke: '#6b7280', strokeWidth: 2 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'refreshIcon':
          shape = new Path('M50,10 A40,40 0 1,1 50,90 M70,70 L80,80 L70,90 M30,30 L20,20 L30,10', {
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: '#3b82f6',
            strokeWidth: 3,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'editIcon':
          shape = new Path('M20,70 L30,60 L60,30 L70,40 L40,70 L30,80 Z M50,20 L60,30 L50,40 L40,30 Z', {
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: '#6b7280',
            strokeWidth: 3,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'deleteIcon':
          shape = new Group([
            new Rect({ width: 50, height: 60, fill: '#ef4444', rx: 5, ry: 5, left: 25, top: 20 }),
            new Rect({ width: 10, height: 15, fill: '#dc2626', left: 45, top: 5 }),
            new Line([30, 35, 70, 35], { stroke: 'white', strokeWidth: 2 }),
            new Line([30, 45, 70, 45], { stroke: 'white', strokeWidth: 2 }),
            new Line([30, 55, 70, 55], { stroke: 'white', strokeWidth: 2 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'copyIcon':
          shape = new Group([
            new Rect({ width: 40, height: 50, fill: 'white', stroke: '#6b7280', strokeWidth: 2, left: 20, top: 30 }),
            new Rect({ width: 40, height: 50, fill: '#f3f4f6', stroke: '#6b7280', strokeWidth: 2, left: 30, top: 20 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'cutIcon':
          shape = new Group([
            new Circle({ radius: 15, fill: 'transparent', stroke: '#6b7280', strokeWidth: 3, left: 15, top: 15 }),
            new Circle({ radius: 15, fill: 'transparent', stroke: '#6b7280', strokeWidth: 3, left: 55, top: 55 }),
            new Line([30, 30, 55, 55], { stroke: '#6b7280', strokeWidth: 3 }),
            new Line([55, 30, 30, 55], { stroke: '#6b7280', strokeWidth: 3 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'pasteIcon':
          shape = new Group([
            new Rect({ width: 50, height: 60, fill: 'white', stroke: '#6b7280', strokeWidth: 2, left: 25, top: 20 }),
            new Rect({ width: 10, height: 15, fill: '#f3f4f6', stroke: '#6b7280', strokeWidth: 1, left: 45, top: 5 }),
            new Line([30, 35, 70, 35], { stroke: '#6b7280', strokeWidth: 1 }),
            new Line([30, 45, 70, 45], { stroke: '#6b7280', strokeWidth: 1 }),
            new Line([30, 55, 70, 55], { stroke: '#6b7280', strokeWidth: 1 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'lockIcon':
          shape = new Group([
            new Path('M30,40 L30,30 C30,25 35,20 40,20 C45,20 50,25 50,30 L50,40', {
              fill: 'transparent',
              stroke: '#6b7280',
              strokeWidth: 3
            }),
            new Rect({ width: 30, height: 30, fill: 'white', stroke: '#6b7280', strokeWidth: 3, left: 35, top: 40 }),
            new Circle({ radius: 3, fill: '#6b7280', left: 47, top: 52 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'unlockIcon':
          shape = new Group([
            new Path('M30,40 L30,30 C30,25 35,20 40,20 C45,20 50,25 50,30', {
              fill: 'transparent',
              stroke: '#6b7280',
              strokeWidth: 3
            }),
            new Rect({ width: 30, height: 30, fill: 'white', stroke: '#6b7280', strokeWidth: 3, left: 35, top: 40 }),
            new Circle({ radius: 3, fill: '#6b7280', left: 47, top: 52 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'eyeIcon':
          shape = new Group([
            new Ellipse({ rx: 25, ry: 15, fill: 'white', stroke: '#6b7280', strokeWidth: 3 }),
            new Circle({ radius: 8, fill: '#6b7280', left: 42, top: 42 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'eyeOffIcon':
          shape = new Group([
            new Ellipse({ rx: 25, ry: 15, fill: 'white', stroke: '#6b7280', strokeWidth: 3 }),
            new Circle({ radius: 8, fill: '#6b7280', left: 42, top: 42 }),
            new Line([20, 20, 80, 80], { stroke: '#ef4444', strokeWidth: 3 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'zoomInIcon':
          shape = new Group([
            new Circle({ radius: 15, fill: 'transparent', stroke: '#6b7280', strokeWidth: 3 }),
            new Line([10, 10, 20, 20], { stroke: '#6b7280', strokeWidth: 3 }),
            new Line([15, 15, 15, 25], { stroke: '#6b7280', strokeWidth: 2 }),
            new Line([10, 20, 20, 20], { stroke: '#6b7280', strokeWidth: 2 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'zoomOutIcon':
          shape = new Group([
            new Circle({ radius: 15, fill: 'transparent', stroke: '#6b7280', strokeWidth: 3 }),
            new Line([10, 10, 20, 20], { stroke: '#6b7280', strokeWidth: 3 }),
            new Line([10, 20, 20, 20], { stroke: '#6b7280', strokeWidth: 2 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'homeIcon':
          shape = new Path('M50,10 L20,30 L20,70 L30,70 L30,50 L70,50 L70,70 L80,70 L80,30 Z M40,60 L40,40 L60,40 L60,60 Z', {
            left: 100,
            top: 100,
            fill: '#6b7280',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'userIcon':
          shape = new Group([
            new Circle({ radius: 15, fill: '#6b7280', left: 35, top: 25 }),
            new Path('M20,70 Q20,55 30,55 L70,55 Q80,55 80,70 L80,80 L20,80 Z', {
              fill: '#6b7280'
            })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'usersIcon':
          shape = new Group([
            new Circle({ radius: 12, fill: '#6b7280', left: 25, top: 25 }),
            new Circle({ radius: 12, fill: '#6b7280', left: 55, top: 25 }),
            new Path('M15,70 Q15,60 25,60 L35,60 Q45,60 45,70 L45,80 L15,80 Z', {
              fill: '#6b7280'
            }),
            new Path('M45,70 Q45,60 55,60 L65,60 Q75,60 75,70 L75,80 L45,80 Z', {
              fill: '#6b7280'
            })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'gridIcon':
          shape = new Group([
            new Rect({ width: 20, height: 20, fill: 'transparent', stroke: '#6b7280', strokeWidth: 2, left: 20, top: 20 }),
            new Rect({ width: 20, height: 20, fill: 'transparent', stroke: '#6b7280', strokeWidth: 2, left: 50, top: 20 }),
            new Rect({ width: 20, height: 20, fill: 'transparent', stroke: '#6b7280', strokeWidth: 2, left: 20, top: 50 }),
            new Rect({ width: 20, height: 20, fill: 'transparent', stroke: '#6b7280', strokeWidth: 2, left: 50, top: 50 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'listIcon':
          shape = new Group([
            new Circle({ radius: 3, fill: '#6b7280', left: 20, top: 20 }),
            new Line([35, 23, 70, 23], { stroke: '#6b7280', strokeWidth: 2 }),
            new Circle({ radius: 3, fill: '#6b7280', left: 20, top: 35 }),
            new Line([35, 38, 70, 38], { stroke: '#6b7280', strokeWidth: 2 }),
            new Circle({ radius: 3, fill: '#6b7280', left: 20, top: 50 }),
            new Line([35, 53, 70, 53], { stroke: '#6b7280', strokeWidth: 2 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'menuIcon':
          shape = new Group([
            new Line([20, 25, 70, 25], { stroke: '#6b7280', strokeWidth: 2 }),
            new Line([20, 40, 70, 40], { stroke: '#6b7280', strokeWidth: 2 }),
            new Line([20, 55, 70, 55], { stroke: '#6b7280', strokeWidth: 2 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'moreIcon':
          shape = new Group([
            new Circle({ radius: 3, fill: '#6b7280', left: 35, top: 40 }),
            new Circle({ radius: 3, fill: '#6b7280', left: 50, top: 40 }),
            new Circle({ radius: 3, fill: '#6b7280', left: 65, top: 40 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'checkIcon':
          shape = new Path('M20,50 L35,65 L70,30', {
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: '#22c55e',
            strokeWidth: 4,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'closeIcon':
          shape = new Group([
            new Line([30, 30, 60, 60], { stroke: '#ef4444', strokeWidth: 4 }),
            new Line([60, 30, 30, 60], { stroke: '#ef4444', strokeWidth: 4 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'plusIcon':
          shape = new Group([
            new Line([40, 30, 40, 60], { stroke: '#22c55e', strokeWidth: 4 }),
            new Line([30, 50, 60, 50], { stroke: '#22c55e', strokeWidth: 4 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'minusIcon':
          shape = new Line([30, 50, 60, 50], {
            left: 100,
            top: 100,
            stroke: '#ef4444',
            strokeWidth: 4,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'questionIcon':
          shape = new Group([
            new Circle({ radius: 20, fill: 'transparent', stroke: '#6b7280', strokeWidth: 3 }),
            new Circle({ radius: 3, fill: '#6b7280', left: 47, top: 35 }),
            new Path('M40,50 Q40,45 45,45 Q50,45 50,50 Q50,55 45,55', {
              fill: 'transparent',
              stroke: '#6b7280',
              strokeWidth: 2
            })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'exclamationIcon':
          shape = new Group([
            new Line([50, 20, 50, 50], { stroke: '#f59e0b', strokeWidth: 4 }),
            new Circle({ radius: 3, fill: '#f59e0b', left: 47, top: 55 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'infoIcon':
          shape = new Group([
            new Circle({ radius: 20, fill: 'transparent', stroke: '#3b82f6', strokeWidth: 3 }),
            new Circle({ radius: 3, fill: '#3b82f6', left: 47, top: 35 }),
            new Line([50, 45, 50, 55], { stroke: '#3b82f6', strokeWidth: 2 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'warningIcon':
          shape = new Polygon([
            { x: 50, y: 10 }, { x: 80, y: 70 },
            { x: 20, y: 70 }
          ], {
            left: 100,
            top: 100,
            fill: '#f59e0b',
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'errorIcon':
          shape = new Group([
            new Circle({ radius: 25, fill: '#ef4444' }),
            new Line([35, 35, 65, 65], { stroke: 'white', strokeWidth: 4 }),
            new Line([65, 35, 35, 65], { stroke: 'white', strokeWidth: 4 })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'successIcon':
          shape = new Group([
            new Circle({ radius: 25, fill: '#22c55e' }),
            new Path('M35,50 L45,60 L65,40', {
              fill: 'transparent',
              stroke: 'white',
              strokeWidth: 4
            })
          ], {
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'loadingIcon':
          shape = new Circle({
            left: 100,
            top: 100,
            radius: 20,
            fill: 'transparent',
            stroke: '#3b82f6',
            strokeWidth: 3,
            strokeDashArray: [5, 5],
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'custom':
          // This will be handled by the custom shape creation tool
          return;
        default:
          return;
      }
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
      updateLayers();
      saveToHistory();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && canvas) {
      const reader = new FileReader();
      reader.onload = (event) => {
        FabricImage.fromURL(event.target.result, { crossOrigin: 'anonymous' }).then((img) => {
          img.scaleToWidth(300);
          img.set({ 
            left: 100, 
            top: 100,
            cornerStyle: 'circle',
            cornerSize: 12,
            transparentCorners: false,
            cornerColor: '#4f46e5',
            borderColor: '#4f46e5',
            borderScaleFactor: 2
          });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
          updateLayers();
          saveToHistory();

        });
      };
      reader.readAsDataURL(file);
    }
  };







  const backgroundColors = [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0',
    '#1e293b', '#0f172a', '#020617',
    '#fef3c7', '#fef08a', '#fde047', '#facc15',
    '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6',
    '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6',
    '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6',
    '#a7f3d0', '#6ee7b7', '#34d399', '#10b981',
    '#fed7aa', '#fdba74', '#fb923c', '#f97316',
  ];

  const getCurrentBackgroundColor = () => {
    if (!canvas) return backgroundColor;
    
    const objects = canvas.getObjects();
    const bgObject = objects.find(obj => 
      obj.type === 'rect' && 
      obj.left === 0 && 
      obj.top === 0 && 
      (obj.width >= canvas.width * 0.9 || obj.height >= canvas.height * 0.9)
    );
    
    if (bgObject && typeof bgObject.fill === 'string') {
      return bgObject.fill;
    }
    
    return canvas.backgroundColor || backgroundColor;
  };

  const handleBackgroundColor = (color) => {
    if (!canvas) return;
    
    // Cache background object for performance
    if (!backgroundObjRef.current) {
      const objects = canvas.getObjects();
      backgroundObjRef.current = objects.find(obj => 
        obj.type === 'rect' && 
        obj.left === 0 && 
        obj.top === 0 && 
        (obj.width >= canvas.width * 0.9 || obj.height >= canvas.height * 0.9)
      );
    }
    
    // Update color immediately
    if (backgroundObjRef.current) {
      backgroundObjRef.current.set('fill', color);
    } else {
      canvas.backgroundColor = color;
    }
      
    // Throttled render for smooth performance
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }
    
    requestAnimationFrame(() => {
      canvas.requestRenderAll();
    });
    
    setBackgroundColor(color);
    
    // Debounced save and toast
    renderTimeoutRef.current = setTimeout(() => {
      saveToHistory();

    }, 300);
  };

  const handleBackgroundImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && canvas) {
      const reader = new FileReader();
      reader.onload = (event) => {
        FabricImage.fromURL(event.target.result, { crossOrigin: 'anonymous' }).then((img) => {
          // Scale image to cover canvas
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          const imgWidth = img.width;
          const imgHeight = img.height;
          
          const scaleX = canvasWidth / imgWidth;
          const scaleY = canvasHeight / imgHeight;
          const scale = Math.max(scaleX, scaleY);
          
          img.set({
            left: 0,
            top: 0,
            scaleX: scale,
            scaleY: scale,
            selectable: false,
            evented: false
          });
          
          // Remove existing background image
          const objects = canvas.getObjects();
          const existingBg = objects.find(obj => obj.isBackgroundImage);
          if (existingBg) {
            canvas.remove(existingBg);
          }
          
          img.isBackgroundImage = true;
          canvas.insertAt(img, 0);
          canvas.renderAll();
          updateLayers();
          saveToHistory();

        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: isExpanded ? 400 : 320 }}
      transition={{ duration: 0.3 }}
      className="border-r border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg flex flex-col relative"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-20 w-6 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-10"
      >
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          →
        </motion.div>
      </button>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
        <TabsList className="grid grid-cols-6 gap-1 m-4 h-auto p-2 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl">
          <TabsTrigger value="templates" className="flex flex-col gap-1 py-2 px-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all min-w-0">
            <LayoutTemplate className="w-4 h-4" />
            <span className="text-xs truncate">Templates</span>
          </TabsTrigger>
         <span></span>
          <TabsTrigger value="background" className="flex flex-col gap-1 py-2 px-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all min-w-0">
            <Palette className="w-4 h-4" />
            <span className="text-xs truncate">Background</span>
          </TabsTrigger>
          <span></span>
          <TabsTrigger value="upload" className="flex flex-col gap-1 py-2 px-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all min-w-0">
            <Upload className="w-4 h-4" />
            <span className="text-xs truncate">Upload</span>
          </TabsTrigger>
          <span></span>
          <TabsTrigger value="text" className="flex flex-col gap-1 py-2 px-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all min-w-0">
            <Type className="w-4 h-4" />
            <span className="text-xs truncate">Text</span>
          </TabsTrigger>
          <span></span>
          <TabsTrigger value="shapes" className="flex flex-col gap-1 py-2 px-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all min-w-0">
            <Shapes className="w-4 h-4" />
            <span className="text-xs truncate">Shapes</span>
          </TabsTrigger>
          <span></span>
          <TabsTrigger value="elements" className="flex flex-col gap-1 py-2 px-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all min-w-0">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs truncate">Elements</span>
          </TabsTrigger>
          <span></span>
        </TabsList>

        <div className="flex-1 px-4 min-h-0">
            <TabsContent value="templates" className="mt-0 h-full overflow-y-auto">
              <div className="space-y-4 pb-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Choose a Template</h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                    {canvaTemplates.length} premium templates
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Categories</h4>
                    <div className="flex flex-wrap gap-1">
                      {['all', 'Social Media', 'Business', 'Instagram Ads', 'WhatsApp Ads', 'Facebook Ads', 'Ecommerce'].map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-2 py-1 text-xs rounded-full transition-colors ${
                            selectedCategory === category
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {category === 'all' ? 'All' : category}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Custom Size</h4>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Width"
                        className="text-xs h-8"
                        id="custom-width"
                        min="100"
                        max="5000"
                      />
                      <Input
                        type="number"
                        placeholder="Height"
                        className="text-xs h-8"
                        id="custom-height"
                        min="100"
                        max="5000"
                      />
                      <Button
                        onClick={() => {
                          const width = parseInt(document.getElementById('custom-width').value);
                          const height = parseInt(document.getElementById('custom-height').value);
                          if (canvas && width && height && width >= 100 && height >= 100) {
                            resizeCanvas(width, height);
                            toast.success(`Canvas resized to ${width}×${height}`);
                          } else {
                            toast.error('Please enter valid dimensions (100-5000px)');
                          }
                        }}
                        size="sm"
                        className="text-xs h-8 px-3"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search templates..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="pl-10 h-9 text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  {canvaTemplates
                    .filter(template => {
                      const matchesCategory = selectedCategory === 'all' || 
                        template.category === selectedCategory ||
                        (selectedCategory === 'Social Media' && template.category.startsWith('Social Media'));
                      const matchesSearch = !templateSearch || template.title.toLowerCase().includes(templateSearch.toLowerCase()) || template.category.toLowerCase().includes(templateSearch.toLowerCase());
                      return matchesCategory && matchesSearch;
                    })
                    .sort((a, b) => {
                      const categoryOrder = ['Business', 'Social Media', 'Instagram Ads', 'WhatsApp Ads', 'Facebook Ads', 'Ecommerce'];
                      const getMainCategory = (cat) => cat.startsWith('Social Media') ? 'Social Media' : cat;
                      const aIndex = categoryOrder.indexOf(getMainCategory(a.category));
                      const bIndex = categoryOrder.indexOf(getMainCategory(b.category));
                      if (aIndex !== bIndex) return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
                      return a.title.localeCompare(b.title);
                    })
                    .map((template, index) => (
                    <div
                      key={template.filename}
                      className="group cursor-pointer rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all duration-200 shadow-sm hover:shadow-lg bg-white dark:bg-slate-800"
                    >
                      <div className="relative overflow-hidden">
                        <div className="w-full h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="text-2xl font-bold mb-1">{template.title}</div>
                            <div className="text-sm opacity-80">{template.category}</div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-2 left-2 bg-indigo-500/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {template.category.includes('Instagram') ? '📱 Instagram' : 
                           template.category.includes('WhatsApp') ? '💬 WhatsApp' :
                           template.category.includes('Facebook') ? '📘 Facebook' :
                           template.category.includes('Social Media') ? '📱 Social' :
                           template.category.includes('Ecommerce') ? '🛒 E-commerce' :
                           template.category.includes('Business') ? '💼 Business' : '✨ Template'}
                        </div>
                        <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          1080×1080
                        </div>
                        <div className="absolute inset-x-2 bottom-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              loadCanvaTemplate(template);
                            }}
                            size="sm"
                            className="flex-1 bg-white/90 text-slate-900 hover:bg-white text-xs h-8 backdrop-blur-sm"
                          >
                            Use template
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              loadCanvaTemplate(template);
                            }}
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-indigo-500 text-white hover:bg-indigo-600 border-indigo-500 text-xs h-8 backdrop-blur-sm"
                          >
                            Customize
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-slate-50/80 to-white/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{template.title}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-slate-500 dark:text-slate-400">{template.category}</p>
                          <div className="w-2 h-2 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="background" className="mt-0 pb-6 h-full overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Background Color</h3>
                  <div className="space-y-4">
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={getCurrentBackgroundColor()}
                        onChange={(e) => handleBackgroundColor(e.target.value)}
                        className="w-16 h-12 p-1 cursor-pointer rounded-lg"
                      />
                      <Input
                        type="text"
                        value={getCurrentBackgroundColor()}
                        onChange={(e) => handleBackgroundColor(e.target.value)}
                        className="flex-1"
                        placeholder="#ffffff"
                      />
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {backgroundColors.map((color) => (
                        <motion.button
                          key={color}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleBackgroundColor(color)}
                          className="w-full aspect-square rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500 transition-all shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Background Image</h3>
                  <label htmlFor="background-image-upload" className="block">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-all bg-slate-50/50 dark:bg-slate-800/50"
                    >
                      <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload background image</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                    </motion.div>
                    <input
                      id="background-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBackgroundImageUpload}
                    />
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-0 pb-6 h-full overflow-y-auto">
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Upload Media</h3>
              <div className="space-y-3">
                <label htmlFor="image-upload" className="block">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-all bg-slate-50/50 dark:bg-slate-800/50"
                  >
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to upload image</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                  </motion.div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </TabsContent>

            <TabsContent value="text" className="mt-0 space-y-3 pb-6 h-full overflow-y-auto">
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Add Text</h3>
              <Button onClick={addHeading} variant="outline" className="w-full justify-start h-auto py-4 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                <div className="text-left">
                  <p className="font-bold text-lg">Add a heading</p>
                  <p className="text-xs text-slate-500">Large bold text</p>
                </div>
              </Button>
              <Button onClick={addSubheading} variant="outline" className="w-full justify-start h-auto py-4 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                <div className="text-left">
                  <p className="font-semibold text-base">Add a subheading</p>
                  <p className="text-xs text-slate-500">Medium weight text</p>
                </div>
              </Button>
              <Button onClick={addText} variant="outline" className="w-full justify-start h-auto py-4 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                <div className="text-left">
                  <p className="text-sm">Add body text</p>
                  <p className="text-xs text-slate-500">Regular paragraph text</p>
                </div>
              </Button>
              
              <div className="space-y-3 mt-6">
                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Text Effects</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => addTextWithEffect('glassmorphism')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold text-white" style={{background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)'}}>Glass</span>
                    <span className="text-xs text-slate-500">Glassmorphism</span>
                  </Button>
                  <Button onClick={() => addTextWithEffect('cyberpunk')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold text-cyan-400" style={{textShadow: '0 0 20px #00ffff, 0 0 40px #00ffff'}}>Cyber</span>
                    <span className="text-xs text-slate-500">Cyberpunk</span>
                  </Button>
                  <Button onClick={() => addTextWithEffect('holographic')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">Holo</span>
                    <span className="text-xs text-slate-500">Holographic</span>
                  </Button>
                  <Button onClick={() => addTextWithEffect('gradient')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Gradient</span>
                    <span className="text-xs text-slate-500">Color gradient</span>
                  </Button>
                  <Button onClick={() => addTextWithEffect('neon')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold text-pink-500" style={{textShadow: '0 0 15px #ff0080'}}>Neon</span>
                    <span className="text-xs text-slate-500">Neon glow</span>
                  </Button>
                  <Button onClick={() => addTextWithEffect('chrome')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold bg-gradient-to-b from-gray-100 via-gray-300 to-gray-500 bg-clip-text text-transparent">Chrome</span>
                    <span className="text-xs text-slate-500">Chrome finish</span>
                  </Button>
                  <Button onClick={() => addTextWithEffect('fire')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 bg-clip-text text-transparent">Fire</span>
                    <span className="text-xs text-slate-500">Fire effect</span>
                  </Button>
                  <Button onClick={() => addTextWithEffect('ice')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold bg-gradient-to-b from-blue-200 via-blue-400 to-blue-600 bg-clip-text text-transparent">Ice</span>
                    <span className="text-xs text-slate-500">Ice crystal</span>
                  </Button>
                  <Button onClick={() => addTextWithEffect('gold')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">Gold</span>
                    <span className="text-xs text-slate-500">Gold luxury</span>
                  </Button>
                  <Button onClick={() => addTextWithEffect('shadow')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>Shadow</span>
                    <span className="text-xs text-slate-500">Drop shadow</span>
                  </Button>
                  <Button onClick={() => addTextWithEffect('outline')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold" style={{WebkitTextStroke: '1px #333', color: 'transparent'}}>Outline</span>
                    <span className="text-xs text-slate-500">Text stroke</span>
                  </Button>
                  <Button onClick={() => addTextWithEffect('3d')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold" style={{textShadow: '4px 4px 0px rgba(0,0,0,0.8)'}}>3D</span>
                    <span className="text-xs text-slate-500">3D effect</span>
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3 mt-6">
                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Text Curves</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => addCurvedText('arc')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold">Arc</span>
                    <span className="text-xs text-slate-500">Curved upward</span>
                  </Button>
                  <Button onClick={() => addCurvedText('circle')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold">Circle</span>
                    <span className="text-xs text-slate-500">Circular path</span>
                  </Button>
                  <Button onClick={() => addCurvedText('wave')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold">Wave</span>
                    <span className="text-xs text-slate-500">Wavy text</span>
                  </Button>
                  <Button onClick={() => addCurvedText('spiral')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold">Spiral</span>
                    <span className="text-xs text-slate-500">Spiral curve</span>
                  </Button>
                  <Button onClick={() => addCurvedText('zigzag')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold">Zigzag</span>
                    <span className="text-xs text-slate-500">Jagged path</span>
                  </Button>
                  <Button onClick={() => addCurvedText('bounce')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold">Bounce</span>
                    <span className="text-xs text-slate-500">Bouncy effect</span>
                  </Button>
                  <Button onClick={() => addCurvedText('tilt')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold">Tilt</span>
                    <span className="text-xs text-slate-500">Angled text</span>
                  </Button>
                  <Button onClick={() => addCurvedText('perspective')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold">Perspective</span>
                    <span className="text-xs text-slate-500">3D depth</span>
                  </Button>
                  <Button onClick={() => addCurvedText('wobble')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold">Wobble</span>
                    <span className="text-xs text-slate-500">Shaky effect</span>
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3 mt-6">
                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Text Spacing</h4>
                <div className="space-y-2">
                  <Button onClick={() => addSpacedText('ultra-tight')} variant="outline" className="w-full h-12 justify-start">
                    <span className="text-sm" style={{letterSpacing: '-0.15em'}}>Ultra Tight</span>
                  </Button>
                  <Button onClick={() => addSpacedText('condensed')} variant="outline" className="w-full h-12 justify-start">
                    <span className="text-sm" style={{letterSpacing: '-0.1em'}}>Condensed</span>
                  </Button>
                  <Button onClick={() => addSpacedText('tight')} variant="outline" className="w-full h-12 justify-start">
                    <span className="text-sm" style={{letterSpacing: '-0.05em'}}>Tight Spacing</span>
                  </Button>
                  <Button onClick={() => addSpacedText('normal')} variant="outline" className="w-full h-12 justify-start">
                    <span className="text-sm">Normal Spacing</span>
                  </Button>
                  <Button onClick={() => addSpacedText('wide')} variant="outline" className="w-full h-12 justify-start">
                    <span className="text-sm" style={{letterSpacing: '0.1em'}}>Wide Spacing</span>
                  </Button>
                  <Button onClick={() => addSpacedText('extra-wide')} variant="outline" className="w-full h-12 justify-start">
                    <span className="text-sm" style={{letterSpacing: '0.2em'}}>Extra Wide</span>
                  </Button>
                  <Button onClick={() => addSpacedText('ultra-wide')} variant="outline" className="w-full h-12 justify-start">
                    <span className="text-sm" style={{letterSpacing: '0.3em'}}>Ultra Wide</span>
                  </Button>
                  <Button onClick={() => addSpacedText('mega-wide')} variant="outline" className="w-full h-12 justify-start">
                    <span className="text-sm" style={{letterSpacing: '0.4em'}}>Mega Wide</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shapes" className="mt-0 space-y-3 pb-6 h-full overflow-y-auto">
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Add Shapes</h3>
              
              {/* Custom Shape Tool */}
              <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-indigo-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300">Custom Shape Tool</h4>
                  <Paintbrush className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Draw your own custom shapes</p>
                <div className="flex gap-2">
                  <Button 
                    onClick={startCustomShape} 
                    disabled={isDrawingCustom}
                    size="sm" 
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white"
                  >
                    {isDrawingCustom ? 'Drawing...' : 'Start Drawing'}
                  </Button>
                  {isDrawingCustom && (
                    <Button 
                      onClick={finishCustomShape} 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                    >
                      Finish
                    </Button>
                  )}
                </div>
              </div>

              {/* Basic Shapes */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Basic Shapes
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => addShape('rectangle')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="w-8 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-md" />
                    <span className="text-xs">Rectangle</span>
                  </Button>
                  <Button onClick={() => addShape('circle')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full" />
                    <span className="text-xs">Circle</span>
                  </Button>
                  <Button onClick={() => addShape('triangle')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[20px] border-b-emerald-500" />
                    <span className="text-xs">Triangle</span>
                  </Button>
                  <Button onClick={() => addShape('ellipse')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="w-9 h-6 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full" />
                    <span className="text-xs">Ellipse</span>
                  </Button>
                  <Button onClick={() => addShape('star')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-yellow-50 hover:to-orange-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-yellow-500 text-xl">★</div>
                    <span className="text-xs">Star</span>
                  </Button>
                  <Button onClick={() => addShape('diamond')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-pink-500 text-xl">◆</div>
                    <span className="text-xs">Diamond</span>
                  </Button>
                  <Button onClick={() => addShape('hexagon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-purple-50 hover:to-violet-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-purple-500 text-xl">⬡</div>
                    <span className="text-xs">Hexagon</span>
                  </Button>
                  <Button onClick={() => addShape('pentagon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-orange-500 text-xl">⬟</div>
                    <span className="text-xs">Pentagon</span>
                  </Button>
                  <Button onClick={() => addShape('octagon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-lime-50 hover:to-green-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-lime-500 text-xl">⯃</div>
                    <span className="text-xs">Octagon</span>
                  </Button>
                </div>
              </div>

              {/* Arrows & Directions */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Arrows & Directions
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => addShape('arrow')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-red-500 text-xl">→</div>
                    <span className="text-xs">Arrow</span>
                  </Button>
                  <Button onClick={() => addShape('arrowUp')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-emerald-500 text-xl">↑</div>
                    <span className="text-xs">Arrow Up</span>
                  </Button>
                  <Button onClick={() => addShape('arrowDown')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-emerald-500 text-xl">↓</div>
                    <span className="text-xs">Arrow Down</span>
                  </Button>
                  <Button onClick={() => addShape('arrowLeft')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-emerald-500 text-xl">←</div>
                    <span className="text-xs">Arrow Left</span>
                  </Button>
                  <Button onClick={() => addShape('arrowRight')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-emerald-500 text-xl">→</div>
                    <span className="text-xs">Arrow Right</span>
                  </Button>
                  <Button onClick={() => addShape('doubleArrow')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-blue-500 text-xl">⇄</div>
                    <span className="text-xs">Double Arrow</span>
                  </Button>
                  <Button onClick={() => addShape('curvedArrow')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-purple-50 hover:to-violet-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-purple-500 text-xl">↻</div>
                    <span className="text-xs">Curved Arrow</span>
                  </Button>
                  <Button onClick={() => addShape('bentArrow')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-amber-50 hover:to-yellow-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-amber-500 text-xl">↗</div>
                    <span className="text-xs">Bent Arrow</span>
                  </Button>
                  <Button onClick={() => addShape('circularArrow')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-pink-500 text-xl">↻</div>
                    <span className="text-xs">Circular Arrow</span>
                  </Button>
                  <Button onClick={() => addShape('returnArrow')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-green-500 text-xl">↩</div>
                    <span className="text-xs">Return Arrow</span>
                  </Button>
                </div>
              </div>

              {/* Symbols & Icons */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Symbols & Icons
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => addShape('heart')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-rose-50 hover:to-red-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-rose-500 text-xl">♥</div>
                    <span className="text-xs">Heart</span>
                  </Button>
                  <Button onClick={() => addShape('cross')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-red-500 text-xl">✚</div>
                    <span className="text-xs">Cross</span>
                  </Button>
                  <Button onClick={() => addShape('plus')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-emerald-500 text-xl">+</div>
                    <span className="text-xs">Plus</span>
                  </Button>
                  <Button onClick={() => addShape('minus')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">−</div>
                    <span className="text-xs">Minus</span>
                  </Button>
                  <Button onClick={() => addShape('checkIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-green-500 text-xl">✓</div>
                    <span className="text-xs">Check</span>
                  </Button>
                  <Button onClick={() => addShape('closeIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-red-500 text-xl">✕</div>
                    <span className="text-xs">Close</span>
                  </Button>
                  <Button onClick={() => addShape('plusIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-green-500 text-xl">+</div>
                    <span className="text-xs">Plus Icon</span>
                  </Button>
                  <Button onClick={() => addShape('minusIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-red-500 text-xl">−</div>
                    <span className="text-xs">Minus Icon</span>
                  </Button>
                  <Button onClick={() => addShape('questionIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">?</div>
                    <span className="text-xs">Question</span>
                  </Button>
                  <Button onClick={() => addShape('exclamationIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-amber-50 hover:to-yellow-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-amber-500 text-xl">!</div>
                    <span className="text-xs">Exclamation</span>
                  </Button>
                  <Button onClick={() => addShape('infoIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-blue-500 text-xl">i</div>
                    <span className="text-xs">Info</span>
                  </Button>
                  <Button onClick={() => addShape('warningIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-amber-50 hover:to-yellow-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-amber-500 text-xl">⚠</div>
                    <span className="text-xs">Warning</span>
                  </Button>
                  <Button onClick={() => addShape('errorIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-red-500 text-xl">✕</div>
                    <span className="text-xs">Error</span>
                  </Button>
                  <Button onClick={() => addShape('successIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-green-500 text-xl">✓</div>
                    <span className="text-xs">Success</span>
                  </Button>
                  <Button onClick={() => addShape('loadingIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-blue-500 text-xl">⟳</div>
                    <span className="text-xs">Loading</span>
                  </Button>
                </div>
              </div>

              {/* Nature & Weather */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  Nature & Weather
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => addShape('cloud')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-sky-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-sky-500 text-xl">☁</div>
                    <span className="text-xs">Cloud</span>
                  </Button>
                  <Button onClick={() => addShape('lightning')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-yellow-50 hover:to-amber-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-yellow-500 text-xl">⚡</div>
                    <span className="text-xs">Lightning</span>
                  </Button>
                  <Button onClick={() => addShape('moon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-yellow-50 hover:to-orange-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-yellow-400 text-xl">🌙</div>
                    <span className="text-xs">Moon</span>
                  </Button>
                  <Button onClick={() => addShape('sun')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-amber-50 hover:to-yellow-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-amber-500 text-xl">☀</div>
                    <span className="text-xs">Sun</span>
                  </Button>
                  <Button onClick={() => addShape('flower')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-pink-500 text-xl">🌸</div>
                    <span className="text-xs">Flower</span>
                  </Button>
                  <Button onClick={() => addShape('leaf')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-green-500 text-xl">🍃</div>
                    <span className="text-xs">Leaf</span>
                  </Button>
                  <Button onClick={() => addShape('butterfly')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-violet-50 hover:to-purple-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-violet-500 text-xl">🦋</div>
                    <span className="text-xs">Butterfly</span>
                  </Button>
                  <Button onClick={() => addShape('wave')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-cyan-500 text-xl">🌊</div>
                    <span className="text-xs">Wave</span>
                  </Button>
                </div>
              </div>

              {/* UI Elements */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  UI Elements
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => addShape('playButton')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-green-500 text-xl">▶</div>
                    <span className="text-xs">Play</span>
                  </Button>
                  <Button onClick={() => addShape('pauseButton')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-green-500 text-xl">⏸</div>
                    <span className="text-xs">Pause</span>
                  </Button>
                  <Button onClick={() => addShape('stopButton')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-red-500 text-xl">⏹</div>
                    <span className="text-xs">Stop</span>
                  </Button>
                  <Button onClick={() => addShape('recordButton')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-red-500 text-xl">●</div>
                    <span className="text-xs">Record</span>
                  </Button>
                  <Button onClick={() => addShape('volumeIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">🔊</div>
                    <span className="text-xs">Volume</span>
                  </Button>
                  <Button onClick={() => addShape('muteIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-red-500 text-xl">🔇</div>
                    <span className="text-xs">Mute</span>
                  </Button>
                  <Button onClick={() => addShape('wifiIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">📶</div>
                    <span className="text-xs">WiFi</span>
                  </Button>
                  <Button onClick={() => addShape('bluetoothIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-blue-500 text-xl">📱</div>
                    <span className="text-xs">Bluetooth</span>
                  </Button>
                  <Button onClick={() => addShape('locationIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-red-500 text-xl">📍</div>
                    <span className="text-xs">Location</span>
                  </Button>
                  <Button onClick={() => addShape('phoneIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-green-500 text-xl">📞</div>
                    <span className="text-xs">Phone</span>
                  </Button>
                  <Button onClick={() => addShape('mailIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">✉</div>
                    <span className="text-xs">Mail</span>
                  </Button>
                  <Button onClick={() => addShape('calendarIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-blue-500 text-xl">📅</div>
                    <span className="text-xs">Calendar</span>
                  </Button>
                  <Button onClick={() => addShape('clockIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">🕐</div>
                    <span className="text-xs">Clock</span>
                  </Button>
                  <Button onClick={() => addShape('settingsIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">⚙</div>
                    <span className="text-xs">Settings</span>
                  </Button>
                  <Button onClick={() => addShape('searchIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">🔍</div>
                    <span className="text-xs">Search</span>
                  </Button>
                  <Button onClick={() => addShape('homeIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">🏠</div>
                    <span className="text-xs">Home</span>
                  </Button>
                  <Button onClick={() => addShape('userIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">👤</div>
                    <span className="text-xs">User</span>
                  </Button>
                  <Button onClick={() => addShape('usersIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">👥</div>
                    <span className="text-xs">Users</span>
                  </Button>
                  <Button onClick={() => addShape('gridIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">⊞</div>
                    <span className="text-xs">Grid</span>
                  </Button>
                  <Button onClick={() => addShape('listIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">☰</div>
                    <span className="text-xs">List</span>
                  </Button>
                  <Button onClick={() => addShape('menuIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">☰</div>
                    <span className="text-xs">Menu</span>
                  </Button>
                  <Button onClick={() => addShape('moreIcon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">⋯</div>
                    <span className="text-xs">More</span>
                  </Button>
                </div>
              </div>

              {/* Decorative Shapes */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  Decorative Shapes
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => addShape('speech')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-indigo-500 text-xl">💬</div>
                    <span className="text-xs">Speech</span>
                  </Button>
                  <Button onClick={() => addShape('badge')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-red-500 text-xl">🏆</div>
                    <span className="text-xs">Badge</span>
                  </Button>
                  <Button onClick={() => addShape('ribbon')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-purple-50 hover:to-violet-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-purple-500 text-xl">🎀</div>
                    <span className="text-xs">Ribbon</span>
                  </Button>
                  <Button onClick={() => addShape('banner')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-emerald-500 text-xl">🏷️</div>
                    <span className="text-xs">Banner</span>
                  </Button>
                  <Button onClick={() => addShape('frame')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-600 text-xl">🖼️</div>
                    <span className="text-xs">Frame</span>
                  </Button>
                  <Button onClick={() => addShape('burst')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-amber-50 hover:to-yellow-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-amber-500 text-xl">💥</div>
                    <span className="text-xs">Burst</span>
                  </Button>
                  <Button onClick={() => addShape('shield')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-blue-600 text-xl">🛡️</div>
                    <span className="text-xs">Shield</span>
                  </Button>
                  <Button onClick={() => addShape('crown')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-yellow-50 hover:to-amber-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-yellow-500 text-xl">👑</div>
                    <span className="text-xs">Crown</span>
                  </Button>
                  <Button onClick={() => addShape('gear')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">⚙️</div>
                    <span className="text-xs">Gear</span>
                  </Button>
                  <Button onClick={() => addShape('infinity')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-purple-500 text-xl">∞</div>
                    <span className="text-xs">Infinity</span>
                  </Button>
                  <Button onClick={() => addShape('spiral')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-amber-50 hover:to-yellow-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-amber-500 text-xl">🌀</div>
                    <span className="text-xs">Spiral</span>
                  </Button>
                  <Button onClick={() => addShape('sparkle')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-yellow-50 hover:to-amber-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-yellow-500 text-xl">✨</div>
                    <span className="text-xs">Sparkle</span>
                  </Button>
                  <Button onClick={() => addShape('crescent')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-yellow-50 hover:to-orange-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-yellow-400 text-xl">🌙</div>
                    <span className="text-xs">Crescent</span>
                  </Button>
                  <Button onClick={() => addShape('teardrop')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-cyan-500 text-xl">💧</div>
                    <span className="text-xs">Teardrop</span>
                  </Button>
                  <Button onClick={() => addShape('lens')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-purple-50 hover:to-violet-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-purple-500 text-xl">🔍</div>
                    <span className="text-xs">Lens</span>
                  </Button>
                  <Button onClick={() => addShape('bracket')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-gray-500 text-xl">【</div>
                    <span className="text-xs">Bracket</span>
                  </Button>
                  <Button onClick={() => addShape('chevron')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-blue-500 text-xl">⌄</div>
                    <span className="text-xs">Chevron</span>
                  </Button>
                  <Button onClick={() => addShape('zigzag')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-red-500 text-xl">⚡</div>
                    <span className="text-xs">Zigzag</span>
                  </Button>
                  <Button onClick={() => addShape('squiggle')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-green-500 text-xl">〰</div>
                    <span className="text-xs">Squiggle</span>
                  </Button>
                  <Button onClick={() => addShape('callout')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-yellow-50 hover:to-amber-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                    <div className="text-yellow-500 text-xl">💬</div>
                    <span className="text-xs">Callout</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="elements" className="mt-0 pb-6 h-full overflow-y-auto">
              <ElementsPanel />
            </TabsContent>


        </div>
      </Tabs>
    </motion.div>
  );
};

export default LeftSidebar;