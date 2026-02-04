import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request) {
    try {
        const { path: filePath, content } = await request.json();

        if (!filePath || content === undefined) {
            return NextResponse.json(
                { success: false, error: "Missing path or content" },
                { status: 400 }
            );
        }

        const rootDir = process.cwd();
        const absolutePath = filePath.startsWith(rootDir) ? filePath : path.join(rootDir, filePath);

        // Security check
        if (!absolutePath.startsWith(rootDir)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        await fs.writeFile(absolutePath, content, "utf-8");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving file:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
