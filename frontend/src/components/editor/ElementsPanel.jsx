import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, Loader2, Grid3X3, Star } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useEditor } from '../../contexts/EditorContext';
import { FabricImage, Path, Circle, Rect, Polygon, Textbox } from 'fabric';
import { toast } from 'sonner';
import { stickerLibrary, getAllStickers, stickerCategories } from '../../data/stickers';
import klipyService from '../../services/klipy-service';
import { isGifUrl } from '../../utils/gif-utils';

const ElementsPanel = () => {
  const { canvas, saveToHistory, updateLayers, gifHandler } = useEditor();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('local');
  const [klipyItems, setKlipyItems] = useState([]);
  const [klipyLoading, setKlipyLoading] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState('all');
  const [mediaTypes] = useState(klipyService.getMediaTypes());
  const klipySearchTimeoutRef = useRef(null);

  const categories = stickerCategories;

  // Filter stickers based on search and category
  const filteredStickers = useMemo(() => {
    let allStickers = getAllStickers();
    
    // Filter by category
    if (selectedCategory !== 'all') {
      allStickers = allStickers.filter(s => s.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery && activeTab === 'local') {
      allStickers = allStickers.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return allStickers;
  }, [searchQuery, selectedCategory, activeTab]);

  // Debounced search for KLIPY items
  const debouncedKlipySearch = useCallback((query, mediaType) => {
    if (klipySearchTimeoutRef.current) {
      clearTimeout(klipySearchTimeoutRef.current);
    }
    
    klipySearchTimeoutRef.current = setTimeout(async () => {
      setKlipyLoading(true);
      try {
        let results = [];
        switch (mediaType) {
          case 'gifs':
            results = await klipyService.searchGifs(query, 1, 50);
            break;
          case 'stickers':
            results = await klipyService.searchStickers(query, 1, 50);
            break;
          case 'clips':
            results = await klipyService.searchClips(query, 1, 50);
            break;
          case 'memes':
            results = await klipyService.searchMemes(query, 1, 50);
            break;
          default:
            results = await klipyService.searchAll(query, 1, 33);
        }
        setKlipyItems(results);
      } catch (error) {
        console.error('KLIPY search failed:', error);
        toast.error('Failed to load media from KLIPY');
      } finally {
        setKlipyLoading(false);
      }
    }, 300);
  }, []);

  // Load initial KLIPY items
  useEffect(() => {
    debouncedKlipySearch('', selectedMediaType);
  }, [debouncedKlipySearch, selectedMediaType]);

  // Handle media type changes for KLIPY (always use current search query)
  useEffect(() => {
    if (activeTab === 'klipy') {
      debouncedKlipySearch(searchQuery, selectedMediaType);
    }
  }, [selectedMediaType, debouncedKlipySearch, activeTab]);

  // Handle search changes for KLIPY (only when typing)
  useEffect(() => {
    if (activeTab === 'klipy') {
      debouncedKlipySearch(searchQuery, selectedMediaType);
    }
  }, [searchQuery, debouncedKlipySearch, activeTab]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (klipySearchTimeoutRef.current) {
        clearTimeout(klipySearchTimeoutRef.current);
      }
    };
  }, []);

  // ➕ Add sticker to Fabric.js canvas
  const addStickerToCanvas = async (sticker) => {
    if (!canvas) return;
    try {
      let fabricObject;

      if (sticker.source === 'klipy') {
        // Handle KLIPY items
        const imageUrl = sticker.thumbnail || sticker.url;
        const isGif = isGifUrl(imageUrl) || sticker.type === 'gif' || sticker.type === 'clip';
        
        if (isGif && gifHandler) {
          // Use GIF handler for animated GIFs
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          
          fabricObject = await gifHandler.addAnimatedGif(imageUrl, {
            left: centerX - 75,
            top: centerY - 75,
            scaleX: 1,
            scaleY: 1,
            selectable: true,
            evented: true
          });
        } else {
          // Use standard Fabric image for static images
          const img = await FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' });
          
          const maxSize = 150;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          
          fabricObject = img;
          fabricObject.set({
            left: canvas.width / 2 - (img.width * scale) / 2,
            top: canvas.height / 2 - (img.height * scale) / 2,
            scaleX: scale,
            scaleY: scale,
            selectable: true,
            evented: true
          });
        }
      } else if (sticker.type === 'emoji') {
        // Create emoji as text object
        fabricObject = new Textbox(sticker.emoji, {
          left: canvas.width / 2 - 50,
          top: canvas.height / 2 - 50,
          fontSize: 80,
          fontFamily: 'Arial, sans-serif',
          fill: '#000000',
          selectable: true,
        });
      } else if (sticker.type === 'svg' && sticker.data) {
        // Create SVG Path
        const pathOptions = {
          left: canvas.width / 2 - 50,
          top: canvas.height / 2 - 50,
          scaleX: 0.5,
          scaleY: 0.5,
        };

        // Set fill if provided
        if (sticker.fill && sticker.fill !== 'none') {
          pathOptions.fill = sticker.fill;
        }

        // Set stroke properties if provided
        if (sticker.stroke) {
          pathOptions.stroke = sticker.stroke;
          pathOptions.strokeWidth = sticker.strokeWidth || 3;
        }

        fabricObject = new Path(sticker.data, pathOptions);
      } else {
        throw new Error('Invalid sticker data');
      }

      // Only set corner properties if not a GIF (GIFs are already added by the handler)
      const isGifObject = fabricObject.isAnimatedGif;
      
      if (!isGifObject) {
        fabricObject.set({
          cornerStyle: 'circle',
          cornerSize: 12,
          transparentCorners: false,
          cornerColor: '#4f46e5',
          borderColor: '#4f46e5',
        });
        canvas.add(fabricObject);
      }
      
      canvas.setActiveObject(fabricObject);
      canvas.renderAll();
      updateLayers();
      saveToHistory();

      // Sticker added
    } catch (err) {
      console.error('Add to canvas failed:', err);
      // Failed to add sticker
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Stickers & Elements
        </h3>
        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
          {activeTab === 'local' ? filteredStickers.length : klipyItems.length} items
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder={activeTab === 'local' ? 'Search stickers...' : 'Search GIFs, stickers, clips...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-9 text-sm"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="local">Local</TabsTrigger>
          <TabsTrigger value="klipy">KLIPY</TabsTrigger>
        </TabsList>

        {/* Categories/Media Types */}
        <div className="mt-3">
          {activeTab === 'local' ? (
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
          ) : (
            <div className="flex flex-wrap gap-1">
              {mediaTypes.map((type) => (
                <Button
                  key={type.id}
                  onClick={() => setSelectedMediaType(type.id)}
                  variant={selectedMediaType === type.id ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs gap-1"
                >
                  <span>{type.icon}</span>
                  {type.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        <TabsContent value="local" className="mt-4">
          <div className="grid grid-cols-3 gap-3">
            {filteredStickers.map((sticker, i) => (
              <motion.div
                key={sticker.id || i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addStickerToCanvas(sticker)}
                className="aspect-square bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer transition-all duration-200 p-3 group relative flex items-center justify-center"
              >
                {sticker.type === 'emoji' ? (
                  <div className="text-6xl flex items-center justify-center h-full">
                    {sticker.emoji}
                  </div>
                ) : sticker.type === 'svg' ? (
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid meet"
                    className="w-full h-full"
                  >
                    <path
                      d={sticker.data}
                      fill={sticker.fill}
                      stroke={sticker.stroke}
                      strokeWidth={sticker.strokeWidth}
                    />
                  </svg>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium text-center p-1">
                    {sticker.name}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredStickers.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-500">
              No stickers found. Try another search.
            </div>
          )}
        </TabsContent>

        <TabsContent value="klipy" className="mt-4">
          {/* Debug button */}
          <Button 
            onClick={async () => {
              console.log('Testing KLIPY API...');
              const testResults = await klipyService.searchGifs('cat', 1, 5);
              console.log('Test results:', testResults);
            }}
            size="sm"
            className="mb-2"
          >
            Test API
          </Button>
          
          {klipyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="ml-2 text-sm text-slate-500">Loading from KLIPY...</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {klipyItems.map((item, index) => (
                <motion.div
                  key={`klipy-${item.id}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addStickerToCanvas(item)}
                  className="relative aspect-square bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer transition-all duration-200 p-2 group"
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-contain rounded"
                      loading="lazy"
                      onError={(e) => {
                        // Try fallback URL if thumbnail fails
                        if (e.target.src !== item.url && item.url) {
                          e.target.src = item.url;
                        } else {
                          // Show placeholder if both fail
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="w-full h-full items-center justify-center text-slate-400 text-xs hidden">
                      {item.type.toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Media type badge */}
                  <div className="absolute top-1 right-1 px-1 py-0.5 bg-indigo-500 text-white text-xs rounded opacity-75">
                    {item.type.toUpperCase()}
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-medium text-center p-1">
                      {item.name}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!klipyLoading && klipyItems.length === 0 && (
            <div className="text-center py-8">
              <Grid3X3 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-sm">No media found</p>
              <p className="text-slate-400 text-xs mt-1">Try a different search term or media type</p>
              <p className="text-slate-400 text-xs mt-1">Check browser console for API debug info</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ElementsPanel;