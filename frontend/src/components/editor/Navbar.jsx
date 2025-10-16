import React from 'react';
import { Button } from '../ui/button';
import { useEditor } from '../../contexts/EditorContext';
import { Undo, Redo, Download, Save, Plus, ZoomIn, ZoomOut, Moon, Sun, Grid3x3, ArrowUp, ArrowDown, Copy, Trash2, Keyboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Toaster } from '../ui/sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';

const Navbar = () => {
  const { canvas, undo, redo, zoom, setZoom, isDarkMode, setIsDarkMode, saveToHistory, showGrid, setShowGrid, activeObject, bringForward, sendBackward, copyObject, deleteObject } = useEditor();

  const handleExport = () => {
    if (canvas) {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      });
      const link = document.createElement('a');
      link.download = `design-${Date.now()}.png`;
      link.href = dataURL;
      link.click();
      toast.success('Design exported successfully!');
    }
  };

  const handleSave = () => {
    if (canvas) {
      const json = JSON.stringify(canvas.toJSON());
      localStorage.setItem('canva-design', json);
      toast.success('Design saved to local storage!');
    }
  };

  const handleNew = () => {
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      saveToHistory();
      toast.success('New canvas created!');
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 25));
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
    toast.success(showGrid ? 'Grid hidden' : 'Grid visible');
  };

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
            Vansh Editor
          </motion.h1>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleNew} variant="outline" size="sm" className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <Plus className="w-4 h-4" />
            New
          </Button>
          <Button onClick={handleSave} variant="outline" size="sm" className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <Save className="w-4 h-4" />
            Save
          </Button>
          <Button onClick={handleExport} variant="default" size="sm" className="gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all">
            <Download className="w-4 h-4" />
            Export
          </Button>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2" />

          <Button onClick={undo} variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <Undo className="w-4 h-4" />
          </Button>
          <Button onClick={redo} variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <Redo className="w-4 h-4" />
          </Button>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2" />

          {activeObject && (
            <>
              <Button onClick={copyObject} variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Copy (Ctrl+C)">
                <Copy className="w-4 h-4" />
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

          <Button onClick={handleZoomOut} variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300 min-w-[60px] text-center">
            {zoom}%
          </span>
          <Button onClick={handleZoomIn} variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <ZoomIn className="w-4 h-4" />
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
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
