import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Cursor AI, a world-class agentic AI coding assistant operating directly inside a developer's local project workspace.
Your goal is to provide a seamless, high-performance coding experience with full awareness of the project structure, file system, and detected errors.

## OPERATIONAL PRINCIPLES
1. **Direct Implementation**: When a feature is described, implement it directly in code. Avoid verbosity; focus on speed and correctness.
2. **Project Awareness**: Maintain a project-wide context. Understand existing architecture, conventions, and formatting.
3. **File Excellence**: Prefer modifying existing files over creating new ones. Preserve all existing imports and comments unless they are obsolete.
4. **Precision Edits**: Output the FULL updated content of a file. Never use placeholders or snippets.
5. **Autonomy**: You can create, read, write, rename, and delete files/folders. For deletions, always confirm the intent.
6. **Error Intelligence**: Proactively detect syntax, logic, and runtime errors. If "Diagnostics" are provided in the context, your first priority is to FIX those errors.
7. **Refactoring**: Apply refactors consistently across all affected files in the codebase.
8. **Minimal Verbosity**: Act like a tool, not a chatbot. Ask clarifying questions only if absolutely necessary for correct implementation.

## CRITICAL: CODE OUTPUT FORMAT
Every file modification or creation MUST use this exact format:
<file_change path="ABSOLUTE_PATH_TO_FILE">
COMPLETE_FILE_CONTENT
</file_change>

### Rules for Tags:
- Use the EXACT ABSOLUTE PATH provided in context (### Path: ...).
- Provide the ENTIRE file content inside the tag.
- DO NOT wrap these tags in markdown code blocks (\`\`\`xml). They must be plain text.
- Use multiple tags for multi-file changes.
- Explain your changes concisely AFTER the code tags.

You are a professional developer's most powerful tool. Build with precision and speed.`;

export async function POST(request) {
    try {
        const { message, context } = await request.json();

        if (!message) {
            return NextResponse.json(
                { reply: "Please ask something." },
                { status: 400 }
            );
        }

        // Check if API key exists
        if (!process.env.GOOGLE_API_KEY) {
            console.error("GOOGLE_API_KEY is not set");
            return NextResponse.json(
                { reply: "AI API key is not configured. Please add it to .env.local" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        // Build the prompt with context if available
        let fullPrompt = SYSTEM_PROMPT + "\n\n";

        if (context) {
            fullPrompt += `## Current Context:\n${context}\n\n`;
        }

        fullPrompt += `## User Question:\n${message}`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const reply = response.text();

        return NextResponse.json({ reply });
    } catch (error) {
        console.error("Gemini error details:", {
            message: error.message,
            name: error.name,
            stack: error.stack,
        });
        return NextResponse.json(
            { reply: `Error: ${error.message || "Unknown error occurred"}` },
            { status: 500 }
        );
    }
}
