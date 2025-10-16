import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { LayoutTemplate, Upload, Type, Shapes, Image as ImageIcon, Sparkles, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEditor } from '../../contexts/EditorContext';
import { Textbox, Rect, Circle, Triangle, Line, FabricImage, FabricText } from 'fabric';
import { templates } from '../../data/templates';
import { toast } from 'sonner';

const LeftSidebar = () => {
  const { canvas, saveToHistory, setCanvasSize, backgroundColor, setBackgroundColor } = useEditor();
  const [activeTab, setActiveTab] = useState('templates');

  const loadTemplate = (template) => {
    if (canvas) {
      canvas.clear();
      setCanvasSize(template.size);
      canvas.setWidth(template.size.width);
      canvas.setHeight(template.size.height);
      
      canvas.loadFromJSON(template.data, () => {
        canvas.renderAll();
        saveToHistory();
        toast.success('Template loaded!');
      });
    }
  };

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
      saveToHistory();
    }
  };

  const addHeading = () => {
    if (canvas) {
      const text = new Textbox('Heading Text', {
        left: 100,
        top: 100,
        width: 500,
        fontSize: 64,
        fontFamily: 'Poppins',
        fontWeight: 'bold',
        fill: '#1e293b',
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      saveToHistory();
    }
  };

  const addSubheading = () => {
    if (canvas) {
      const text = new Textbox('Subheading Text', {
        left: 100,
        top: 100,
        width: 400,
        fontSize: 36,
        fontFamily: 'Inter',
        fontWeight: '600',
        fill: '#475569',
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
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
        default:
          return;
      }
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
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
          img.set({ left: 100, top: 100 });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
          saveToHistory();
          toast.success('Image uploaded!');
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addIcon = (emoji) => {
    if (canvas) {
      const text = new FabricText(emoji, {
        left: 100,
        top: 100,
        fontSize: 80,
        fontFamily: 'Arial',
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      saveToHistory();
    }
  };

  const icons = [
    '❤️', '⭐', '🎉', '🎨', '🔥', '✨', '💡', '🎯',
    '🎪', '🎭', '🎬', '📸', '🎵', '🎸', '🎤', '🎧',
    '☀️', '🌙', '⚡', '🌈', '🌸', '🌺', '🌻', '🌹',
    '👍', '👏', '🙌', '💪', '🤝', '✌️', '👊', '🤞',
  ];

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
    setBackgroundColor(color);
    toast.success('Background color changed!');
    saveToHistory();
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg flex flex-col"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-6 m-4 h-auto p-1 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl">
          <TabsTrigger value="templates" className="flex flex-col gap-1 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all">
            <LayoutTemplate className="w-5 h-5" />
            <span className="text-xs">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="background" className="flex flex-col gap-1 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all">
            <Palette className="w-5 h-5" />
            <span className="text-xs">Background</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex flex-col gap-1 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all">
            <Upload className="w-5 h-5" />
            <span className="text-xs">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="text" className="flex flex-col gap-1 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all">
            <Type className="w-5 h-5" />
            <span className="text-xs">Text</span>
          </TabsTrigger>
          <TabsTrigger value="shapes" className="flex flex-col gap-1 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all">
            <Shapes className="w-5 h-5" />
            <span className="text-xs">Shapes</span>
          </TabsTrigger>
          <TabsTrigger value="elements" className="flex flex-col gap-1 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs">Elements</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 px-4">
          <TabsContent value="templates" className="mt-0 space-y-3">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Choose a Template</h3>
            {templates.map((template) => (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => loadTemplate(template)}
                className="cursor-pointer rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all shadow-sm hover:shadow-lg"
              >
                <img src={template.thumbnail} alt={template.name} className="w-full h-40 object-cover" />
                <div className="p-3 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{template.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{template.category}</p>
                </div>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="background" className="mt-0">
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
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
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

          <TabsContent value="text" className="mt-0 space-y-3">
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
          </TabsContent>

          <TabsContent value="shapes" className="mt-0 space-y-3">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Add Shapes</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => addShape('rectangle')} variant="outline" className="h-24 flex-col gap-2 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                <div className="w-12 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg" />
                <span className="text-xs">Rectangle</span>
              </Button>
              <Button onClick={() => addShape('circle')} variant="outline" className="h-24 flex-col gap-2 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full" />
                <span className="text-xs">Circle</span>
              </Button>
              <Button onClick={() => addShape('triangle')} variant="outline" className="h-24 flex-col gap-2 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[35px] border-b-emerald-500" />
                <span className="text-xs">Triangle</span>
              </Button>
              <Button onClick={() => addShape('line')} variant="outline" className="h-24 flex-col gap-2 hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all rounded-xl">
                <div className="w-12 h-0.5 bg-slate-700 dark:bg-slate-300" />
                <span className="text-xs">Line</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="elements" className="mt-0">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Stickers & Icons</h3>
            <div className="grid grid-cols-4 gap-2">
              {icons.map((icon, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addIcon(icon)}
                  className="aspect-square flex items-center justify-center text-3xl bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-gradient-to-br hover:from-indigo-100 hover:to-purple-100 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all"
                >
                  {icon}
                </motion.button>
              ))}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </motion.div>
  );
};

export default LeftSidebar;
