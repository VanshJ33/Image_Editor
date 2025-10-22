import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useEditor } from '../../contexts/EditorContext';
import { FabricImage } from 'fabric';
import { toast } from 'sonner';

const ElementsPanel = () => {
  const { canvas, saveToHistory, updateLayers } = useEditor();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [elements, setElements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Use your API key here
  const apiKey = 'X4eTCMg7rLGxEVw0r3lIaBrxuVfhGrGGZblYCdqQWZP9zx4xTsIWSwQTU67tnhqa';
  const proxyUrl = 'https://api.allorigins.win/raw?url='; // ✅ Reliable CORS proxy

  const categories = [
    { id: 'all', name: 'All', icon: '✨' },
    { id: 'shapes', name: 'Shapes', icon: '⬛' },
    { id: 'arrows', name: 'Arrows', icon: '➡️' },
    { id: 'nature', name: 'Nature', icon: '🌿' },
    { id: 'objects', name: 'Objects', icon: '📱' },
    { id: 'people', name: 'People', icon: '👤' },
  ];

  useEffect(() => {
    if (searchQuery) searchElements();
    else loadPopularElements();
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    loadPopularElements();
  }, []);

  // 🔍 Search Klippy elements
  const searchElements = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '20',
        format: 'svg',
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const targetUrl = encodeURIComponent(`https://api.klippy.ai/v1/search?${params}`);
      const response = await fetch(`${proxyUrl}${targetUrl}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Klippy API search failed');

      const data = await response.json();
      setElements(data.elements || []);
    } catch (error) {
      console.error('Klippy API search error:', error);
      toast.error('Failed to load search results, showing fallback elements.');
      fallbackElements();
    } finally {
      setIsLoading(false);
    }
  };

  // 🌟 Load popular Klippy elements
  const loadPopularElements = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '20',
        format: 'svg',
        sort: 'popular',
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const targetUrl = encodeURIComponent(`https://api.klippy.ai/v1/elements?${params}`);
      const response = await fetch(`${proxyUrl}${targetUrl}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Klippy API popular elements failed');

      const data = await response.json();
      setElements(data.elements || []);
      toast.success('Klippy elements loaded!');
    } catch (error) {
      console.error('Klippy API load error:', error);
      toast.error('Using demo fallback - Klippy unavailable.');
      fallbackElements();
    } finally {
      setIsLoading(false);
    }
  };

  // 🧩 Fallback demo elements (offline safe)
  const fallbackElements = () => {
    setElements([
      {
        id: '1',
        title: 'Heart Sticker',
        svg_url:
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Ik01MCA4NSBDNTAgODUgMTUgNjAgMTUgNDAgQzE1IDI1IDI1IDE1IDQwIDIwIEM0NSAxMCA1NSAxMCA2MCAyMCBDNzUgMTUgODUgMjUgODUgNDAgQzg1IDYwIDUwIDg1IDUwIDg1IFoiIGZpbGw9IiNFRjQ0NDQiLz48L3N2Zz4=',
      },
      {
        id: '2',
        title: 'Star Sticker',
        svg_url:
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiPjxwb2x5Z29uIHBvaW50cz0iNTAsMTAgNjEsMzUgOTAsMzUgNjksNTUgNzksODUgNTAsNzAgMjEsODUgMzEsNTUgMTAsMzUgMzksMzUiIGZpbGw9IiNGNTlFMEIiLz48L3N2Zz4=',
      },
      {
        id: '3',
        title: 'Lightning',
        svg_url:
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiPjxwYXRoIGQ9Ik00MCAxMCBMNDggNTAgMzUgNTA0MCA5MCw2NSA0MCAzNSIgc3Ryb2tlPSIjRkNEQjAwIiBzdHJva2Utd2lkdGg9IjUiIGZpbGw9Im5vbmUiLz48L3N2Zz4=',
      },
    ]);
  };

  // ➕ Add element to Fabric.js canvas
  const addElementToCanvas = async (element) => {
    if (!canvas) return;
    try {
      const imageUrl = element.svg_url || element.url || element.image_url;
      if (!imageUrl) throw new Error('No image found');

      const img = await FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' });
      img.set({
        left: canvas.width / 2 - 60,
        top: canvas.height / 2 - 60,
        scaleX: 1,
        scaleY: 1,
        cornerStyle: 'circle',
        cornerSize: 12,
        transparentCorners: false,
        cornerColor: '#4f46e5',
        borderColor: '#4f46e5',
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      updateLayers();
      saveToHistory();

      toast.success(`${element.title || 'Element'} added!`);
    } catch (err) {
      console.error('Add to canvas failed:', err);
      toast.error('Failed to add element.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Klippy Elements
        </h3>
        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
          {elements.length} items
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Search elements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-9 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-1">
        {categories.map((c) => (
          <Button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            variant={selectedCategory === c.id ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs gap-1"
          >
            <span>{c.icon}</span>
            {c.name}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
            Loading Klippy elements...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {elements.map((el, i) => (
            <motion.div
              key={el.id || i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => addElementToCanvas(el)}
              className="aspect-square bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer transition-all duration-200 p-3 group relative"
            >
              <img
                src={el.preview_url || el.image_url || el.svg_url}
                alt={el.title}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-medium text-center p-1">
                  {el.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && elements.length === 0 && (
        <div className="text-center py-8 text-sm text-slate-500">
          No elements found. Try another search.
        </div>
      )}
    </div>
  );
};

export default ElementsPanel;
