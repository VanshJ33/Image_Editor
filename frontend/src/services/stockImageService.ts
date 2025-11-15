/**
 * Stock Image Service
 * Handles Pixabay API integration for stock image search
 * Based on MiniPaint's media tool implementation
 */

export interface StockImage {
  id: number;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  tags: string;
  user: string;
  views: number;
  downloads: number;
  likes: number;
}

export interface StockImageSearchResponse {
  total: number;
  totalHits: number;
  hits: StockImage[];
}

class StockImageService {
  private apiKey: string;
  private baseUrl = 'https://pixabay.com/api/';
  private cache: Map<string, StockImageSearchResponse> = new Map();
  private perPage = 50;

  constructor() {
    // Get API key from environment or use default (reversed for basic obfuscation)
    // In production, this should be stored securely on the backend
    const defaultKey = '3ca2cd8af3fde33af218bea02-9021417';
    this.apiKey = process.env.REACT_APP_PIXABAY_KEY || defaultKey;
    
    // Reverse the key (MiniPaint does this for basic obfuscation)
    this.apiKey = this.apiKey.split('').reverse().join('');
  }

  /**
   * Search for stock images
   * @param query Search query
   * @param page Page number (1-based)
   * @param perPage Number of results per page
   * @param safeSearch Enable safe search
   */
  async searchImages(
    query: string = '',
    page: number = 1,
    perPage: number = this.perPage,
    safeSearch: boolean = true
  ): Promise<StockImageSearchResponse> {
    if (!query.trim()) {
      return {
        total: 0,
        totalHits: 0,
        hits: []
      };
    }

    const url = `${this.baseUrl}?key=${this.apiKey}` +
      `&page=${page}` +
      `&per_page=${perPage}` +
      `&safesearch=${safeSearch ? 'true' : 'false'}` +
      `&q=${encodeURIComponent(query)}` +
      `&image_type=photo` +
      `&orientation=all`;

    // Check cache
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const result: StockImageSearchResponse = {
        total: data.total || 0,
        totalHits: data.totalHits || 0,
        hits: (data.hits || []).map((hit: any) => ({
          id: hit.id,
          previewURL: hit.previewURL,
          webformatURL: hit.webformatURL,
          largeImageURL: hit.largeImageURL,
          tags: hit.tags,
          user: hit.user,
          views: hit.views,
          downloads: hit.downloads,
          likes: hit.likes
        }))
      };

      // Cache the result
      this.cache.set(url, result);

      return result;
    } catch (error) {
      console.error('Error searching stock images:', error);
      throw new Error('Failed to search stock images. Please check your connection and try again.');
    }
  }

  /**
   * Get total number of pages for a search query
   */
  getTotalPages(totalHits: number, perPage: number = this.perPage): number {
    return Math.ceil(totalHits / perPage);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const stockImageService = new StockImageService();
export default stockImageService;

