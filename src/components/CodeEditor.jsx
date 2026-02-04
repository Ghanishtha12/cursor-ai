"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { X, Circle, Loader2, Sparkles, ChevronRight, File } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const getLanguage = (fileName) => {
  const ext = fileName?.split(".").pop();
  const langMap = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    json: "json",
    css: "css",
    html: "html",
    md: "markdown",
    mjs: "javascript",
  };
  return langMap[ext] || "javascript";
};

export default function CodeEditor({
  file,
  openFiles = [],
  onCloseFile,
  onSelectFile,
  refreshTrigger,
  stagedChanges = {},
  onContentChange,
  onSave,
  unsavedChanges = {}
}) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cursorLine, setCursorLine] = useState(1);
  const displayFile = file || (openFiles.length > 0 ? openFiles[0] : null);
  const diagnostics = (displayFile && typeof window !== "undefined") ? (window.diagnostics?.[displayFile.path] || []) : [];

  useEffect(() => {
    const fetchContent = async () => {
      if (!displayFile || !displayFile.path) {
        setContent("// Select a file to view its contents");
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get(`/api/file-content?path=${encodeURIComponent(displayFile.path)}`);
        setContent(response.data.content);
      } catch (error) {
        console.error("Failed to fetch file content:", error);
        setContent(`// Error loading file: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [displayFile, refreshTrigger]);

  const handleTextChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (displayFile?.path) {
      onContentChange?.(displayFile.path, newContent);
    }
    updateCursorPos(e.target);
  };

  const updateCursorPos = (textarea) => {
    const textBefore = textarea.value.substring(0, textarea.selectionStart);
    const lineCount = textBefore.split("\n").length;
    setCursorLine(lineCount);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = e.target.value;

      const newVal = val.substring(0, start) + "  " + val.substring(end);
      setContent(newVal);
      if (displayFile?.path) {
        onContentChange?.(displayFile.path, newVal);
      }

      // Defer setting selection to next tick
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const stagedContent = displayFile && stagedChanges[displayFile.path];
  const manualContent = displayFile && unsavedChanges[displayFile.path];
  const isStaged = !!stagedContent;
  const finalContent = (isStaged ? stagedContent : (manualContent !== undefined ? manualContent : content)) || "";
  const isDirty = manualContent !== undefined;

  const language = displayFile ? getLanguage(displayFile.name) : "javascript";
  const tabs = openFiles;

  return (
    <div style={styles.container}>
      {/* Breadcrumbs */}
      {displayFile && (
        <div style={styles.breadcrumbs}>
          {displayFile.path.split(/[\\/]/).map((part, i, arr) => (
            <div key={i} style={styles.breadcrumbItem}>
              {i > 0 && <ChevronRight size={12} style={styles.breadcrumbSeparator} />}
              {i === arr.length - 1 && <File size={12} style={{ color: getLanguageColor(part), marginRight: 4 }} />}
              <span style={{ color: i === arr.length - 1 ? "var(--text-primary)" : "var(--text-muted)" }}>
                {part}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        {tabs.map((tab, idx) => {
          const hasStaged = stagedChanges[tab.path];
          return (
            <div
              key={idx}
              onClick={() => onSelectFile?.(tab)}
              style={{
                ...styles.tab,
                ...(tab.name === displayFile?.name ? styles.tabActive : {}),
              }}
            >
              <Circle
                size={8}
                style={{ color: getLanguageColor(tab.name) }}
                fill={hasStaged || unsavedChanges[tab.path] !== undefined ? "transparent" : "currentColor"}
                stroke={hasStaged ? "var(--accent-primary)" : unsavedChanges[tab.path] !== undefined ? "#f7df1e" : "none"}
                strokeWidth={hasStaged || unsavedChanges[tab.path] !== undefined ? 3 : 0}
              />
              <span>{tab.name}{unsavedChanges[tab.path] !== undefined ? "*" : ""}</span>
              {hasStaged && <div style={styles.stagedDot} />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile?.(tab);
                }}
                style={styles.closeTab}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor Content */}
      <div style={styles.editorWrapper}>
        {isLoading ? (
          <div style={styles.loadingWrapper}>
            <Loader2 className="animate-spin" size={24} />
            <span>Loading content...</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            {isStaged && (
              <div style={styles.stagedBanner}>
                <Sparkles size={14} style={{ color: "var(--accent-primary)" }} />
                <span>Proposed Changes (Applying these will overwrite manual edits)</span>
              </div>
            )}
            {isDirty && !isStaged && (
              <div style={{ ...styles.stagedBanner, background: "rgba(247, 223, 30, 0.05)", borderBottom: "1px solid #f7df1e", color: "#f7df1e" }}>
                <Circle size={10} fill="#f7df1e" />
                <span>Unsaved Changes - Press Ctrl+S to save</span>
              </div>
            )}
            <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
              <div style={styles.lineNumbers}>
                {finalContent.split("\n").map((_, idx) => {
                  const hasError = diagnostics.some(d => d.line === idx + 1);
                  return (
                    <div key={idx} style={{
                      ...styles.lineNumber,
                      color: hasError ? "#ff4d4d" : "var(--text-muted)",
                      fontWeight: hasError ? "bold" : "normal"
                    }}>
                      {idx + 1}
                    </div>
                  );
                })}
              </div>

              <div style={styles.editorContainer}>
                {/* Visual Layer (Syntax Highlighting) */}
                <div
                  style={{
                    ...styles.highlightLayer,
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <SyntaxHighlighter
                    language={language}
                    style={Object.entries(oneDark).reduce((acc, [key, value]) => {
                      const newValue = { ...value };
                      delete newValue.background;
                      delete newValue.backgroundColor;
                      acc[key] = newValue;
                      return acc;
                    }, {})}
                    showLineNumbers={false}
                    codeTagProps={{
                      style: {
                        fontFamily: "var(--font-mono)",
                        fontSize: "14px",
                        lineHeight: "1.6",
                        fontWeight: "400",
                      }
                    }}
                    customStyle={{
                      margin: 0,
                      padding: "16px",
                      background: "transparent",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      fontFamily: "var(--font-mono)",
                      pointerEvents: "none",
                      boxSizing: "border-box",
                      width: "100%",
                      fontWeight: "400",
                    }}
                  >
                    {finalContent}
                  </SyntaxHighlighter>

                  {/* Diagnostics Layer (Squiggles) */}
                  <div style={styles.diagnosticsOverlay}>
                    {finalContent.split("\n").map((line, idx) => {
                      const lineErrors = diagnostics.filter(d => d.line === idx + 1);
                      const isActive = cursorLine === idx + 1;

                      return (
                        <div key={idx} style={{
                          ...styles.errorLine,
                          background: isActive ? "rgba(255, 255, 255, 0.03)" : "transparent"
                        }}>
                          <div style={styles.squiggleContainer}>
                            {lineErrors.map((err, i) => (
                              <div key={i} title={err.message} style={styles.squiggle} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Input Layer (Textarea) */}
                <textarea
                  value={finalContent}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  onKeyUp={(e) => updateCursorPos(e.target)}
                  onClick={(e) => updateCursorPos(e.target)}
                  readOnly={isStaged}
                  spellCheck={false}
                  wrap="off"
                  style={styles.textarea}
                  onScroll={(e) => {
                    // Sync scroll between textarea and highlighting layer
                    const highlightLayer = e.target.previousSibling;
                    if (highlightLayer) {
                      highlightLayer.scrollTop = e.target.scrollTop;
                      highlightLayer.scrollLeft = e.target.scrollLeft;
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const getLanguageColor = (name) => {
  const ext = name.split(".").pop();
  const colors = {
    js: "#f7df1e",
    jsx: "#61dafb",
    json: "#cbcb41",
    css: "#264de4",
    md: "#083fa1",
    mjs: "#f7df1e",
  };
  return colors[ext] || "#8b949e";
};

const styles = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "transparent",
    minWidth: 0,
    zIndex: 5,
  },
  breadcrumbs: {
    display: "flex",
    alignItems: "center",
    padding: "8px 16px",
    background: "rgba(255, 255, 255, 0.02)",
    borderBottom: "1px solid var(--border-primary)",
    fontSize: "12px",
    gap: "4px",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  breadcrumbItem: {
    display: "flex",
    alignItems: "center",
  },
  breadcrumbSeparator: {
    margin: "0 4px",
    opacity: 0.3,
  },
  tabBar: {
    display: "flex",
    background: "var(--bg-primary)",
    borderBottom: "1px solid var(--border-primary)",
    overflowX: "auto",
    padding: "0 8px",
    gap: "4px",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    fontSize: "13px",
    color: "var(--text-secondary)",
    cursor: "pointer",
    borderTop: "1px solid transparent",
    borderLeft: "1px solid transparent",
    borderRight: "1px solid transparent",
    borderRadius: "8px 8px 0 0",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    whiteSpace: "nowrap",
    marginTop: "4px",
  },
  tabActive: {
    background: "transparent",
    color: "var(--text-primary)",
    borderTop: "1px solid var(--border-primary)",
    borderLeft: "1px solid var(--border-primary)",
    borderRight: "1px solid var(--border-primary)",
    boxShadow: "0 -4px 10px rgba(0, 0, 0, 0.3)",
  },
  closeTab: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: "2px",
    borderRadius: "4px",
    transition: "all 0.2s ease",
    marginLeft: "4px",
  },
  editorWrapper: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
    background: "transparent",
  },
  lineNumbers: {
    padding: "16px 0",
    paddingLeft: "16px",
    paddingRight: "12px",
    background: "transparent",
    borderRight: "1px solid var(--border-primary)",
    userSelect: "none",
    textAlign: "right",
    minWidth: "54px",
  },
  lineNumber: {
    fontSize: "12px",
    lineHeight: "1.6",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    opacity: 0.5,
  },
  editorContainer: {
    position: "relative",
    flex: 1,
    overflow: "hidden",
  },
  highlightLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    zIndex: 1,
  },
  textarea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: 0,
    padding: "16px",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "transparent",
    caretColor: "#fff",
    fontSize: "14px",
    lineHeight: "1.6",
    fontFamily: "var(--font-mono)",
    fontWeight: "400",
    letterSpacing: "normal",
    resize: "none",
    whiteSpace: "pre",
    overflow: "auto",
    zIndex: 2,
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
  },
  loadingWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    color: "var(--text-muted)",
    fontSize: "14px",
    background: "transparent",
  },
  stagedBanner: {
    padding: "10px 20px",
    background: "rgba(0, 163, 255, 0.08)",
    borderBottom: "1px solid var(--accent-primary)",
    color: "var(--accent-primary)",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 4px 15px rgba(0, 163, 255, 0.1)",
    animation: "animate-shimmer 2s infinite linear",
  },
  stagedDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "var(--accent-gradient)",
    boxShadow: "0 0 10px var(--accent-primary)",
  },
  diagnosticsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    padding: "16px",
    paddingTop: "16px", // Match SyntaxHighlighter padding
  },
  emptyLine: {
    height: "1.6em", // Match line-height
  },
  errorLine: {
    height: "1.6em",
    position: "relative",
  },
  squiggleContainer: {
    position: "absolute",
    bottom: 2,
    left: 0,
    right: 0,
    height: 4,
  },
  squiggle: {
    width: "100%",
    height: "100%",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='3' viewBox='0 0 6 3'%3E%3Cpath d='M0 2 Q1.5 0 3 2 Q4.5 3 6 2' fill='none' stroke='%23ff4d4d' stroke-width='0.7'/%3E%3C/svg%3E")`,
    backgroundRepeat: "repeat-x",
  }
};
