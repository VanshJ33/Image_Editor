import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid3X3, Loader2, Download, Star, Sparkles } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useEditor } from '../../contexts/EditorContext';
import { FabricImage } from 'fabric';
import { toast } from 'sonner';
import stickerService from '../../services/sticker-service';
import klipyService from '../../services/klipy-service';
import { isGifUrl } from '../../utils/gif-utils';

const StickersPanel = ({ isOpen, onClose }) => {
  const { canvas, saveToHistory, updateLayers, gifHandler } = useEditor();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState('local');
  const [stickers, setStickers] = useState([]);
  const [klipyItems, setKlipyItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [klipyLoading, setKlipyLoading] = useState(false);
  const [categories] = useState(stickerService.getCategories());
  const [mediaTypes] = useState(klipyService.getMediaTypes());
  const [selectedMediaType, setSelectedMediaType] = useState('all');
  const searchTimeoutRef = useRef(null);
  const klipySearchTimeoutRef = useRef(null);
  const observerRef = useRef(null);

  // Debounced search for local stickers
  const debouncedSearch = useCallback((query, category) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await stickerService.searchStickers(query, category, 'all', 40);
        setStickers(results);
      } catch (error) {
        console.error('Search failed:', error);
        // Failed to load stickers
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

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
            results = await klipyService.searchGifs(query, 1, 24);
            break;
          case 'stickers':
            results = await klipyService.searchStickers(query, 1, 24);
            break;
          case 'clips':
            results = await klipyService.searchClips(query, 1, 24);
            break;
          case 'memes':
            results = await klipyService.searchMemes(query, 1, 24);
            break;
          default:
            results = await klipyService.searchAll(query, 1, 6);
        }
        setKlipyItems(results);
      } catch (error) {
        console.error('KLIPY search failed:', error);
        // Failed to load media from KLIPY
      } finally {
        setKlipyLoading(false);
      }
    }, 300);
  }, []);

  // Load initial stickers
  useEffect(() => {
    debouncedSearch('', '');
  }, [debouncedSearch]);

  // Load initial KLIPY items
  useEffect(() => {
    debouncedKlipySearch('', selectedMediaType);
  }, [debouncedKlipySearch, selectedMediaType]);

  // Handle search and category changes for local stickers
  useEffect(() => {
    if (activeTab === 'local') {
      debouncedSearch(searchQuery, selectedCategory);
    }
  }, [searchQuery, selectedCategory, debouncedSearch, activeTab]);

  // Handle search and media type changes for KLIPY
  useEffect(() => {
    if (activeTab === 'klipy') {
      debouncedKlipySearch(searchQuery, selectedMediaType);
    }
  }, [searchQuery, selectedMediaType, debouncedKlipySearch, activeTab]);

  // Add sticker to canvas
  const addStickerToCanvas = async (sticker) => {
    if (!canvas) {
      // Canvas not ready
      return;
    }

    try {
      const imageUrl = sticker.url || sticker.thumbnail;
      if (!imageUrl) {
        // No image URL found
        return;
      }

      const isGif = isGifUrl(imageUrl) || sticker.type === 'gif' || sticker.type === 'clip';
      
      if (isGif && gifHandler) {
        // Use GIF handler for animated GIFs
        // For GIFs, prefer the actual URL over thumbnail
        const gifUrl = sticker.url || sticker.thumbnail || imageUrl;
        console.log('Adding GIF to canvas:', { gifUrl, sticker, isGif, hasHandler: !!gifHandler });
        
        const centerX = canvas.getWidth() / 2;
        const centerY = canvas.getHeight() / 2;
        
        try {
          const gifObj = await gifHandler.addAnimatedGif(gifUrl, {
            left: centerX - 100,
            top: centerY - 100,
            scaleX: 1,
            scaleY: 1,
            selectable: true,
            evented: true
          });
          
          console.log('GIF object created or found:', gifObj);
          
          // Only update history and show success if a new object was created
          // (addAnimatedGif returns existing object if duplicate found)
          const isNewObject = !canvas.getObjects().some(obj => 
            obj.isAnimatedGif && 
            obj.gifUrl === gifUrl && 
            obj !== gifObj
          );
          
          if (isNewObject) {
            canvas.setActiveObject(gifObj);
            canvas.renderAll();
            saveToHistory();
            updateLayers();
            // GIF added to canvas
          } else {
            // Object already existed, just select it
            canvas.setActiveObject(gifObj);
            canvas.renderAll();
            // GIF already on canvas
          }
        } catch (gifError) {
          console.error('Error adding GIF:', gifError);
          // Failed to add GIF
        }
      } else {
        // Use standard Fabric image for static images
        const img = await FabricImage.fromURL(imageUrl, { 
          crossOrigin: 'anonymous' 
        });
        
        const centerX = canvas.getWidth() / 2;
        const centerY = canvas.getHeight() / 2;
        
        img.set({
          left: centerX - (img.width || 200) / 2,
          top: centerY - (img.height || 200) / 2,
          selectable: true,
          evented: true
        });
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        saveToHistory();
        updateLayers();
        // Image added to canvas
      }
    } catch (error) {
      console.error('Failed to add sticker to canvas:', error);
      // Failed to add image to canvas
    }
  };

  // Lazy loading intersection observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              observerRef.current.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -300 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-xl z-50"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Elements
              </h2>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-700"
            >
              ✕
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder={activeTab === 'local' ? 'Search stickers...' : 'Search GIFs, stickers, clips...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="local">Local</TabsTrigger>
              <TabsTrigger value="klipy">KLIPY</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Categories/Media Types */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          {activeTab === 'local' ? (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setSelectedCategory('')}
                variant={selectedCategory === '' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs"
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs gap-1"
                >
                  <span>{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mediaTypes.map((type) => (
                <Button
                  key={type.id}
                  onClick={() => setSelectedMediaType(type.id)}
                  variant={selectedMediaType === type.id ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs gap-1"
                >
                  <span>{type.icon}</span>
                  {type.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Content Grid */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <Tabs value={activeTab} className="w-full">
              <TabsContent value="local" className="mt-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    <span className="ml-2 text-sm text-slate-500">Loading stickers...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {stickers.map((sticker, index) => (
                      <motion.div
                        key={`${sticker.source}-${sticker.id}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addStickerToCanvas(sticker)}
                        className="relative aspect-square bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer transition-all duration-200 p-2 group"
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          {sticker.source === 'local' ? (
                            <div
                              className="w-full h-full"
                              dangerouslySetInnerHTML={{ __html: sticker.svg }}
                            />
                          ) : (
                            <img
                              data-src={sticker.thumbnail}
                              alt={sticker.name}
                              className="w-full h-full object-contain"
                              loading="lazy"
                              ref={(el) => {
                                if (el && observerRef.current) {
                                  observerRef.current.observe(el);
                                }
                              }}
                            />
                          )}
                        </div>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {sticker.name}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {!loading && stickers.length === 0 && (
                  <div className="text-center py-12">
                    <Grid3X3 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 text-sm">No stickers found</p>
                    <p className="text-slate-400 text-xs mt-1">Try a different search term</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="klipy" className="mt-0">
                {klipyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    <span className="ml-2 text-sm text-slate-500">Loading from KLIPY...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {klipyItems.map((item, index) => (
                      <motion.div
                        key={`klipy-${item.id}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          console.log('🖱️ CLICKED!', item.name);
                          addStickerToCanvas(item);
                        }}
                        className="relative aspect-square bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer transition-all duration-200 p-2 group"
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <img
                            src={item.thumbnail}
                            alt={item.name}
                            className="w-full h-full object-contain rounded"
                            loading="lazy"
                          />
                        </div>
                        
                        {/* Media type badge */}
                        <div className="absolute top-1 right-1 px-1 py-0.5 bg-indigo-500 text-white text-xs rounded opacity-75">
                          {item.type.toUpperCase()}
                        </div>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {item.name}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {!klipyLoading && klipyItems.length === 0 && (
                  <div className="text-center py-12">
                    <Grid3X3 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 text-sm">No media found</p>
                    <p className="text-slate-400 text-xs mt-1">Try a different search term or media type</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {activeTab === 'local' ? stickers.length : klipyItems.length} elements
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>{activeTab === 'local' ? 'Local' : 'KLIPY'}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StickersPanel;