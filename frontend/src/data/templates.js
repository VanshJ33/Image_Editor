export const templates = [
  {
    id: 'instagram-post-1',
    name: 'Instagram Post - Gradient',
    category: 'Social Media',
    size: { width: 1080, height: 1080 },
    thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=400&fit=crop',
    data: {
      version: '5.3.0',
      objects: [
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1080,
          height: 1080,
          fill: { type: 'linear', coords: { x1: 0, y1: 0, x2: 1080, y2: 1080 }, colorStops: [{ offset: 0, color: '#667eea' }, { offset: 1, color: '#764ba2' }] },
          selectable: false,
          name: 'Background'
        },
        {
          type: 'textbox',
          left: 100,
          top: 450,
          width: 880,
          fontSize: 72,
          fontFamily: 'Poppins',
          fontWeight: 'bold',
          fill: '#ffffff',
          text: 'Your Amazing\nPost Title',
          textAlign: 'center',
          name: 'Title Text'
        }
      ]
    }
  },
  {
    id: 'youtube-thumb-1',
    name: 'YouTube Thumbnail - Bold',
    category: 'Social Media',
    size: { width: 1280, height: 720 },
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop',
    data: {
      version: '5.3.0',
      objects: [
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1280,
          height: 720,
          fill: { type: 'linear', coords: { x1: 0, y1: 0, x2: 1280, y2: 0 }, colorStops: [{ offset: 0, color: '#f093fb' }, { offset: 1, color: '#f5576c' }] },
          selectable: false,
          name: 'Background'
        },
        {
          type: 'textbox',
          left: 80,
          top: 250,
          width: 1120,
          fontSize: 96,
          fontFamily: 'Poppins',
          fontWeight: 'bold',
          fill: '#ffffff',
          text: 'CLICK HERE!',
          textAlign: 'center',
          name: 'Title Text'
        }
      ]
    }
  },
  {
    id: 'facebook-ad-1',
    name: 'Facebook Ad - Professional',
    category: 'Advertising',
    size: { width: 1200, height: 628 },
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=209&fit=crop',
    data: {
      version: '5.3.0',
      objects: [
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1200,
          height: 628,
          fill: '#1e293b',
          selectable: false,
          name: 'Background'
        },
        {
          type: 'textbox',
          left: 100,
          top: 200,
          width: 1000,
          fontSize: 64,
          fontFamily: 'Inter',
          fontWeight: 'bold',
          fill: '#ffffff',
          text: 'Special Offer Inside',
          textAlign: 'center',
          name: 'Headline'
        },
        {
          type: 'textbox',
          left: 100,
          top: 320,
          width: 1000,
          fontSize: 32,
          fontFamily: 'Inter',
          fill: '#94a3b8',
          text: 'Limited Time Only',
          textAlign: 'center',
          name: 'Subheadline'
        }
      ]
    }
  },
  {
    id: 'business-poster-1',
    name: 'Business Poster',
    category: 'Print',
    size: { width: 1080, height: 1350 },
    thumbnail: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=500&fit=crop',
    data: {
      version: '5.3.0',
      objects: [
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1080,
          height: 1350,
          fill: '#f8fafc',
          selectable: false,
          name: 'Background'
        },
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1080,
          height: 450,
          fill: { type: 'linear', coords: { x1: 0, y1: 0, x2: 0, y2: 450 }, colorStops: [{ offset: 0, color: '#4f46e5' }, { offset: 1, color: '#7c3aed' }] },
          selectable: false,
          name: 'Header'
        },
        {
          type: 'textbox',
          left: 100,
          top: 150,
          width: 880,
          fontSize: 72,
          fontFamily: 'Poppins',
          fontWeight: 'bold',
          fill: '#ffffff',
          text: 'Business Event 2025',
          textAlign: 'center',
          name: 'Event Title'
        }
      ]
    }
  },
  {
    id: 'product-promo-1',
    name: 'Product Promo',
    category: 'Marketing',
    size: { width: 1080, height: 1080 },
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    data: {
      version: '5.3.0',
      objects: [
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1080,
          height: 1080,
          fill: '#ffffff',
          selectable: false,
          name: 'Background'
        },
        {
          type: 'circle',
          left: 240,
          top: 240,
          radius: 300,
          fill: { type: 'linear', coords: { x1: 0, y1: 0, x2: 600, y2: 600 }, colorStops: [{ offset: 0, color: '#fbbf24' }, { offset: 1, color: '#f59e0b' }] },
          selectable: true,
          name: 'Circle'
        },
        {
          type: 'textbox',
          left: 100,
          top: 850,
          width: 880,
          fontSize: 56,
          fontFamily: 'Poppins',
          fontWeight: 'bold',
          fill: '#1e293b',
          text: 'New Product Launch',
          textAlign: 'center',
          name: 'Product Text'
        }
      ]
    }
  },
  {
    id: 'quote-card-1',
    name: 'Quote Card - Minimal',
    category: 'Social Media',
    size: { width: 1080, height: 1080 },
    thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=400&fit=crop',
    data: {
      version: '5.3.0',
      objects: [
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1080,
          height: 1080,
          fill: '#0f172a',
          selectable: false,
          name: 'Background'
        },
        {
          type: 'textbox',
          left: 100,
          top: 350,
          width: 880,
          fontSize: 48,
          fontFamily: 'Inter',
          fontStyle: 'italic',
          fill: '#ffffff',
          text: '"Success is not final, failure is not fatal: it is the courage to continue that counts."',
          textAlign: 'center',
          name: 'Quote Text'
        },
        {
          type: 'textbox',
          left: 100,
          top: 650,
          width: 880,
          fontSize: 28,
          fontFamily: 'Inter',
          fill: '#94a3b8',
          text: '— Winston Churchill',
          textAlign: 'center',
          name: 'Author'
        }
      ]
    }
  },
  {
    id: 'story-template-1',
    name: 'Instagram Story',
    category: 'Social Media',
    size: { width: 1080, height: 1920 },
    thumbnail: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=711&fit=crop',
    data: {
      version: '5.3.0',
      objects: [
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          fill: { type: 'linear', coords: { x1: 0, y1: 0, x2: 0, y2: 1920 }, colorStops: [{ offset: 0, color: '#ec4899' }, { offset: 1, color: '#8b5cf6' }] },
          selectable: false,
          name: 'Background'
        },
        {
          type: 'textbox',
          left: 100,
          top: 800,
          width: 880,
          fontSize: 64,
          fontFamily: 'Poppins',
          fontWeight: 'bold',
          fill: '#ffffff',
          text: 'Swipe Up!',
          textAlign: 'center',
          name: 'CTA Text'
        }
      ]
    }
  },
  {
    id: 'twitter-post-1',
    name: 'Twitter Post',
    category: 'Social Media',
    size: { width: 1200, height: 675 },
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=225&fit=crop',
    data: {
      version: '5.3.0',
      objects: [
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1200,
          height: 675,
          fill: { type: 'linear', coords: { x1: 0, y1: 0, x2: 1200, y2: 675 }, colorStops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#3b82f6' }] },
          selectable: false,
          name: 'Background'
        },
        {
          type: 'textbox',
          left: 100,
          top: 250,
          width: 1000,
          fontSize: 56,
          fontFamily: 'Inter',
          fontWeight: 'bold',
          fill: '#ffffff',
          text: 'Breaking News!',
          textAlign: 'center',
          name: 'Headline'
        }
      ]
    }
  },
  {
    id: 'linkedin-post-1',
    name: 'LinkedIn Post',
    category: 'Social Media',
    size: { width: 1200, height: 627 },
    thumbnail: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=209&fit=crop',
    data: {
      version: '5.3.0',
      objects: [
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1200,
          height: 627,
          fill: '#ffffff',
          selectable: false,
          name: 'Background'
        },
        {
          type: 'rect',
          left: 50,
          top: 50,
          width: 1100,
          height: 527,
          fill: 'transparent',
          stroke: '#4f46e5',
          strokeWidth: 8,
          selectable: false,
          name: 'Border'
        },
        {
          type: 'textbox',
          left: 150,
          top: 220,
          width: 900,
          fontSize: 48,
          fontFamily: 'Inter',
          fontWeight: 'bold',
          fill: '#1e293b',
          text: 'Professional Insight',
          textAlign: 'center',
          name: 'Title'
        }
      ]
    }
  },
  {
    id: 'event-flyer-1',
    name: 'Event Flyer',
    category: 'Print',
    size: { width: 1080, height: 1350 },
    thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=500&fit=crop',
    data: {
      version: '5.3.0',
      objects: [
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1080,
          height: 1350,
          fill: { type: 'linear', coords: { x1: 0, y1: 0, x2: 0, y2: 1350 }, colorStops: [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#ef4444' }] },
          selectable: false,
          name: 'Background'
        },
        {
          type: 'textbox',
          left: 100,
          top: 500,
          width: 880,
          fontSize: 80,
          fontFamily: 'Poppins',
          fontWeight: 'bold',
          fill: '#ffffff',
          text: 'SUMMER PARTY',
          textAlign: 'center',
          name: 'Event Title'
        },
        {
          type: 'textbox',
          left: 100,
          top: 650,
          width: 880,
          fontSize: 36,
          fontFamily: 'Poppins',
          fill: '#ffffff',
          text: 'July 25, 2025 • 8 PM',
          textAlign: 'center',
          name: 'Date Time'
        }
      ]
    }
  }
];
