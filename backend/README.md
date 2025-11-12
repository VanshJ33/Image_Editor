# Image Editor Backend (Next.js)

Backend server for the Image Editor application with Cloudinary integration for organization-based image management. Built with Next.js.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the backend directory with your Cloudinary credentials:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

3. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:3000` by default.

4. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

All API routes are in the `pages/api` directory:

### Health Check
`GET /api/health`
- Checks if the backend server is running
- Returns: `{ status: 'ok', message: 'Backend server is running' }`

### Create Folder in Cloudinary
`POST /api/folder/create`
- Creates a folder in Cloudinary
- Body: `{ folderPath: string }`
- Returns: `{ success: boolean, message: string, folderPath: string }`

### Check Organization
`GET /api/organization/[orgName]/check`
- Checks if an organization folder exists in Cloudinary
- Returns: `{ exists: boolean, organizationName: string }`

### Create Organization
`POST /api/organization/[orgName]/create`
- Creates an organization folder structure in Cloudinary
- Creates main folder and subfolders: `editor/` and `mindmapping/`
- Returns: `{ success: boolean, message: string, organizationName: string, foldersCreated: Array, details: Array }`

### Get Organization Images
`GET /api/organization/[orgName]/images?type=editor|mindmapping`
- Fetches all images from the organization folder
- Optional `type` query parameter to filter by subfolder (editor or mindmapping)
- Returns: `{ images: Array, count: number }`

### Upload Image
`POST /api/organization/[orgName]/upload`
- Uploads an image to the organization folder
- Body: `{ imageUrl: string, type?: 'editor' | 'mindmapping' }`
- Returns: Image object with URL and metadata

### Get Image by ID
`GET /api/organization/[orgName]/image/[imageId]`
- Fetches a specific image by its Cloudinary public ID
- Returns: Image object with URL and metadata

## Cloudinary Folder Structure

Images are organized in Cloudinary as follows:
```
{organizationName}/
  ├── editor/          # Images for image editor
  └── mindmapping/     # Images for mind mapping
```

## Project Structure

```
backend/
├── pages/
│   └── api/           # API routes
│       ├── health.ts
│       ├── folder/
│       │   └── create.ts
│       └── organization/
│           └── [orgName]/
│               ├── check.ts
│               ├── create.ts
│               ├── images.ts
│               ├── upload.ts
│               └── image/
│                   └── [imageId].ts
├── lib/
│   └── cloudinary.ts  # Cloudinary configuration and helpers
├── next.config.js     # Next.js configuration
├── tsconfig.json      # TypeScript configuration
└── package.json
```

## Notes

- Make sure your Cloudinary account has the necessary permissions
- The organization folder will be created automatically when creating an organization
- Images are stored with automatic optimization and transformation
- CORS is configured to allow requests from the frontend

## Development

- Run `npm run dev` for development with hot reload
- Run `npm run build` to create a production build
- Run `npm start` to start the production server
