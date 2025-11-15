import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Search, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { stockImageService, StockImage } from '../../services/stockImageService';
import { toast } from 'sonner';
import { useEditor } from '../../contexts/EditorContext';
import { FabricImage } from 'fabric';

/**
 * Stock Image Search Component
 * Based on MiniPaint's media tool implementation
 * Allows users to search and add stock images from Pixabay
 */
const StockImageSearch = ({ open, onOpenChange }) => {
  const { canvas, updateLayers, saveToHistory } = useEditor();
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalHits, setTotalHits] = useState(0);
  const [currentQuery, setCurrentQuery] = useState('');
  const inputRef = useRef(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.select();
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setImages([]);
      setPage(1);
      setTotalPages(0);
      setTotalHits(0);
      setCurrentQuery('');
    }
  }, [open]);

  const handleSearch = async (query: string, pageNum: number = 1) => {
    if (!query.trim()) {
      setImages([]);
      setTotalPages(0);
      setTotalHits(0);
      return;
    }

    setLoading(true);
    try {
      const response = await stockImageService.searchImages(query, pageNum, 50, true);
      
      if (response.totalHits === 0) {
        toast.error('Your search did not match any images.');
        setImages([]);
      } else {
        setImages(response.hits);
        setTotalHits(response.totalHits);
        setTotalPages(stockImageService.getTotalPages(response.totalHits, 50));
        setCurrentQuery(query);
      }
    } catch (error) {
      console.error('Error searching stock images:', error);
      toast.error(error instanceof Error ? error.message : 'Error connecting to service.');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = async (image) => {
    if (!canvas) {
      toast.error('Canvas not ready');
      return;
    }

    try {
      // Load image from webformatURL (like MiniPaint does)
      const img = await FabricImage.fromURL(image.webformatURL, { 
        crossOrigin: 'anonymous' 
      });

      // Scale image to fit canvas nicely (similar to MiniPaint's behavior)
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const imgWidth = img.width || 200;
      const imgHeight = img.height || 200;

      // Scale to 80% of canvas size or original size, whichever is smaller
      const scaleX = canvasWidth / imgWidth;
      const scaleY = canvasHeight / imgHeight;
      const scale = Math.min(scaleX, scaleY, 1) * 0.8;

      img.set({
        left: (canvasWidth - (imgWidth * scale)) / 2,
        top: (canvasHeight - (imgHeight * scale)) / 2,
        scaleX: scale,
        scaleY: scale,
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
      updateLayers();
      saveToHistory();

      // Close dialog after adding image (like MiniPaint)
      onOpenChange(false);
      toast.success('Image added to canvas');
    } catch (error) {
      console.error('Error loading image:', error);
      toast.error('Failed to load image. Please try again.');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
      handleSearch(currentQuery || searchQuery, newPage);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setPage(1);
      handleSearch(searchQuery, 1);
    }
  };

  // Render pagination buttons (max 10 pages shown, like MiniPaint)
  const renderPagination = () => {
    if (totalPages === 0) return null;

    const maxPagesToShow = 10;
    const startPage = Math.max(1, Math.min(page - 5, totalPages - maxPagesToShow + 1));
    const endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

    return (
      <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          title="Previous"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((pageNum) => (
          <Button
            key={pageNum}
            variant={pageNum === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePageChange(pageNum)}
            className={pageNum === page ? 'bg-indigo-600 text-white' : ''}
          >
            {pageNum}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          title="Next"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Stock Images
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter keywords to search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              onClick={() => {
                setPage(1);
                handleSearch(searchQuery, 1);
              }}
              disabled={loading || !searchQuery.trim()}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Results */}
          <ScrollArea className="border rounded-lg h-[500px] overflow-auto">
            {loading && images.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : images.length > 0 ? (
              <>
                <div className="p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Found {totalHits} images
                  </p>
                  {/* Image Grid - similar to MiniPaint's flex-container */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all aspect-square"
                        onClick={() => handleImageClick(image)}
                      >
                        <img
                          src={image.previewURL}
                          alt={image.tags}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs text-center p-2">
                            <p className="font-semibold truncate">{image.tags}</p>
                            <p className="text-xs opacity-75 mt-1">
                              {image.likes} likes
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {renderPagination()}
              </>
            ) : currentQuery ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                <p className="text-slate-500 text-sm">No images found</p>
                <p className="text-slate-400 text-xs mt-1">
                  Try different keywords
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                <Search className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 text-sm">Search for stock images</p>
                <p className="text-slate-400 text-xs mt-1">
                  Enter keywords and press Enter or click Search
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockImageSearch;

