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
"[project]/backend/pages/api/organization/[orgName]/check.ts [api] (ecmascript)", ((__turbopack_context__) => {
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
        if (!orgName || typeof orgName !== 'string') {
            return res.status(400).json({
                error: 'Organization name is required'
            });
        }
        // Try multiple methods to check if folder exists
        let exists = false;
        // Method 1: Check if folder has any resources
        try {
            const searchResult = await __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].search.expression(`folder:${orgName}/*`).max_results(1).execute();
            if (searchResult.total_count > 0) {
                exists = true;
            }
        } catch (searchError) {
        // Search might fail if folder doesn't exist, continue to other methods
        }
        // Method 2: Check for subfolders (editor or mindmapping)
        if (!exists) {
            try {
                const subFolders = await __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].api.sub_folders(orgName);
                if (subFolders && subFolders.folders && subFolders.folders.length > 0) {
                    exists = true;
                }
            } catch (folderError) {
            // Folder doesn't exist or no subfolders
            }
        }
        // Method 3: Check if folder exists at root level
        if (!exists) {
            try {
                const rootFolders = await __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].api.root_folders();
                if (rootFolders && rootFolders.folders) {
                    const folderNames = rootFolders.folders.map((f)=>f.name || f.path);
                    if (folderNames.includes(orgName)) {
                        exists = true;
                    }
                }
            } catch (rootError) {
            // Couldn't check root folders
            }
        }
        res.json({
            exists,
            organizationName: orgName
        });
    } catch (error) {
        console.error('Error checking organization:', error);
        // Default to false if any error occurs
        res.json({
            exists: false,
            organizationName: req.query.orgName
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__d8ba30a0._.js.map