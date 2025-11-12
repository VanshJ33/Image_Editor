module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/cloudinary [external] (cloudinary, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("cloudinary", () => require("cloudinary"));

module.exports = mod;
}),
"[project]/backend/lib/cloudinary.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createCloudinaryFolder",
    ()=>createCloudinaryFolder,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$cloudinary__$5b$external$5d$__$28$cloudinary$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/cloudinary [external] (cloudinary, cjs)");
;
// Configure Cloudinary
__TURBOPACK__imported__module__$5b$externals$5d2f$cloudinary__$5b$external$5d$__$28$cloudinary$2c$__cjs$29$__["v2"].config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$externals$5d2f$cloudinary__$5b$external$5d$__$28$cloudinary$2c$__cjs$29$__["v2"];
async function createCloudinaryFolder(folderPath) {
    // Cloudinary creates folders automatically when you upload to them
    // We'll upload a small transparent 1x1 PNG placeholder
    const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    try {
        const result = await __TURBOPACK__imported__module__$5b$externals$5d2f$cloudinary__$5b$external$5d$__$28$cloudinary$2c$__cjs$29$__["v2"].uploader.upload(placeholderImage, {
            folder: folderPath,
            public_id: '.folder_marker',
            overwrite: true,
            invalidate: true,
            resource_type: 'image'
        });
        return {
            success: true,
            public_id: result.public_id
        };
    } catch (error) {
        console.error(`Error creating folder ${folderPath}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}
}),
"[project]/backend/pages/api/organization/[orgName]/image/[imageId].ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/backend/lib/cloudinary.ts [api] (ecmascript)");
;
async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).end();
        return;
    }
    // Set CORS headers for actual request
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'GET') {
        try {
            const { imageId } = req.query;
            if (!imageId || typeof imageId !== 'string') {
                return res.status(400).json({
                    error: 'Image ID is required'
                });
            }
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].api.resource(imageId);
            res.json({
                id: result.public_id,
                url: result.secure_url,
                format: result.format,
                width: result.width,
                height: result.height
            });
        } catch (error) {
            console.error('Error fetching image:', error);
            res.status(500).json({
                error: 'Failed to fetch image',
                message: error.message
            });
        }
    } else if (req.method === 'DELETE') {
        try {
            const { imageId } = req.query;
            if (!imageId || typeof imageId !== 'string') {
                return res.status(400).json({
                    error: 'Image ID is required'
                });
            }
            // Delete the image from Cloudinary
            const deleteResult = await __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].uploader.destroy(imageId);
            // Also try to delete associated scene file if it exists
            const sceneFileName = `${imageId}_scene`;
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].uploader.destroy(sceneFileName, {
                    resource_type: 'raw'
                });
            } catch (sceneError) {
                // Scene file might not exist, that's okay
                console.log('Scene file not found or already deleted:', sceneFileName);
            }
            if (deleteResult.result === 'ok' || deleteResult.result === 'not found') {
                res.json({
                    success: true,
                    message: 'Image deleted successfully',
                    id: imageId
                });
            } else {
                res.status(500).json({
                    error: 'Failed to delete image',
                    result: deleteResult.result
                });
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            res.status(500).json({
                error: 'Failed to delete image',
                message: error.message
            });
        }
    } else {
        res.setHeader('Allow', [
            'GET',
            'DELETE',
            'OPTIONS'
        ]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__837c2197._.js.map