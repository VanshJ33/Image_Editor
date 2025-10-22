class KlippyService {
  constructor() {
    this.baseUrl = '/api/klippy';
    this.cache = new Map();
  }

  setApiKey(apiKey) {
    // Not needed for local backend
  }

  async searchElements(query, category = 'all', limit = 20) {
    const cacheKey = `${query}-${category}-${limit}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString()
      });

      if (category !== 'all') {
        params.append('category', category);
      }

      const response = await fetch(`${this.baseUrl}/search?${params}`);

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Backend API error:', error);
      throw error;
    }
  }

  async getPopularElements(category = 'all', limit = 20) {
    const cacheKey = `popular-${category}-${limit}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        sort: 'popular'
      });

      if (category !== 'all') {
        params.append('category', category);
      }

      const response = await fetch(`${this.baseUrl}/elements?${params}`);

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Backend API error:', error);
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

export const klippyService = new KlippyService();