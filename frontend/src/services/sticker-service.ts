import { STICKER_APIS, LOCAL_STICKERS, CACHE_CONFIG, PERFORMANCE_CONFIG, LocalSticker } from '../config/stickers-config';

interface Sticker {
  id: string;
  name: string;
  svg?: string;
  thumbnail?: string;
  category?: string;
  source?: string;
  collection?: string;
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

class StickerService {
  private cache: Map<string, CacheEntry>;
  private requestQueue: any[];
  private activeRequests: number;

  constructor() {
    this.cache = new Map();
    this.requestQueue = [];
    this.activeRequests = 0;
  }

  setCache(key: string, data: any): void {
    if (this.cache.size >= CACHE_CONFIG.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  getCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_CONFIG.ttl) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  getLocalStickers(category: string | null = null): Sticker[] {
    if (category && LOCAL_STICKERS[category]) {
      return LOCAL_STICKERS[category].map(sticker => ({
        ...sticker,
        thumbnail: this.generateSvgDataUrl(sticker.svg),
        source: 'local'
      }));
    }
    
    return Object.entries(LOCAL_STICKERS).flatMap(([cat, stickers]) =>
      stickers.map(sticker => ({
        ...sticker,
        category: cat,
        thumbnail: this.generateSvgDataUrl(sticker.svg),
        source: 'local'
      }))
    );
  }

  generateSvgDataUrl(svgContent: string | undefined, size: number = PERFORMANCE_CONFIG.thumbnailSize): string {
    if (!svgContent) return '';
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  async fetchIconifyIcons(collection: string = 'mdi', search: string = '', limit: number = 20): Promise<Sticker[]> {
    const cacheKey = `iconify_${collection}_${search}_${limit}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const listUrl = `${STICKER_APIS.ICONIFY.baseUrl}/collection?id=${collection}&pretty=1`;
      const listResponse = await fetch(listUrl);
      const collectionData = await listResponse.json();
      
      let icons: string[] = Object.keys(collectionData.icons || {});
      
      if (search) {
        icons = icons.filter(icon => 
          icon.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      icons = icons.slice(0, limit);
      
      const iconPromises = icons.map(async (iconName): Promise<Sticker | null> => {
        const svgUrl = `${STICKER_APIS.ICONIFY.baseUrl}/${collection}/${iconName}.svg`;
        try {
          const svgResponse = await fetch(svgUrl);
          const svgContent = await svgResponse.text();
          
          return {
            id: `${collection}-${iconName}`,
            name: iconName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            svg: svgContent,
            thumbnail: `${STICKER_APIS.ICONIFY.baseUrl}/${collection}/${iconName}.svg`,
            source: 'iconify',
            collection
          };
        } catch (error) {
          return null;
        }
      });
      
      const results = (await Promise.all(iconPromises)).filter(Boolean) as Sticker[];
      this.setCache(cacheKey, results);
      return results;
      
    } catch (error) {
      return [];
    }
  }

  async searchStickers(query: string = '', category: string = '', source: string = 'all', limit: number = 20): Promise<Sticker[]> {
    const results: Sticker[] = [];
    
    const localStickers = this.getLocalStickers(category);
    if (query) {
      const filteredLocal = localStickers.filter(sticker =>
        sticker.name.toLowerCase().includes(query.toLowerCase())
      );
      results.push(...filteredLocal.slice(0, Math.floor(limit / 2)));
    } else {
      results.push(...localStickers.slice(0, Math.floor(limit / 2)));
    }
    
    if (source === 'all' || source === 'iconify') {
      try {
        const iconifyResults = await this.fetchIconifyIcons('mdi', query, Math.floor(limit / 2));
        results.push(...iconifyResults);
      } catch (error) {
        console.warn('Iconify fetch failed:', error);
      }
    }
    
    return results.slice(0, limit);
  }

  getCategories() {
    return [
      { id: 'shapes', name: 'Shapes', icon: '⬛' },
      { id: 'arrows', name: 'Arrows', icon: '➡️' },
      { id: 'decorative', name: 'Decorative', icon: '✨' },
      { id: 'nature', name: 'Nature', icon: '🌿' },
      { id: 'objects', name: 'Objects', icon: '📱' },
      { id: 'people', name: 'People', icon: '👤' },
      { id: 'animals', name: 'Animals', icon: '🐾' },
      { id: 'food', name: 'Food', icon: '🍕' }
    ];
  }
}

export default new StickerService();

