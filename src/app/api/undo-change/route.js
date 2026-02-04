import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request) {
    try {
        const { path: filePath } = await request.json();

        if (!filePath) {
            return NextResponse.json(
                { success: false, error: "Missing path" },
                { status: 400 }
            );
        }

        const backupPath = `${filePath}.bak`;

        // Check if backup exists
        const backupExists = await fs.access(backupPath).then(() => true).catch(() => false);

        if (!backupExists) {
            return NextResponse.json(
                { success: false, error: "No backup found to restore" },
                { status: 404 }
            );
        }

        // Restore backup
        await fs.rename(backupPath, filePath);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error undoing changes:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
