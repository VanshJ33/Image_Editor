# KLIPY API Integration

This document explains how to set up and use the KLIPY API integration in the Image Editor.

## Setup

1. **Get KLIPY API Key**
   - Sign up at [KLIPY Dashboard](https://klipy.com/dashboard)
   - Get your API key from the dashboard

2. **Configure Environment Variable**
   - Open `frontend/.env`
   - Replace `YOUR_KLIPY_API_KEY` with your actual API key:
   ```
   REACT_APP_KLIPY_API_KEY=your_actual_api_key_here
   ```

## Features

### Media Types Supported
- **GIFs**: Animated images from KLIPY's GIF collection
- **Stickers**: Static sticker images
- **Clips**: Video clips (displayed as thumbnails)
- **Memes**: Meme images

### Usage

1. **Access the Panel**
   - Click the Elements/Stickers button in the left sidebar
   - The panel will open with two tabs: "Local" and "KLIPY"

2. **Local Tab**
   - Contains locally stored SVG stickers
   - Categories: Shapes, Arrows, Decorative, Nature, Objects, People, Animals, Food
   - Search functionality for local stickers

3. **KLIPY Tab**
   - Access to KLIPY's media library
   - Media type filters: All, GIFs, Stickers, Clips, Memes
   - Search functionality across all KLIPY content
   - Real-time search with debouncing (300ms delay)

### Search Functionality
- **Local**: Searches through local sticker names and categories
- **KLIPY**: Searches through KLIPY's database using their API
- **Auto-update**: Selected tabs and filters automatically update the displayed content

### Performance Features
- **Caching**: API responses are cached for 5 minutes to reduce API calls
- **Lazy Loading**: Images load as they come into view
- **Debounced Search**: Prevents excessive API calls during typing
- **Error Handling**: Graceful fallbacks when API calls fail

## API Endpoints Used

The integration uses the following KLIPY API endpoints:

### GIFs
- Search: `GET /gifs/search?q={query}&locale=us_US&per_page=24&page=1`
- Trending: `GET /gifs/trending?locale=us_US&per_page=24`

### Stickers
- Search: `GET /stickers/search?q={query}&locale=us_US&per_page=24&page=1`
- Trending: `GET /stickers/trending?locale=us_US&per_page=24`

### Clips
- Search: `GET /clips/search?q={query}&locale=us_US&per_page=24&page=1`

### Memes
- Search: `GET /memes/search?q={query}&locale=us_US&per_page=24&page=1`

## File Structure

```
src/
├── services/
│   ├── klipy-service.ts          # KLIPY API integration service
│   └── sticker-service.ts        # Local stickers service
├── components/
│   └── editor/
│       └── StickersPanel.jsx     # Updated panel with KLIPY integration
└── config/
    └── stickers-config.ts        # Local stickers configuration
```

## Error Handling

- Network errors are caught and displayed as toast notifications
- Failed API calls fall back gracefully without breaking the UI
- Invalid API keys will show error messages in the console
- CORS issues are handled with proper headers

## Rate Limiting

- Requests are debounced to prevent excessive API calls
- Caching reduces redundant requests
- Maximum 5 concurrent requests to prevent overwhelming the API

## Troubleshooting

1. **No KLIPY content loading**
   - Check if API key is correctly set in `.env`
   - Verify internet connection
   - Check browser console for error messages

2. **CORS errors**
   - KLIPY API should support CORS, but if issues persist, check browser console
   - Ensure you're using HTTPS in production

3. **Slow loading**
   - Check network connection
   - KLIPY API response times may vary
   - Local content will always load faster

## Future Enhancements

- Pagination support for loading more results
- Favorites/bookmarking system
- Advanced filtering options
- Custom collections
- Offline mode with cached content