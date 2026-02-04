"use client";

import { useState, useEffect, useRef } from "react";
import {
    Search,
    Sparkles,
    FileCode,
    Settings,
    MessageSquare,
    Command,
    ArrowRight
} from "lucide-react";

const commands = [
    { id: "ask-ai", label: "Ask AI", icon: Sparkles, shortcut: "Enter", category: "AI" },
    { id: "explain", label: "Explain Code", icon: MessageSquare, category: "AI" },
    { id: "fix", label: "Fix Errors", icon: Sparkles, category: "AI" },
    { id: "refactor", label: "Refactor Code", icon: FileCode, category: "AI" },
    { id: "open-file", label: "Open File", icon: FileCode, shortcut: "Ctrl+P", category: "Navigation" },
    { id: "settings", label: "Open Settings", icon: Settings, shortcut: "Ctrl+,", category: "General" },
];

export default function CommandPalette({ isOpen, onClose, onCommand }) {
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            switch (e.key) {
                case "Escape":
                    onClose();
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex(i => Math.max(i - 1, 0));
                    break;
                case "Enter":
                    if (filteredCommands[selectedIndex]) {
                        onCommand(filteredCommands[selectedIndex], query);
                        onClose();
                    } else if (query.trim()) {
                        // If no command selected but query exists, treat as AI ask
                        onCommand({ id: "ask-ai", label: "Ask AI" }, query);
                        onClose();
                    }
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, selectedIndex, filteredCommands, query, onCommand, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div style={styles.overlay} onClick={onClose} />

            {/* Modal */}
            <div style={styles.container} className="animate-scaleIn">
                {/* Search Input */}
                <div style={styles.inputWrapper}>
                    <Search size={18} style={{ color: "var(--text-muted)" }} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder="Type a command or ask AI..."
                        style={styles.input}
                    />
                    <div style={styles.shortcut}>
                        <Command size={12} />
                        <span>K</span>
                    </div>
                </div>

                {/* Commands List */}
                <div style={styles.commandsList}>
                    {filteredCommands.length > 0 ? (
                        <>
                            {filteredCommands.map((cmd, idx) => {
                                const Icon = cmd.icon;
                                return (
                                    <button
                                        key={cmd.id}
                                        onClick={() => {
                                            onCommand(cmd, query);
                                            onClose();
                                        }}
                                        style={{
                                            ...styles.commandItem,
                                            ...(idx === selectedIndex ? styles.commandItemActive : {}),
                                        }}
                                    >
                                        <Icon size={18} style={styles.commandIcon} />
                                        <span style={styles.commandLabel}>{cmd.label}</span>
                                        <span style={styles.commandCategory}>{cmd.category}</span>
                                        {cmd.shortcut && (
                                            <span style={styles.commandShortcut}>{cmd.shortcut}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </>
                    ) : query.trim() ? (
                        <button
                            onClick={() => {
                                onCommand({ id: "ask-ai", label: "Ask AI" }, query);
                                onClose();
                            }}
                            style={{
                                ...styles.commandItem,
                                ...styles.commandItemActive,
                            }}
                        >
                            <Sparkles size={18} style={{ color: "var(--accent-primary)" }} />
                            <span style={styles.commandLabel}>Ask AI: "{query}"</span>
                            <ArrowRight size={16} style={{ marginLeft: "auto", color: "var(--text-muted)" }} />
                        </button>
                    ) : (
                        <div style={styles.noResults}>
                            <p>No commands found</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <span><kbd style={styles.kbd}>↑↓</kbd> Navigate</span>
                    <span><kbd style={styles.kbd}>↵</kbd> Select</span>
                    <span><kbd style={styles.kbd}>Esc</kbd> Close</span>
                </div>
            </div>
        </>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
    },
    container: {
        position: "fixed",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "560px",
        maxWidth: "90vw",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-primary)",
        borderRadius: "16px",
        boxShadow: "var(--shadow-lg)",
        overflow: "hidden",
        zIndex: 1001,
    },
    inputWrapper: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px 20px",
        borderBottom: "1px solid var(--border-primary)",
    },
    input: {
        flex: 1,
        background: "transparent",
        border: "none",
        outline: "none",
        color: "var(--text-primary)",
        fontSize: "16px",
    },
    shortcut: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        background: "var(--bg-tertiary)",
        borderRadius: "6px",
        color: "var(--text-muted)",
        fontSize: "12px",
    },
    commandsList: {
        maxHeight: "320px",
        overflow: "auto",
        padding: "8px",
    },
    commandItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        padding: "12px 14px",
        background: "transparent",
        border: "none",
        borderRadius: "10px",
        color: "var(--text-primary)",
        fontSize: "14px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.1s ease",
    },
    commandItemActive: {
        background: "var(--bg-active)",
    },
    commandIcon: {
        color: "var(--text-secondary)",
        flexShrink: 0,
    },
    commandLabel: {
        flex: 1,
    },
    commandCategory: {
        fontSize: "12px",
        color: "var(--text-muted)",
    },
    commandShortcut: {
        fontSize: "12px",
        padding: "3px 8px",
        background: "var(--bg-tertiary)",
        borderRadius: "5px",
        color: "var(--text-muted)",
    },
    noResults: {
        padding: "32px",
        textAlign: "center",
        color: "var(--text-muted)",
    },
    footer: {
        display: "flex",
        alignItems: "center",
        gap: "20px",
        padding: "12px 20px",
        borderTop: "1px solid var(--border-primary)",
        fontSize: "12px",
        color: "var(--text-muted)",
    },
    kbd: {
        display: "inline-block",
        padding: "2px 6px",
        background: "var(--bg-tertiary)",
        borderRadius: "4px",
        marginRight: "4px",
    },
};
