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
"[project]/backend/pages/api/organization/[orgName]/upload.ts [api] (ecmascript)", ((__turbopack_context__) => {
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
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).end();
        return;
    }
    // Set CORS headers for actual request
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method !== 'POST') {
        res.setHeader('Allow', [
            'POST',
            'OPTIONS'
        ]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
    try {
        const { orgName } = req.query;
        const { imageUrl, type, sceneData } = req.body; // type: 'editor' or 'mindmapping', sceneData: JSON string of Excalidraw scene
        if (!orgName || typeof orgName !== 'string') {
            return res.status(400).json({
                error: 'Organization name is required'
            });
        }
        if (!imageUrl) {
            return res.status(400).json({
                error: 'Image URL is required'
            });
        }
        const folderPath = type ? `${orgName}/${type}` : orgName;
        // Upload image to Cloudinary first
        const uploadOptions = {
            folder: folderPath,
            use_filename: true,
            unique_filename: true
        };
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].uploader.upload(imageUrl, uploadOptions);
        // Handle scene data - store as separate raw file if provided
        let sceneDataUrl = null;
        if (sceneData && typeof sceneData === 'string' && sceneData.length > 0) {
            try {
                // Store scene data as a separate raw text file in Cloudinary
                // Use the image's public_id as part of the scene file name for association
                const sceneFileName = `${result.public_id}_scene`;
                const sceneDataResult = await __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].uploader.upload(`data:text/plain;base64,${Buffer.from(sceneData).toString('base64')}`, {
                    folder: folderPath,
                    public_id: sceneFileName,
                    resource_type: 'raw',
                    format: 'txt',
                    overwrite: true
                });
                sceneDataUrl = sceneDataResult.secure_url;
            } catch (sceneError) {
                console.warn('Failed to store scene data separately:', sceneError);
                // If storing separately fails, try to store in context (limited size)
                if (sceneData.length <= 2000) {
                    try {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].uploader.add_context({
                            context: {
                                sceneData: sceneData
                            },
                            public_ids: [
                                result.public_id
                            ]
                        });
                        sceneDataUrl = sceneData; // Return the data directly if small enough
                    } catch (contextError) {
                        console.warn('Failed to store scene data in context:', contextError);
                    }
                }
            }
        }
        res.json({
            id: result.public_id,
            url: result.secure_url,
            thumbnail: __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].url(result.public_id, {
                width: 200,
                height: 200,
                crop: 'fill',
                quality: 'auto'
            }),
            format: result.format,
            width: result.width,
            height: result.height,
            sceneData: sceneDataUrl
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({
            error: 'Failed to upload image',
            message: error.message
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f92ff958._.js.map