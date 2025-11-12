# Organization-Based Image Editor Setup Guide

This guide explains how to set up and use the organization-based image management system.

## Overview

The application now supports organization-based image management:
1. On app load, users are prompted to enter their organization name
2. The backend checks if the organization folder exists in Cloudinary
3. If valid, users can choose between Image Editor or Mind Mapping
4. A floating image bar displays all images from the organization folder
5. Clicking an image loads it into the canvas for editing

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Cloudinary

Create a `.env` file in the `backend` directory:

```env
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get your Cloudinary credentials from: https://cloudinary.com/console

### 3. Start Backend Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

## Frontend Setup

### 1. Configure API URL (Optional)

If your backend is running on a different URL, create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000
```

### 2. Start Frontend

```bash
cd frontend
npm start
```

## Cloudinary Folder Structure

Images are organized in Cloudinary as follows:

```
{organizationName}/
  ├── editor/          # Images for image editor
  └── mindmapping/     # Images for mind mapping
```

## Usage Flow

1. **Organization Input**: When the app loads, enter your organization name
2. **Verification**: The backend checks if the organization folder exists in Cloudinary
3. **Mode Selection**: If verified, choose between Image Editor or Mind Mapping
4. **Image Bar**: If images exist in the organization folder, a floating bar appears near the navbar
5. **Load Image**: Click any image in the bar to load it into the canvas

## API Endpoints

- `GET /api/organization/:orgName/check` - Check if organization exists
- `GET /api/organization/:orgName/images?type=editor|mindmapping` - Get organization images
- `POST /api/organization/:orgName/upload` - Upload image to organization folder
- `GET /api/organization/:orgName/image/:imageId` - Get specific image

## Features

- **Organization Verification**: Validates organization before allowing access
- **Image Gallery**: Floating bar displays all organization images
- **Quick Load**: One-click image loading to canvas
- **Mode-Specific**: Separate folders for editor and mind mapping images
- **Persistent Session**: Organization name stored in localStorage

## Troubleshooting

1. **Backend not connecting**: Check that the backend is running on port 5000
2. **Organization not found**: Ensure the folder exists in Cloudinary with the exact name
3. **Images not loading**: Verify Cloudinary credentials and folder structure
4. **CORS errors**: Ensure backend CORS is configured correctly

## Notes

- Organization name is case-sensitive
- Images are automatically optimized by Cloudinary
- The image bar only appears if images exist in the organization folder
- Organization name is stored in localStorage for convenience

