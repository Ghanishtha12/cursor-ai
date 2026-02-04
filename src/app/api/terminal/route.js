import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function POST(request) {
    try {
        const { command } = await request.json();

        if (!command) {
            return NextResponse.json({ error: "No command provided" }, { status: 400 });
        }

        // Security: In a real app, you'd want to restrict what commands can be run
        // For this demo, we'll run it in the project root
        const { stdout, stderr } = await execPromise(command, {
            cwd: process.cwd(),
            env: { ...process.env, COLUMNS: 80 }
        });

        return NextResponse.json({
            stdout: stdout || "",
            stderr: stderr || ""
        });
    } catch (error) {
        return NextResponse.json({
            stdout: error.stdout || "",
            stderr: error.stderr || error.message
        }, { status: 200 }); // Return 200 so UI can show the error in the terminal
    }
}
