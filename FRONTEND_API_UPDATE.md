# Frontend API Integration Update

## Summary

The frontend has been updated to properly connect with the Next.js backend API running on `http://localhost:3000`.

## Changes Made

### 1. Centralized API Configuration
- **New File**: `frontend/src/config/api.ts`
  - Centralized API endpoint configuration
  - Helper functions for API URLs
  - Error handling utilities
  - Type-safe API endpoint definitions

### 2. Updated Components

#### `OrganizationInput.jsx`
- ✅ Updated to use centralized API config
- ✅ Improved error handling with `handleApiError()`
- ✅ Uses `getApiUrl()` and `API_CONFIG` for all API calls

#### `OrganizationImageBar.jsx`
- ✅ Updated both `OrganizationImageBarEditor` and `OrganizationImageBarMindMapping` components
- ✅ Uses centralized API config for fetching images
- ✅ Improved error handling

### 3. Environment Configuration
- ✅ Frontend `.env` file configured with `REACT_APP_API_URL=http://localhost:3000`
- ✅ Default fallback to `http://localhost:3000` if env variable not set

## API Endpoints Used

All endpoints are now accessed through the centralized config:

- `GET /api/organization/[orgName]/check` - Check organization
- `POST /api/organization/[orgName]/create` - Create organization
- `GET /api/organization/[orgName]/images?type=editor|mindmapping` - Get images
- `POST /api/organization/[orgName]/upload` - Upload image (future use)
- `GET /api/organization/[orgName]/image/[imageId]` - Get specific image (future use)

## Benefits

1. **Centralized Configuration**: All API endpoints in one place
2. **Type Safety**: TypeScript support for API endpoints
3. **Better Error Handling**: Consistent error messages across the app
4. **Easy Maintenance**: Change API URL in one place
5. **Future-Proof**: Easy to add new endpoints

## Usage Example

```typescript
import { getApiUrl, API_CONFIG, handleApiError } from '../../config/api';

// Get API URL
const url = getApiUrl(API_CONFIG.ORGANIZATION.CHECK('myorg'));

// Make request
try {
  const response = await axios.get(url);
  // Handle success
} catch (error) {
  const errorMessage = handleApiError(error);
  toast.error(errorMessage);
}
```

## Testing

1. Start the Next.js backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Test the flow:
   - Enter organization name
   - Create or login to organization
   - Check if images load in the floating bar

## Notes

- All API calls now use the centralized configuration
- Error handling is consistent across all components
- The API base URL can be changed via environment variable
- Default port is 3000 (Next.js default)

