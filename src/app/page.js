"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import FileExplorer from "@/components/FileExplorer";
import CodeEditor from "@/components/CodeEditor";
import ChatPanel from "@/components/ChatPanel";
import CommandPalette from "@/components/CommandPalette";
import Terminal from "@/components/Terminal";
import SearchPanel from "@/components/SearchPanel";
import { Sparkles } from "lucide-react";

export default function Home() {
  const [activePanel, setActivePanel] = useState("explorer");
  const [chatHistoryOpen, setChatHistoryOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [stagedChanges, setStagedChanges] = useState({}); // path -> content
  const [diagnostics, setDiagnostics] = useState({}); // path -> array of diagnostics
  const [unsavedChanges, setUnsavedChanges] = useState({}); // path -> current manual content

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K for command palette
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setActivePanel(activePanel ? null : "explorer");
      }
      // Ctrl/Cmd + J to toggle terminal
      if ((e.ctrlKey || e.metaKey) && e.key === "j") {
        e.preventDefault();
        setTerminalOpen(prev => !prev);
      }
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveFile();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Export diagnostics to window for CodeEditor access
    window.diagnostics = diagnostics;

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePanel, diagnostics]);

  const runLint = async (filePath) => {
    try {
      const res = await axios.post("/api/lint", { path: filePath });
      setDiagnostics(prev => ({ ...prev, [filePath]: res.data.diagnostics }));
    } catch (e) {
      console.error("Lint failed", e);
    }
  };

  // Run lint when selected file changes
  useEffect(() => {
    if (selectedFile?.path) {
      runLint(selectedFile.path);
    }
  }, [selectedFile, refreshTrigger]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    // Add to open files if not already open
    if (!openFiles.find((f) => f.name === file.name)) {
      setOpenFiles([...openFiles, file]);
    }
  };

  const handleSaveFile = async (contentToSave) => {
    const fileToSave = selectedFile;
    if (!fileToSave) return;

    const content = contentToSave || unsavedChanges[fileToSave.path];
    if (content === undefined) return;

    try {
      await axios.post("/api/save-file", {
        path: fileToSave.path,
        content: content
      });

      // Clear unsaved state
      setUnsavedChanges(prev => {
        const next = { ...prev };
        delete next[fileToSave.path];
        return next;
      });

      // Trigger lint after save
      runLint(fileToSave.path);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert(`Failed to save file: ${err.message}`);
    }
  };

  const handleContentChange = (path, newContent) => {
    setUnsavedChanges(prev => ({ ...prev, [path]: newContent }));
  };

  const handleCloseFile = (file) => {
    const newFiles = openFiles.filter((f) => f.name !== file.name);
    setOpenFiles(newFiles);
    if (selectedFile?.name === file.name) {
      setSelectedFile(newFiles[newFiles.length - 1] || null);
    }
  };

  const handleSendMessage = async (content) => {
    if (!content.trim()) return;
    const userMessage = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Collect context from open files
      let autoContext = "";
      if (openFiles.length > 0) {
        autoContext = "## Open Files Context:\n";
        for (const f of openFiles) {
          try {
            const filePath = f.path || f.name;
            const res = await axios.get(`/api/file-content?path=${encodeURIComponent(filePath)}`);
            const fileDiagnostics = diagnostics[filePath] || [];

            autoContext += `\n### File: ${f.name}\n### Path: ${filePath}\n`;
            if (fileDiagnostics.length > 0) {
              autoContext += `### Diagnostics:\n${JSON.stringify(fileDiagnostics, null, 2)}\n`;
            }
            autoContext += `\`\`\`\n${res.data.content}\n\`\`\`\n`;
          } catch (e) { /* ignore */ }
        }
      }

      const response = await axios.post("/api/ask-ai", {
        message: content,
        context: autoContext || (selectedFile ? `Current file: ${selectedFile.name}\nPath: ${selectedFile.path || selectedFile.name}` : null),
      });

      const reply = response.data.reply;

      // Parse for file changes
      const fileChangeRegex = /<file_change path="([^"]+)">([\s\S]*?)<\/file_change>/g;
      let match;
      const changes = [];

      while ((match = fileChangeRegex.exec(reply)) !== null) {
        const path = match[1];
        const content = match[2].trim();
        changes.push({ path, content });

        // Stage the change for preview in the editor
        setStagedChanges(prev => ({ ...prev, [path]: content }));
      }

      const aiMessage = {
        role: "assistant",
        content: reply,
        pendingChanges: changes // These will render with "Apply" buttons in the ChatPanel
      };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      const errorMessage = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyChange = async (messageIdx, changeIdx) => {
    const message = messages[messageIdx];
    const change = message.pendingChanges[changeIdx];

    try {
      await axios.post("/api/apply-changes", change);

      // Update state to mark as applied
      const newMessages = [...messages];
      const newPendingChanges = [...message.pendingChanges];
      newPendingChanges[changeIdx] = { ...change, applied: true, reverted: false };
      newMessages[messageIdx] = { ...message, pendingChanges: newPendingChanges };
      setMessages(newMessages);

      // Refresh file explorer
      setRefreshTrigger(prev => prev + 1);

      // Clear staged change for this file
      setStagedChanges(prev => {
        const next = { ...prev };
        delete next[change.path];
        return next;
      });
    } catch (err) {
      alert(`Failed to apply change: ${err.message}`);
    }
  };

  const handleUndoChange = async (messageIdx, changeIdx) => {
    const message = messages[messageIdx];
    const change = message.pendingChanges[changeIdx];

    try {
      const response = await axios.post("/api/undo-change", { path: change.path });
      if (!response.data.success) throw new Error(response.data.error);

      // Update message state
      const newMessages = [...messages];
      const newPendingChanges = [...message.pendingChanges];
      newPendingChanges[changeIdx] = { ...change, applied: false, reverted: true };
      newMessages[messageIdx] = { ...message, pendingChanges: newPendingChanges };
      setMessages(newMessages);

      // Refresh everything
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert(`Failed to undo change: ${err.message}`);
    }
  };

  const handleDeclineChange = (messageIdx, changeIdx) => {
    const message = messages[messageIdx];
    const change = message.pendingChanges[changeIdx];
    const newMessages = [...messages];
    const newPendingChanges = [...message.pendingChanges];
    newPendingChanges[changeIdx] = { ...change, declined: true };
    newMessages[messageIdx] = { ...message, pendingChanges: newPendingChanges };
    setMessages(newMessages);

    // Clear staged change
    setStagedChanges(prev => {
      const next = { ...prev };
      delete next[change.path];
      return next;
    });
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleCommand = (command, query) => {
    switch (command.id) {
      case "ask-ai":
        if (query.trim()) {
          handleSendMessage(query);
        }
        break;
      case "explain":
        handleSendMessage(
          `Explain this code in detail: ${selectedFile?.name || "the current code"}`
        );
        break;
      case "fix":
        handleSendMessage(
          `Find and fix any errors in: ${selectedFile?.name || "the current code"}`
        );
        break;
      case "refactor":
        handleSendMessage(
          `Suggest refactoring improvements for: ${selectedFile?.name || "the current code"}`
        );
        break;
      default:
        break;
    }
  };

  return (
    <main style={styles.container}>
      {/* Left Sidebar */}
      <Sidebar
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        onNewChat={handleNewChat}
        chatHistoryOpen={chatHistoryOpen}
        setChatHistoryOpen={setChatHistoryOpen}
        terminalOpen={terminalOpen}
        setTerminalOpen={setTerminalOpen}
      />

      <div style={styles.mainContent}>
        <div style={styles.topRegion}>
          {/* Left Panel Sidebar Area */}
          {activePanel === "explorer" && (
            <FileExplorer
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile?.name}
              refreshTrigger={refreshTrigger}
            />
          )}
          {activePanel === "search" && (
            <SearchPanel
              onFileSelect={handleFileSelect}
            />
          )}

          {/* Code Editor Area */}
          <div style={styles.editorWrapper}>
            <CodeEditor
              file={selectedFile}
              openFiles={openFiles}
              onCloseFile={handleCloseFile}
              onSelectFile={(file) => setSelectedFile(file)}
              refreshTrigger={refreshTrigger}
              stagedChanges={stagedChanges}
              onContentChange={handleContentChange}
              onSave={handleSaveFile}
              unsavedChanges={unsavedChanges}
            />
          </div>

          {/* AI Chat Panel */}
          {chatHistoryOpen && (
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              onApplyChange={handleApplyChange}
              onDeclineChange={handleDeclineChange}
              onUndoChange={handleUndoChange}
              isLoading={isLoading}
              onClearChat={handleClearChat}
            />
          )}
        </div>

        {/* Bottom Terminal */}
        <Terminal
          isOpen={terminalOpen}
          onClose={() => setTerminalOpen(false)}
        />

        {/* Status Bar */}
        <div style={styles.statusBar}>
          <div style={styles.statusLeft}>
            <div style={styles.statusItem}>
              <Sparkles size={12} style={{ color: "var(--accent-primary)" }} />
              <span>AI Ready</span>
            </div>
            {selectedFile && (
              <div style={styles.statusItem}>
                <span style={{ opacity: 0.5 }}>{selectedFile.path}</span>
              </div>
            )}
          </div>
          <div style={styles.statusRight}>
            <div style={styles.statusItem}>
              <span>UTF-8</span>
            </div>
            <div style={styles.statusItem}>
              <span>JavaScript</span>
            </div>
            <div style={{ ...styles.statusItem, background: "var(--accent-primary)", color: "#000", fontWeight: "bold", padding: "0 10px" }}>
              <span>PRO</span>
            </div>
          </div>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onCommand={handleCommand}
      />
    </main>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    background: "var(--bg-darker)",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  topRegion: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
  },
  editorWrapper: {
    flex: 1,
    height: "100%",
    overflow: "hidden",
  },
  statusBar: {
    height: "26px",
    background: "var(--bg-primary)",
    borderTop: "1px solid var(--border-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px",
    fontSize: "11px",
    color: "var(--text-secondary)",
    zIndex: 100,
  },
  statusLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  statusRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  statusItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    height: "26px",
    padding: "0 4px",
    cursor: "default",
    transition: "background 0.2s",
    "&:hover": {
      background: "var(--bg-active)",
    }
  }
};
