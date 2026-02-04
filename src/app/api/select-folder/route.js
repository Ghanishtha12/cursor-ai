import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
    try {
        console.log("Opening native folder picker...");
        // This script ensures the dialog appears even if the process is backgrounded
        const psScript = `
            Add-Type -AssemblyName System.Windows.Forms;
            $f = New-Object System.Windows.Forms.FolderBrowserDialog;
            $f.Description = 'Select Project Folder';
            $f.ShowNewFolderButton = $true;
            $t = New-Object System.Windows.Forms.Form -Property @{TopMost=$true};
            $res = $f.ShowDialog($t);
            if ($res -eq 'OK') { $f.SelectedPath }
            $t.Dispose();
        `.replace(/\s+/g, ' ').trim();

        const command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`;

        // Timeout of 2 minutes to give user time to select
        const { stdout, stderr } = await execAsync(command, { timeout: 120000 });

        if (stderr) console.error("PS Stderr:", stderr);

        const selectedPath = stdout.trim();
        console.log("Selected path:", selectedPath);

        if (!selectedPath) {
            return NextResponse.json({ cancelled: true });
        }

        return NextResponse.json({ path: selectedPath });
    } catch (error) {
        console.error("Picker Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
