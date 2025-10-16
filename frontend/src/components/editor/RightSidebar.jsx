import React, { useEffect, useState } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Settings, Layers, AlignLeft, AlignCenter, AlignRight, Trash2, Copy, Lock, Unlock, Eye, EyeOff, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '../ui/sonner';
import { filters } from 'fabric';

const RightSidebar = () => {
  const { canvas, activeObject, layers, saveToHistory, updateLayers } = useEditor();
  const [properties, setProperties] = useState({
    fill: '#000000',
    stroke: '#000000',
    strokeWidth: 0,
    opacity: 100,
    fontSize: 32,
    fontFamily: 'Inter',
    fontWeight: 'normal',
    textAlign: 'left',
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0
  });

  useEffect(() => {
    if (activeObject) {
      setProperties({
        fill: activeObject.fill || '#000000',
        stroke: activeObject.stroke || '#000000',
        strokeWidth: activeObject.strokeWidth || 0,
        opacity: (activeObject.opacity || 1) * 100,
        fontSize: activeObject.fontSize || 32,
        fontFamily: activeObject.fontFamily || 'Inter',
        fontWeight: activeObject.fontWeight || 'normal',
        textAlign: activeObject.textAlign || 'left',
        brightness: activeObject.brightness || 0,
        contrast: activeObject.contrast || 0,
        saturation: activeObject.saturation || 0,
        blur: activeObject.blur || 0
      });
    }
  }, [activeObject]);

  const updateProperty = (key, value) => {
    if (activeObject && canvas) {
      if (key === 'opacity') {
        activeObject.set(key, value / 100);
      } else {
        activeObject.set(key, value);
      }
      canvas.renderAll();
      setProperties(prev => ({ ...prev, [key]: value }));
      saveToHistory();
    }
  };

  const deleteObject = () => {
    if (activeObject && canvas) {
      canvas.remove(activeObject);
      canvas.renderAll();
      saveToHistory();
      toast.success('Object deleted');
    }
  };

  const duplicateObject = () => {
    if (activeObject && canvas) {
      activeObject.clone((cloned) => {
        cloned.set({
          left: cloned.left + 20,
          top: cloned.top + 20,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        saveToHistory();
        toast.success('Object duplicated');
      });
    }
  };

  const setAlignment = (align) => {
    updateProperty('textAlign', align);
  };

  const selectLayer = (index) => {
    if (canvas) {
      const objects = canvas.getObjects();
      const obj = objects[objects.length - 1 - index];
      canvas.setActiveObject(obj);
      canvas.renderAll();
    }
  };

  const toggleLayerVisibility = (index) => {
    if (canvas) {
      const objects = canvas.getObjects();
      const obj = objects[objects.length - 1 - index];
      obj.set('visible', !obj.visible);
      canvas.renderAll();
      updateLayers();
    }
  };

  const toggleLayerLock = (index) => {
    if (canvas) {
      const objects = canvas.getObjects();
      const obj = objects[objects.length - 1 - index];
      obj.set('selectable', !obj.selectable);
      obj.set('evented', !obj.evented);
      canvas.renderAll();
      updateLayers();
    }
  };

  const moveLayer = (index, direction) => {
    if (canvas) {
      const objects = canvas.getObjects();
      const actualIndex = objects.length - 1 - index;
      const obj = objects[actualIndex];
      
      if (direction === 'up' && actualIndex < objects.length - 1) {
        canvas.moveTo(obj, actualIndex + 1);
      } else if (direction === 'down' && actualIndex > 0) {
        canvas.moveTo(obj, actualIndex - 1);
      }
      canvas.renderAll();
      updateLayers();
      saveToHistory();
    }
  };

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col"
    >
      <Tabs defaultValue="properties" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 m-4 h-auto p-1 bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="properties" className="flex gap-2 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <Settings className="w-4 h-4" />
            <span className="text-sm">Properties</span>
          </TabsTrigger>
          <TabsTrigger value="layers" className="flex gap-2 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <Layers className="w-4 h-4" />
            <span className="text-sm">Layers</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 px-4">
          <TabsContent value="properties" className="mt-0 space-y-6">
            {activeObject ? (
              <>
                <div className="flex gap-2">
                  <Button onClick={duplicateObject} variant="outline" size="sm" className="flex-1 gap-2">
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </Button>
                  <Button onClick={deleteObject} variant="outline" size="sm" className="flex-1 gap-2 text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>

                {activeObject.type === 'textbox' && (
                  <>
                    <div className="space-y-2">
                      <Label>Font Family</Label>
                      <Select value={properties.fontFamily} onValueChange={(val) => updateProperty('fontFamily', val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Font Size</Label>
                      <div className="flex gap-2">
                        <Slider
                          value={[properties.fontSize]}
                          onValueChange={(val) => updateProperty('fontSize', val[0])}
                          min={8}
                          max={200}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={properties.fontSize}
                          onChange={(e) => updateProperty('fontSize', parseInt(e.target.value))}
                          className="w-16"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Font Weight</Label>
                      <Select value={properties.fontWeight} onValueChange={(val) => updateProperty('fontWeight', val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="600">Semi Bold</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Text Alignment</Label>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setAlignment('left')}
                          variant={properties.textAlign === 'left' ? 'default' : 'outline'}
                          size="icon"
                          className="flex-1"
                        >
                          <AlignLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setAlignment('center')}
                          variant={properties.textAlign === 'center' ? 'default' : 'outline'}
                          size="icon"
                          className="flex-1"
                        >
                          <AlignCenter className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setAlignment('right')}
                          variant={properties.textAlign === 'right' ? 'default' : 'outline'}
                          size="icon"
                          className="flex-1"
                        >
                          <AlignRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Fill Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={typeof properties.fill === 'string' ? properties.fill : '#000000'}
                      onChange={(e) => updateProperty('fill', e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={typeof properties.fill === 'string' ? properties.fill : '#000000'}
                      onChange={(e) => updateProperty('fill', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                {activeObject.type !== 'textbox' && (
                  <div className="space-y-2">
                    <Label>Stroke Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={properties.stroke}
                        onChange={(e) => updateProperty('stroke', e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={properties.stroke}
                        onChange={(e) => updateProperty('stroke', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}

                {activeObject.type !== 'textbox' && (
                  <div className="space-y-2">
                    <Label>Stroke Width</Label>
                    <div className="flex gap-2">
                      <Slider
                        value={[properties.strokeWidth]}
                        onValueChange={(val) => updateProperty('strokeWidth', val[0])}
                        min={0}
                        max={20}
                        step={1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={properties.strokeWidth}
                        onChange={(e) => updateProperty('strokeWidth', parseInt(e.target.value))}
                        className="w-16"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Opacity</Label>
                  <div className="flex gap-2">
                    <Slider
                      value={[properties.opacity]}
                      onValueChange={(val) => updateProperty('opacity', val[0])}
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={Math.round(properties.opacity)}
                      onChange={(e) => updateProperty('opacity', parseInt(e.target.value))}
                      className="w-16"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select an object to edit properties</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="layers" className="mt-0 space-y-2">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Layers</h3>
            {layers.length > 0 ? (
              layers.map((layer, index) => (
                <motion.div
                  key={layer.id}
                  whileHover={{ x: 4 }}
                  onClick={() => selectLayer(index)}
                  className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{layer.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{layer.type}</p>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(index);
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerLock(index);
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </Button>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No layers yet</p>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </motion.div>
  );
};

export default RightSidebar;
