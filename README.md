# Image Editor with KLIPY Integration

A powerful React-based image editor with integrated KLIPY API support for GIFs, stickers, clips, and memes.

## Features

### Core Editor Features
- Canvas-based image editing with Fabric.js
- Text editing with custom fonts
- Shape tools and drawing capabilities
- Image filters and effects
- Layer management
- Undo/Redo functionality

### KLIPY Integration
- **GIFs**: Access to KLIPY's animated GIF library
- **Stickers**: Wide variety of sticker collections
- **Clips**: Video clips for dynamic content
- **Memes**: Popular meme templates and images
- **Search**: Real-time search across all media types
- **Categories**: Organized content with filtering options

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Image_Editor
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Set up KLIPY API**
   - Get your API key from [KLIPY Dashboard](https://klipy.com/dashboard)
   - Update `frontend/.env`:
   ```
   REACT_APP_KLIPY_API_KEY=your_actual_api_key_here
   ```

4. **Start the application**
   ```bash
   npm start
   ```

## Documentation

- [KLIPY Integration Guide](./KLIPY_INTEGRATION.md) - Detailed setup and usage instructions
- [Features Documentation](./FEATURES_DOCUMENTATION.md) - Complete feature overview

## Project Structure

```
Image_Editor/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── editor/
│   │   │       ├── StickersPanel.jsx    # KLIPY integration UI
│   │   │       └── ...
│   │   ├── services/
│   │   │   ├── klipy-service.ts         # KLIPY API service
│   │   │   └── sticker-service.ts       # Local stickers
│   │   └── ...
│   └── ...
├── backend/                             # Python backend (optional)
└── ...
```

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Canvas**: Fabric.js for image manipulation
- **UI Components**: Radix UI, Framer Motion
- **API Integration**: Axios for KLIPY API calls
- **State Management**: React Context

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
