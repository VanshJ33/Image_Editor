const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY';
const UNSPLASH_API_URL = 'https://api.unsplash.com';

let templateCache = new Map();

export const fetchUnsplashTemplates = async (category = 'business', count = 6) => {
  const cacheKey = `${category}-${count}`;
  
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey);
  }

  try {
    const query = getCategoryQuery(category);
    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?query=${query}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Unsplash');
    }

    const data = await response.json();
    const templates = data.results.map((photo, index) => ({
      id: `unsplash-${photo.id}`,
      name: `${category} Template ${index + 1}`,
      category: category,
      thumbnail: photo.urls.small,
      size: { width: 800, height: 600 },
      isPremium: true,
      elements: [
        {
          type: 'image',
          src: photo.urls.regular,
          left: 0,
          top: 0,
          width: 800,
          height: 600,
          scaleX: 1,
          scaleY: 1
        }
      ],
      attribution: {
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        unsplashUrl: photo.links.html
      }
    }));

    templateCache.set(cacheKey, templates);
    return templates;
  } catch (error) {
    console.error('Error fetching Unsplash templates:', error);
    return [];
  }
};

const getCategoryQuery = (category) => {
  const queries = {
    business: 'business office professional',
    social: 'social media lifestyle',
    marketing: 'marketing advertising',
    presentation: 'presentation corporate',
    design: 'design creative modern',
    education: 'education learning academic'
  };
  return queries[category] || category;
};