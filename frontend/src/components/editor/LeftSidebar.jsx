import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { LayoutTemplate, Upload, Type, Shapes, Image as ImageIcon, Sparkles, Palette, Search, Wand2, Zap, Crown, Layers3, Paintbrush } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEditor } from '../../contexts/EditorContext';
import { Textbox, Rect, Circle, Triangle, Line, FabricImage, FabricText, Polygon, Ellipse, Path, Gradient } from 'fabric';

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
      canvas.renderAll();
      canvas.requestRenderAll();
      // Force canvas to fit viewport
      canvas.calcOffset();
      // Use setTimeout to ensure layers update after canvas is fully rendered
      setTimeout(() => {
        updateLayers();
        saveToHistory();
        canvas.renderAll();
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
                      {['all', 'Business', 'Freelancer', 'Social Media', 'Instagram Post', 'Instagram Story', 'Facebook', 'Startup', 'Corporate', 'Event', 'Marketing', 'Ads', 'Campaigns', 'E-commerce', 'Real Estate', 'Food & Beverage', 'Fashion', 'Health & Fitness', 'Education', 'Travel', 'Technology'].map((category) => (
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
                      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
                      const matchesSearch = !templateSearch || template.title.toLowerCase().includes(templateSearch.toLowerCase()) || template.category.toLowerCase().includes(templateSearch.toLowerCase());
                      return matchesCategory && matchesSearch;
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
                        <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          1080 × 1080
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
                              toast.success('Template loaded! Click on any element to customize it.');
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
                        value={backgroundColor}
                        onChange={(e) => handleBackgroundColor(e.target.value)}
                        className="w-16 h-12 p-1 cursor-pointer rounded-lg"
                      />
                      <Input
                        type="text"
                        value={backgroundColor}
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
                  <Button onClick={() => addTextWithEffect('shadow')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>Shadow</span>
                    <span className="text-xs text-slate-500">Drop shadow</span>
                  </Button>
                  <Button onClick={() => addTextWithEffect('outline')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold" style={{WebkitTextStroke: '1px #333', color: 'transparent'}}>Outline</span>
                    <span className="text-xs text-slate-500">Text stroke</span>
                  </Button>
                  <Button onClick={() => addTextWithEffect('gradient')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Gradient</span>
                    <span className="text-xs text-slate-500">Color gradient</span>
                  </Button>
                  <Button onClick={() => addTextWithEffect('glow')} variant="outline" className="h-16 flex-col gap-1">
                    <span className="text-sm font-bold" style={{textShadow: '0 0 10px #4f46e5'}}>Glow</span>
                    <span className="text-xs text-slate-500">Neon glow</span>
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
                </div>
              </div>
              
              <div className="space-y-3 mt-6">
                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Text Spacing</h4>
                <div className="space-y-2">
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
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shapes" className="mt-0 space-y-3 pb-6 h-full overflow-y-auto">
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Add Shapes</h3>
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
                <Button onClick={() => addShape('arrow')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                  <div className="text-red-500 text-xl">→</div>
                  <span className="text-xs">Arrow</span>
                </Button>
                <Button onClick={() => addShape('heart')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-rose-50 hover:to-red-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                  <div className="text-rose-500 text-xl">♥</div>
                  <span className="text-xs">Heart</span>
                </Button>
                <Button onClick={() => addShape('line')} variant="outline" className="h-20 flex-col gap-1 hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                  <div className="w-8 h-0.5 bg-slate-700 dark:bg-slate-300" />
                  <span className="text-xs">Line</span>
                </Button>
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