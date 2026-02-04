"use client";

import { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, ChevronRight } from "lucide-react";
import axios from "axios";

export default function Terminal({ isOpen, onClose }) {
    const [history, setHistory] = useState([
        { type: "output", content: "Antigravity Terminal v1.0.0" },
        { type: "output", content: "Type 'help' for available commands or run any shell command." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const handleCommand = async (e) => {
        if (e.key === "Enter" && input.trim()) {
            const cmd = input.trim();
            setInput("");
            setHistory(prev => [...prev, { type: "command", content: cmd }]);

            if (cmd === "clear") {
                setHistory([]);
                return;
            }

            if (cmd === "help") {
                setHistory(prev => [...prev, { type: "output", content: "Available custom commands: clear, help. You can also run any standard shell commands like ls, pwd, git status, etc." }]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await axios.post("/api/terminal", { command: cmd });
                const { stdout, stderr } = response.data;

                if (stdout) {
                    setHistory(prev => [...prev, { type: "output", content: stdout }]);
                }
                if (stderr) {
                    setHistory(prev => [...prev, { type: "error", content: stderr }]);
                }
            } catch (error) {
                setHistory(prev => [...prev, { type: "error", content: error.message }]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <TerminalIcon size={14} style={{ color: "var(--accent-primary)" }} />
                    <span style={styles.title}>Terminal</span>
                </div>
                <div style={styles.headerRight}>
                    <button style={styles.headerBtn} onClick={onClose}><X size={14} /></button>
                </div>
            </div>

            <div style={styles.outputArea} ref={scrollRef} onClick={() => inputRef.current?.focus()}>
                {history.map((line, idx) => (
                    <div key={idx} style={{
                        ...styles.line,
                        color: line.type === "error" ? "#ff4d4d" : line.type === "command" ? "var(--accent-primary)" : "var(--text-secondary)"
                    }}>
                        {line.type === "command" && (
                            <span style={styles.prompt}><ChevronRight size={12} /></span>
                        )}
                        <pre style={styles.pre}>{line.content}</pre>
                    </div>
                ))}

                <div style={styles.inputLine}>
                    <span style={styles.prompt}><ChevronRight size={12} /></span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleCommand}
                        disabled={isLoading}
                        style={styles.input}
                        autoFocus
                    />
                    {isLoading && <div className="animate-pulse" style={styles.loader} />}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        height: "260px",
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-primary)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-mono)",
        zIndex: 20,
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        background: "rgba(0,0,0,0.2)",
        borderBottom: "1px solid var(--border-primary)",
    },
    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    title: {
        fontSize: "12px",
        fontWeight: "600",
        color: "var(--text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    headerRight: {
        display: "flex",
        gap: "8px",
    },
    headerBtn: {
        background: "transparent",
        border: "none",
        color: "var(--text-muted)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        padding: "2px",
    },
    outputArea: {
        flex: 1,
        overflow: "auto",
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    line: {
        display: "flex",
        gap: "8px",
        fontSize: "13px",
        lineHeight: "1.5",
    },
    pre: {
        margin: 0,
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
    },
    inputLine: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    prompt: {
        color: "var(--accent-primary)",
        display: "flex",
        alignItems: "center",
    },
    input: {
        flex: 1,
        background: "transparent",
        border: "none",
        outline: "none",
        color: "var(--text-primary)",
        fontSize: "13px",
        fontFamily: "inherit",
    },
    loader: {
        width: "6px",
        height: "14px",
        background: "var(--accent-primary)",
        borderRadius: "1px",
    }
};
