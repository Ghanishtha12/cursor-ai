import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";

/**
 * Poor man's linter using eslint directly
 */
export async function POST(request) {
    try {
        const { path: filePath } = await request.json();

        if (!filePath) {
            return NextResponse.json({ error: "Missing path" }, { status: 400 });
        }

        const rootDir = process.cwd();
        const absolutePath = filePath.startsWith(rootDir) ? filePath : path.join(rootDir, filePath);

        // Run eslint on the file
        // Note: Using --format json to get machine-readable output
        return new Promise((resolve) => {
            exec(`npx eslint "${absolutePath}" --format json`, (error, stdout, stderr) => {
                try {
                    const results = JSON.parse(stdout || "[]");
                    const fileResults = results[0] || { messages: [] };

                    // Map to a simpler format for our UI
                    const diagnostics = fileResults.messages.map(msg => ({
                        line: msg.line,
                        column: msg.column,
                        severity: msg.severity === 2 ? 'error' : 'warning',
                        message: msg.message,
                        ruleId: msg.ruleId
                    }));

                    resolve(NextResponse.json({ diagnostics }));
                } catch (parseError) {
                    // If eslint fails to run or output invalid JSON, return empty but log
                    console.error("Linter error:", parseError, stdout, stderr);
                    resolve(NextResponse.json({ diagnostics: [], error: "Linter failed to parse" }));
                }
            });
        });

    } catch (error) {
        console.error("Lint route error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
