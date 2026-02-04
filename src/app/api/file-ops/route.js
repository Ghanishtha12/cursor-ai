import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request) {
    try {
        const { action, path: targetPath, name, type } = await request.json();
        const rootDir = process.cwd();
        const absolutePath = targetPath.startsWith(rootDir)
            ? targetPath
            : path.join(rootDir, targetPath);

        // Security: Prevent accessing files outside of rootDir
        if (!absolutePath.startsWith(rootDir)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        switch (action) {
            case "create":
                if (type === "folder") {
                    await fs.mkdir(path.join(absolutePath, name), { recursive: true });
                } else {
                    await fs.writeFile(path.join(absolutePath, name), "", "utf-8");
                }
                break;
            case "delete":
                const stats = await fs.stat(absolutePath);
                if (stats.isDirectory()) {
                    await fs.rm(absolutePath, { recursive: true, force: true });
                } else {
                    await fs.unlink(absolutePath);
                }
                break;
            case "rename":
                const newPath = path.join(path.dirname(absolutePath), name);
                await fs.rename(absolutePath, newPath);
                break;
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("File operation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
