import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

async function getFileTree(dir, basePath) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const result = [];

    for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;

        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(basePath, fullPath);

        if (entry.isDirectory()) {
            result.push({
                name: entry.name,
                type: "folder",
                path: fullPath,
                children: await getFileTree(fullPath, basePath),
            });
        } else {
            result.push({
                name: entry.name,
                type: "file",
                path: fullPath,
                language: entry.name.split(".").pop(),
            });
        }
    }
    return result;
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const requestedPath = searchParams.get("path");
        const rootDir = requestedPath || process.cwd();

        const tree = await getFileTree(rootDir, rootDir);
        return NextResponse.json({ tree, rootDir });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
