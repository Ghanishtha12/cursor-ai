import { NextResponse } from "next/server";
import fs from "fs/promises";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get("path");

        if (!filePath) {
            return NextResponse.json({ error: "Missing path" }, { status: 400 });
        }

        const content = await fs.readFile(filePath, "utf-8");
        return NextResponse.json({ content });
    } catch (error) {
        console.error("Error reading file:", error);
        return NextResponse.json(
            { error: error.message || "Failed to read file" },
            { status: 500 }
        );
    }
}
