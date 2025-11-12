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
"[project]/backend/pages/api/organization/[orgName]/images.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/backend/lib/cloudinary.ts [api] (ecmascript)");
;
async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', [
            'GET'
        ]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
    try {
        const { orgName } = req.query;
        const { type } = req.query; // 'editor' or 'mindmapping'
        if (!orgName || typeof orgName !== 'string') {
            return res.status(400).json({
                error: 'Organization name is required'
            });
        }
        // Search for images in the organization folder
        // If type is specified, look in subfolder
        const folderPath = type ? `${orgName}/${type}` : orgName;
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].search.expression(`folder:${folderPath}/*`).with_field('tags').max_results(500).execute();
        const images = await Promise.all(result.resources.map(async (resource)=>{
            // Try to get scene data from associated raw file
            let sceneData = null;
            // Check for associated scene file (named as {public_id}_scene)
            const sceneFileName = `${resource.public_id}_scene`;
            try {
                const sceneResource = await __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].api.resource(sceneFileName, {
                    resource_type: 'raw'
                });
                // Fetch the actual content
                const sceneResponse = await fetch(sceneResource.secure_url);
                if (sceneResponse.ok) {
                    sceneData = await sceneResponse.text();
                }
            } catch (e) {
                // Scene file doesn't exist, check context as fallback
                if (resource.context && resource.context.custom && resource.context.custom.sceneData) {
                    sceneData = resource.context.custom.sceneData;
                }
            }
            return {
                id: resource.public_id,
                url: resource.secure_url,
                thumbnail: __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].url(resource.public_id, {
                    width: 200,
                    height: 200,
                    crop: 'fill',
                    quality: 'auto'
                }),
                format: resource.format,
                width: resource.width,
                height: resource.height,
                createdAt: resource.created_at,
                name: resource.public_id.split('/').pop(),
                sceneData: sceneData
            };
        }));
        res.json({
            images,
            count: images.length
        });
    } catch (error) {
        console.error('Error fetching organization images:', error);
        res.status(500).json({
            error: 'Failed to fetch images',
            message: error.message
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__93d12c9e._.js.map