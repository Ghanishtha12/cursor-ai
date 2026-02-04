# Cursor AI - Intelligent Code Editor

A premium, AI-powered IDE interface built with Next.js, featuring real-time AI assistance, an integrated code editor, and a sleek, modern UI.

## ✨ Features

- **🤖 AI Chat Panel**: Interactive chat interface for coding assistance, explanations, and automated refactoring.
- **📝 Integrated Code Editor**: Multi-tab editor with syntax highlighting, diagnostics, and unsaved changes tracking.
- **🔍 Global Search**: Powerful search panel to find files and content across the project.
- **📂 File Explorer**: Intuitive file management with real-time updates and status indicators.
- **⌨️ Command Palette**: Quick access to all IDE functions via `Ctrl + K`.
- **📟 Terminal**: Built-in terminal simulation for continuous development workflow.
- **🎨 Premium UI**: Modern aesthetic with glassmorphism, smooth transitions, and a responsive layout.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **AI Models**: Google Gemini 1.5 Pro & OpenAI GPT-4
- **Styling**: Tailwind CSS & CSS Modules
- **Icons**: Lucide React
- **Syntax Highlighting**: React Syntax Highlighter
- **HTTP Client**: Axios

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.x or later
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ghanishtha12/dashboard.git
   cd cursor-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file and add your AI API keys:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
   OPENAI_API_KEY=your_openai_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the IDE in action.

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Open Command Palette |
| `Ctrl + B` / `Cmd + B` | Toggle Sidebar |
| `Ctrl + J` / `Cmd + J` | Toggle Terminal |
| `Ctrl + S` / `Cmd + S` | Save Active File |

## 🧪 Verification

To ensure code quality, you can run the linting script:
```bash
node verify-lint.js
```

## 📄 License

This project is private and intended for internal use.
