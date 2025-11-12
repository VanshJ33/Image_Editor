# Migration from Express to Next.js

The backend has been migrated from Express.js to Next.js.

## Changes

### Old Structure (Express)
- Single `server.js` file with all routes
- Express server running on port 5000/5001
- Manual CORS configuration

### New Structure (Next.js)
- API routes in `pages/api/` directory
- Next.js server running on port 3000 (default)
- Built-in CORS handling via `next.config.js`
- TypeScript support
- Better code organization

## Migration Steps

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Variables**
   - Copy `.env` to `.env.local` (Next.js uses `.env.local` for local development)
   - Or create `.env.local` with your Cloudinary credentials

3. **Start the Server**
   ```bash
   npm run dev    # Development mode (port 3000)
   npm run build  # Production build
   npm start      # Production mode
   ```

## API Endpoints

All endpoints remain the same, but the base URL changes:
- **Old**: `http://localhost:5001/api/...`
- **New**: `http://localhost:3000/api/...`

## Frontend Configuration

The frontend has been updated to use `http://localhost:3000` as the default API URL.

## Old Files

The old `server.js` file can be kept for reference but is no longer used. You can delete it if you want.

## Benefits of Next.js

- Better TypeScript support
- Built-in API routing
- Better development experience
- Easier deployment (Vercel, etc.)
- Automatic code splitting
- Better performance

