# Backend Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Create .env file**
   Create a `.env` file in the `backend` directory with your Cloudinary credentials:
   ```env
   PORT=5000
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. **Start the Server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## Getting Cloudinary Credentials

1. Sign up at https://cloudinary.com (free tier available)
2. Go to Dashboard: https://cloudinary.com/console
3. Copy your:
   - Cloud Name
   - API Key
   - API Secret

## Testing the Backend

Once the server is running, test it:

```bash
# Check if organization exists
curl http://localhost:5000/api/organization/testorg/check

# Get images from organization
curl http://localhost:5000/api/organization/testorg/images?type=editor
```

## API Endpoints

- `GET /api/organization/:orgName/check` - Check if organization folder exists
- `GET /api/organization/:orgName/images?type=editor|mindmapping` - Get organization images
- `POST /api/organization/:orgName/upload` - Upload image to organization folder
- `GET /api/organization/:orgName/image/:imageId` - Get specific image

## Troubleshooting

- **Port already in use**: Change PORT in .env file
- **Cloudinary errors**: Verify your credentials are correct
- **CORS errors**: CORS is enabled by default for all origins

