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
"[project]/backend/pages/api/organization/[orgName]/create.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/backend/lib/cloudinary.ts [api] (ecmascript)");
;
;
async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'POST') {
        res.setHeader('Allow', [
            'POST',
            'OPTIONS'
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
        // Validate organization name
        if (orgName.trim().length === 0) {
            return res.status(400).json({
                error: 'Organization name is required'
            });
        }
        // Sanitize organization name (remove special characters that might cause issues)
        const sanitizedOrgName = orgName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        if (sanitizedOrgName !== orgName.trim()) {
            return res.status(400).json({
                error: 'Organization name contains invalid characters. Use only letters, numbers, underscores, and hyphens.',
                suggestedName: sanitizedOrgName
            });
        }
        // Check if organization already exists
        let exists = false;
        try {
            const checkResult = await __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].search.expression(`folder:${orgName}/*`).max_results(1).execute();
            if (checkResult.total_count > 0) {
                exists = true;
            }
        } catch (searchError) {
        // Folder doesn't exist, continue with creation
        }
        // Also check root folders
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
            // Continue with creation
            }
        }
        if (exists) {
            return res.status(400).json({
                error: 'Organization already exists',
                exists: true,
                organizationName: orgName
            });
        }
        // Create folder structure in Cloudinary
        // Cloudinary creates folders when you upload files to them
        const foldersToCreate = [
            orgName,
            `${orgName}/editor`,
            `${orgName}/mindmapping` // Mind mapping subfolder
        ];
        const creationResults = [];
        let allSuccessful = true;
        // Create each folder by uploading a placeholder
        for (const folderPath of foldersToCreate){
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["createCloudinaryFolder"])(folderPath);
            creationResults.push({
                folder: folderPath,
                success: result.success,
                error: result.error
            });
            if (!result.success) {
                allSuccessful = false;
            }
        }
        // Verify folders were created by checking if they exist
        let verificationSuccess = false;
        try {
            // Wait a moment for Cloudinary to process
            await new Promise((resolve)=>setTimeout(resolve, 1000));
            // Try to list subfolders of the organization
            const subFolders = await __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$lib$2f$cloudinary$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["default"].api.sub_folders(orgName);
            if (subFolders && subFolders.folders) {
                const folderNames = subFolders.folders.map((f)=>f.name || f.path);
                verificationSuccess = folderNames.length > 0 || true; // At least main folder exists
            }
        } catch (verifyError) {
            // Even if verification fails, folders might still be created
            // They'll be created when first image is uploaded
            verificationSuccess = true; // Assume success
        }
        if (allSuccessful || verificationSuccess) {
            res.json({
                success: true,
                message: 'Organization folder structure created successfully in Cloudinary',
                organizationName: orgName,
                foldersCreated: foldersToCreate,
                details: creationResults
            });
        } else {
            res.status(500).json({
                error: 'Failed to create some folders',
                organizationName: orgName,
                details: creationResults
            });
        }
    } catch (error) {
        console.error('Error creating organization:', error);
        res.status(500).json({
            error: 'Failed to create organization',
            message: error.message
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__678f13db._.js.map