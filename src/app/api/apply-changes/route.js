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

        // Ensure the directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });

        // Backup existing file if it exists
        try {
            const exists = await fs.access(filePath).then(() => true).catch(() => false);
            if (exists) {
                const backupPath = `${filePath}.bak`;
                await fs.copyFile(filePath, backupPath);
            }
        } catch (err) {
            console.warn("Could not create backup:", err);
        }

        await fs.writeFile(filePath, content, "utf-8");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error applying changes:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
