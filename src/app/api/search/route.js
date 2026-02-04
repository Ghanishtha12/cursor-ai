import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

async function searchInDirectory(dir, query, results = []) {
    const files = await fs.readdir(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        // Skip hidden and ignored folders
        if (file.name.startsWith(".") || ["node_modules", ".next", "dist", "out"].includes(file.name)) {
            continue;
        }

        if (file.isDirectory()) {
            await searchInDirectory(fullPath, query, results);
        } else {
            try {
                const content = await fs.readFile(fullPath, "utf-8");
                const lines = content.split("\n");
                lines.forEach((line, index) => {
                    if (line.toLowerCase().includes(query.toLowerCase())) {
                        results.push({
                            path: fullPath,
                            fileName: file.name,
                            line: index + 1,
                            content: line.trim()
                        });
                    }
                });
            } catch (err) {
                // Skip files that can't be read (binary, etc)
            }
        }
    }
    return results;
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    try {
        const rootDir = process.cwd();
        const results = await searchInDirectory(rootDir, query);

        // Truncate absolute paths to relative for the UI
        const relativeResults = results.map(res => ({
            ...res,
            path: path.relative(rootDir, res.path)
        }));

        return NextResponse.json(relativeResults);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
