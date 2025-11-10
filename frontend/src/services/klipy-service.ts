import axios from 'axios';

interface KlipyItem {
  id: string;
  slug: string;
  title: string;
  file?: {
    // For GIFs/Stickers - nested size structure
    hd?: {
      gif?: { url: string; width: number; height: number; size: number };
      webp?: { url: string; width: number; height: number; size: number };
      jpg?: { url: string; width: number; height: number; size: number };
      mp4?: { url: string; width: number; height: number; size: number };
      webm?: { url: string; width: number; height: number; size: number };
    };
    md?: {
      gif?: { url: string; width: number; height: number; size: number };
      webp?: { url: string; width: number; height: number; size: number };
      jpg?: { url: string; width: number; height: number; size: number };
      mp4?: { url: string; width: number; height: number; size: number };
      webm?: { url: string; width: number; height: number; size: number };
    };
    sm?: {
      gif?: { url: string; width: number; height: number; size: number };
      webp?: { url: string; width: number; height: number; size: number };
      jpg?: { url: string; width: number; height: number; size: number };
      mp4?: { url: string; width: number; height: number; size: number };
      webm?: { url: string; width: number; height: number; size: number };
    };
    xs?: {
      gif?: { url: string; width: number; height: number; size: number };
      webp?: { url: string; width: number; height: number; size: number };
      jpg?: { url: string; width: number; height: number; size: number };
      mp4?: { url: string; width: number; height: number; size: number };
      webm?: { url: string; width: number; height: number; size: number };
    };
    // For Clips - direct format structure
    gif?: string;
    webp?: string;
    mp4?: string;
  };
  files?: {
    gif?: string;
    webp?: string;
    mp4?: string;
    original?: string;
  };
  images?: {
    fixed_height?: string;
    fixed_width?: string;
    preview?: string;
  };
  url?: string;
}

interface KlipyResponse {
  result: boolean;
  data: {
    data: KlipyItem[];
    current_page: number;
    per_page: number;
    has_next: boolean;
  };
}

export interface MediaItem {
  id: string;
  name: string;
  thumbnail: string;
  url: string;
  type: 'gif' | 'sticker' | 'clip' | 'meme';
  source: 'klipy';
}

class KlipyService {
  private apiKey: string;
  private baseUrl: string = 'https://api.klipy.com/api/v1';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout: number = 300000; // 5 minutes

  constructor() {
    // You'll need to set your KLIPY API key here or from environment
    this.apiKey = process.env.REACT_APP_KLIPY_API_KEY || 'pFdSoU3fblDVHO4OUSMYug9uCHj9lK3bsvTmrLNQD4ju1Z492CQ7JLCvWcjEI5UV';
  }

