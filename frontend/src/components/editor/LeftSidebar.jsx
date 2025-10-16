import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { LayoutTemplate, Upload, Type, Shapes, Image as ImageIcon, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEditor } from '../../contexts/EditorContext';
import { Textbox, Rect, Circle, Triangle, Line, FabricImage } from 'fabric';
import { templates } from '../../data/templates';
import { toast } from '../ui/sonner';

const LeftSidebar = () => {
  const { canvas, saveToHistory, setCanvasSize } = useEditor();
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

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-5 m-4 h-auto p-1 bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="templates" className="flex flex-col gap-1 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <LayoutTemplate className="w-5 h-5" />
            <span className="text-xs">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex flex-col gap-1 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <Upload className="w-5 h-5" />
            <span className="text-xs">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="text" className="flex flex-col gap-1 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <Type className="w-5 h-5" />
            <span className="text-xs">Text</span>
          </TabsTrigger>
          <TabsTrigger value="shapes" className="flex flex-col gap-1 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <Shapes className="w-5 h-5" />
            <span className="text-xs">Shapes</span>
          </TabsTrigger>
          <TabsTrigger value="elements" className="flex flex-col gap-1 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => loadTemplate(template)}
                className="cursor-pointer rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
              >
                <img src={template.thumbnail} alt={template.name} className="w-full h-40 object-cover" />
                <div className="p-3 bg-slate-50 dark:bg-slate-800">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{template.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{template.category}</p>
                </div>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Upload Media</h3>
            <div className="space-y-3">
              <label htmlFor="image-upload" className="block">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to upload image</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                </div>
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
            <Button onClick={addHeading} variant="outline" className="w-full justify-start h-auto py-4">
              <div className="text-left">
                <p className="font-bold text-lg">Add a heading</p>
                <p className="text-xs text-slate-500">Large bold text</p>
              </div>
            </Button>
            <Button onClick={addSubheading} variant="outline" className="w-full justify-start h-auto py-4">
              <div className="text-left">
                <p className="font-semibold text-base">Add a subheading</p>
                <p className="text-xs text-slate-500">Medium weight text</p>
              </div>
            </Button>
            <Button onClick={addText} variant="outline" className="w-full justify-start h-auto py-4">
              <div className="text-left">
                <p className="text-sm">Add body text</p>
                <p className="text-xs text-slate-500">Regular paragraph text</p>
              </div>
            </Button>
          </TabsContent>

          <TabsContent value="shapes" className="mt-0 space-y-3">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Add Shapes</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => addShape('rectangle')} variant="outline" className="h-24 flex-col gap-2">
                <div className="w-12 h-8 bg-indigo-500 rounded" />
                <span className="text-xs">Rectangle</span>
              </Button>
              <Button onClick={() => addShape('circle')} variant="outline" className="h-24 flex-col gap-2">
                <div className="w-10 h-10 bg-cyan-500 rounded-full" />
                <span className="text-xs">Circle</span>
              </Button>
              <Button onClick={() => addShape('triangle')} variant="outline" className="h-24 flex-col gap-2">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[35px] border-b-emerald-500" />
                <span className="text-xs">Triangle</span>
              </Button>
              <Button onClick={() => addShape('line')} variant="outline" className="h-24 flex-col gap-2">
                <div className="w-12 h-0.5 bg-slate-700" />
                <span className="text-xs">Line</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="elements" className="mt-0">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Elements</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Coming soon: Icons, stickers, and more!</p>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </motion.div>
  );
};

export default LeftSidebar;