  private getCacheKey(type: string, query: string, page: number): string {
    return `${type}_${query}_${page}`;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private async makeRequest(endpoint: string): Promise<KlipyResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/${this.apiKey}/${endpoint}`, {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('KLIPY API request failed:', error);
      throw error;
    }
  }

  private transformKlipyItem(item: KlipyItem, type: 'gif' | 'sticker' | 'clip' | 'meme'): MediaItem {
    let thumbnail = '';
    let url = '';

    // Handle the actual KLIPY API structure with file.size.format
    if (item.file) {
      // Try different sizes in order: sm, md, hd
      const sizes = ['sm', 'md', 'hd'];
      
      for (const size of sizes) {
        if (item.file[size]) {
          // For thumbnails, prefer appropriate format
          if (!thumbnail) {
            if (type === 'clip') {
              // For clips, prefer static image formats
              thumbnail = item.file[size].jpg?.url || item.file[size].webp?.url || item.file[size].gif?.url || '';
            } else {
              thumbnail = item.file[size].webp?.url || item.file[size].gif?.url || item.file[size].jpg?.url || '';
            }
          }
          // For main URL, prefer appropriate format based on type
          if (!url) {
            if (type === 'gif') {
              url = item.file[size].gif?.url || item.file[size].webp?.url || item.file[size].mp4?.url || '';
            } else if (type === 'clip') {
              // For clips, use jpg thumbnail since mp4 won't display as image
              url = item.file[size].jpg?.url || item.file[size].webp?.url || item.file[size].gif?.url || '';
            } else {
              url = item.file[size].webp?.url || item.file[size].gif?.url || item.file[size].jpg?.url || '';
            }
          }
          if (thumbnail && url) break;
        }
      }
    }
    
    // Handle clips structure: file.gif, file.webp, file.mp4 (no nested sizes)
    if ((!thumbnail || !url) && item.file && !item.file.hd && !item.file.md) {
      if (type === 'clip') {
        // For clips, prefer gif for thumbnail and gif for URL (since it's animated)
        thumbnail = item.file.gif || item.file.webp || '';
        url = item.file.gif || item.file.webp || '';
      } else {
        thumbnail = item.file.webp || item.file.gif || '';
        url = item.file.gif || item.file.webp || '';
      }
    }
    
    // Fallback to old structure if needed
    if (!thumbnail || !url) {
      if (item.files) {
        thumbnail = item.files.webp || item.files.gif || item.files.original || '';
        url = item.files.gif || item.files.webp || item.files.original || '';
      } else if (item.images) {
        thumbnail = item.images.fixed_width || item.images.fixed_height || item.images.preview || '';
        url = thumbnail;
      } else if (item.url) {
        thumbnail = item.url;
        url = item.url;
      }
    }

    return {
      id: item.id || item.slug,
      name: item.title || item.slug || 'Untitled',
      thumbnail,
      url,
      type,
      source: 'klipy'
    };
  }

  async searchGifs(query: string = '', page: number = 1, perPage: number = 24): Promise<MediaItem[]> {
    const cacheKey = this.getCacheKey('gifs', query, page);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const endpoint = query 
        ? `gifs/search?q=${encodeURIComponent(query)}&locale=us_US&per_page=${perPage}&page=${page}`
        : `gifs/trending?locale=us_US&per_page=${perPage}`;
      
      const response = await this.makeRequest(endpoint);
      
      if (response.result && response.data?.data) {
        console.log('KLIPY GIFs response:', response.data.data.slice(0, 2)); // Log first 2 items for debugging
        const items = response.data.data.map(item => this.transformKlipyItem(item, 'gif'));
        console.log('Transformed GIFs:', items.slice(0, 2)); // Log transformed items
        this.setCache(cacheKey, items);
        return items;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch GIFs:', error);
      return [];
    }
  }

  async searchStickers(query: string = '', page: number = 1, perPage: number = 24): Promise<MediaItem[]> {
    const cacheKey = this.getCacheKey('stickers', query, page);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const endpoint = query 
        ? `stickers/search?q=${encodeURIComponent(query)}&locale=us_US&per_page=${perPage}&page=${page}`
        : `stickers/trending?locale=us_US&per_page=${perPage}`;
      
      const response = await this.makeRequest(endpoint);
      
      if (response.result && response.data?.data) {
        const items = response.data.data.map(item => this.transformKlipyItem(item, 'sticker'));
        this.setCache(cacheKey, items);
        return items;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch stickers:', error);
      return [];
    }
  }

  async searchClips(query: string = '', page: number = 1, perPage: number = 24): Promise<MediaItem[]> {
    const cacheKey = this.getCacheKey('clips', query, page);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const endpoint = query 
        ? `clips/search?q=${encodeURIComponent(query)}&locale=us_US&per_page=${perPage}&page=${page}`
        : `clips/trending?locale=us_US&per_page=${perPage}`;
      
      console.log('KLIPY Clips endpoint:', endpoint);
      const response = await this.makeRequest(endpoint);
      console.log('KLIPY Clips response:', response);
      
      if (response.result && response.data?.data) {
        console.log('KLIPY Clips raw data:', response.data.data.slice(0, 2));
        const items = response.data.data.map(item => this.transformKlipyItem(item, 'clip'));
        console.log('Transformed Clips:', items.slice(0, 2));
        this.setCache(cacheKey, items);
        return items;
      }
      console.log('No clips data found in response');
      return [];
    } catch (error) {
      console.error('Failed to fetch clips:', error);
      return [];
    }
  }

  async searchMemes(query: string = '', page: number = 1, perPage: number = 24): Promise<MediaItem[]> {
    const cacheKey = this.getCacheKey('memes', query, page);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const endpoint = query 
        ? `memes/search?q=${encodeURIComponent(query)}&locale=us_US&per_page=${perPage}&page=${page}`
        : `memes/trending?locale=us_US&per_page=${perPage}`;
      
      console.log('KLIPY Memes endpoint:', endpoint);
      const response = await this.makeRequest(endpoint);
      console.log('KLIPY Memes response:', response);
      
      if (response.result && response.data?.data) {
        console.log('KLIPY Memes raw data:', response.data.data.slice(0, 2));
        const items = response.data.data.map(item => this.transformKlipyItem(item, 'meme'));
        console.log('Transformed Memes:', items.slice(0, 2));
        this.setCache(cacheKey, items);
        return items;
      }
      console.log('No memes data found in response');
      return [];
    } catch (error) {
      console.error('Failed to fetch memes:', error);
      return [];
    }
  }

  async searchAll(query: string = '', page: number = 1, perPage: number = 33): Promise<MediaItem[]> {
    try {
      const [gifs, stickers, clips] = await Promise.all([
        this.searchGifs(query, page, perPage),
        this.searchStickers(query, page, perPage),
        this.searchClips(query, page, perPage)
      ]);
      
      return [...gifs, ...stickers, ...clips];
    } catch (error) {
      console.error('Failed to search all media:', error);
      return [];
    }
  }

  getMediaTypes() {
    return [
      { id: 'all', name: 'All', icon: '🎯' },
      { id: 'gifs', name: 'GIFs', icon: '🎬' },
      { id: 'stickers', name: 'Stickers', icon: '🏷️' },
      { id: 'clips', name: 'Clips', icon: '🎥' },
      // { id: 'memes', name: 'Memes', icon: '😂' }
    ];
  }
}

export default new KlipyService();