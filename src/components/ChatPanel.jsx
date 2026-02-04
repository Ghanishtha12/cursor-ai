"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Copy, Check, User, Bot, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const suggestedPrompts = [
    "Explain this code",
    "Fix the bug in my code",
    "Write unit tests",
    "Optimize performance",
    "Add TypeScript types",
    "Refactor this function",
];

function CodeBlock({ children, className }) {
    const [copied, setCopied] = useState(false);
    const language = className?.replace("language-", "") || "text";

    const handleCopy = async () => {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={codeBlockStyles.container}>
            <div style={codeBlockStyles.header}>
                <span style={codeBlockStyles.language}>{language}</span>
                <button onClick={handleCopy} style={codeBlockStyles.copyButton}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
            </div>
            <SyntaxHighlighter
                language={language}
                style={oneDark}
                customStyle={{
                    margin: 0,
                    padding: "16px",
                    borderRadius: "0 0 8px 8px",
                    fontSize: "13px",
                }}
            >
                {children}
            </SyntaxHighlighter>
        </div>
    );
}

function Message({ message, isUser, onApplyChange, onDeclineChange, onUndoChange, messageIdx }) {
    const hasChanges = !isUser && message.pendingChanges && message.pendingChanges.length > 0;

    return (
        <div style={{
            ...styles.message,
            ...(isUser ? styles.userMessage : styles.aiMessage),
        }}>
            <div style={styles.messageAvatar}>
                {isUser ? (
                    <User size={18} />
                ) : (
                    <Sparkles size={18} style={{ color: "var(--accent-primary)" }} />
                )}
            </div>
            <div style={styles.messageContent}>
                <div style={styles.messageHeader}>
                    <span style={styles.messageSender}>
                        {isUser ? "You" : "Cursor AI"}
                    </span>
                </div>
                <div className="markdown-content" style={styles.messageText}>
                    {isUser ? (
                        <p>{message.content}</p>
                    ) : (
                        <ReactMarkdown
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    if (!inline && className) {
                                        return (
                                            <CodeBlock className={className}>
                                                {String(children).replace(/\n$/, "")}
                                            </CodeBlock>
                                        );
                                    }
                                    return <code className={className} {...props}>{children}</code>;
                                },
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    )}
                </div>
                {hasChanges && (
                    <div style={styles.changesContainer}>
                        <div style={styles.changesHeader}>
                            <Sparkles size={14} style={{ color: "var(--accent-primary)" }} />
                            <span>Proposed Changes</span>
                        </div>
                        {message.pendingChanges.map((change, cIdx) => (
                            <div key={cIdx} style={styles.changeItem}>
                                <div style={styles.changeFileInfo}>
                                    <span style={styles.changePath}>{change.path.split(/[\\/]/).pop()}</span>
                                    <span style={styles.changeFullPath}>{change.path}</span>
                                </div>
                                <div style={styles.changeActions}>
                                    {change.applied ? (
                                        <div style={styles.buttonGroup}>
                                            <span style={styles.appliedStatus}>
                                                <Check size={14} /> Applied
                                            </span>
                                            <button
                                                onClick={() => onUndoChange(messageIdx, cIdx)}
                                                style={styles.undoButton}
                                            >
                                                Undo
                                            </button>
                                        </div>
                                    ) : change.reverted ? (
                                        <span style={styles.revertedStatus}>Reverted</span>
                                    ) : change.declined ? (
                                        <span style={styles.declinedStatus}>Declined</span>
                                    ) : (
                                        <div style={styles.buttonGroup}>
                                            <button
                                                onClick={() => onDeclineChange(messageIdx, cIdx)}
                                                style={styles.declineButton}
                                            >
                                                Decline
                                            </button>
                                            <button
                                                onClick={() => onApplyChange(messageIdx, cIdx)}
                                                style={styles.applyButton}
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function TypingIndicator() {
    return (
        <div style={{ ...styles.message, ...styles.aiMessage }}>
            <div style={styles.messageAvatar}>
                <Sparkles size={18} style={{ color: "var(--accent-primary)" }} />
            </div>
            <div style={styles.messageContent}>
                <div style={styles.messageHeader}>
                    <span style={styles.messageSender}>Cursor AI</span>
                </div>
                <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    );
}

export default function ChatPanel({
    messages,
    onSendMessage,
    onApplyChange,
    onDeclineChange,
    onUndoChange,
    isLoading,
    onClearChat
}) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSendMessage(input.trim());
        setInput("");
    };

    const handlePromptClick = (prompt) => {
        setInput(prompt);
        inputRef.current?.focus();
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerTitle}>
                    <Sparkles size={18} style={{ color: "var(--accent-primary)" }} />
                    <span>AI Assistant</span>
                </div>
                {messages.length > 0 && (
                    <button onClick={onClearChat} style={styles.clearButton} title="Clear chat">
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div style={styles.messages}>
                {messages.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>
                            <Sparkles size={48} />
                        </div>
                        <h3 style={styles.emptyTitle}>How can I help you?</h3>
                        <p style={styles.emptySubtitle}>
                            Ask me anything about your code
                        </p>

                        <div style={styles.suggestedPrompts}>
                            {suggestedPrompts.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handlePromptClick(prompt)}
                                    style={styles.promptButton}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => (
                            <Message
                                key={idx}
                                messageIdx={idx}
                                message={msg}
                                isUser={msg.role === "user"}
                                onApplyChange={onApplyChange}
                                onDeclineChange={onDeclineChange}
                                onUndoChange={onUndoChange}
                            />
                        ))}
                        {isLoading && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} style={styles.inputContainer}>
                <div style={styles.inputWrapper}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask Cursor AI..."
                        style={styles.input}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        style={{
                            ...styles.sendButton,
                            opacity: !input.trim() || isLoading ? 0.5 : 1,
                        }}
                    >
                        <Send size={18} />
                    </button>
                </div>
                <p style={styles.hint}>
                    Press Enter to send • Ctrl+K for commands
                </p>
            </form>
        </div>
    );
}

const styles = {
    container: {
        width: "440px",
        height: "100%",
        background: "var(--bg-glass)",
        backdropFilter: "blur(20px)",
        borderLeft: "1px solid var(--border-primary)",
        display: "flex",
        flexDirection: "column",
        zIndex: 10,
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 24px",
        borderBottom: "1px solid var(--border-primary)",
        background: "rgba(255, 255, 255, 0.02)",
    },
    headerTitle: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontWeight: "700",
        fontSize: "16px",
        letterSpacing: "-0.2px",
    },
    clearButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "34px",
        height: "34px",
        background: "transparent",
        border: "none",
        borderRadius: "10px",
        color: "var(--text-muted)",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    messages: {
        flex: 1,
        overflow: "auto",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },
    emptyState: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        textAlign: "center",
        padding: "40px 20px",
    },
    emptyIcon: {
        width: "80px",
        height: "80px",
        borderRadius: "24px",
        background: "var(--accent-gradient)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        marginBottom: "24px",
        boxShadow: "0 10px 30px rgba(0, 163, 255, 0.4)",
        animation: "float 4s infinite ease-in-out",
    },
    emptyTitle: {
        fontSize: "24px",
        fontWeight: "700",
        marginBottom: "8px",
        background: "var(--accent-gradient)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    emptySubtitle: {
        color: "var(--text-secondary)",
        marginBottom: "32px",
        fontSize: "15px",
    },
    suggestedPrompts: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        justifyContent: "center",
    },
    promptButton: {
        padding: "10px 18px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid var(--border-primary)",
        borderRadius: "12px",
        color: "var(--text-secondary)",
        fontSize: "14px",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    message: {
        display: "flex",
        gap: "16px",
        animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    userMessage: {
        flexDirection: "row-reverse",
    },
    aiMessage: {},
    messageAvatar: {
        width: "36px",
        height: "36px",
        borderRadius: "12px",
        background: "var(--bg-tertiary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)",
        flexShrink: 0,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    },
    messageContent: {
        flex: 1,
        minWidth: 0,
        maxWidth: "85%",
    },
    messageHeader: {
        marginBottom: "6px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    messageSender: {
        fontSize: "13px",
        fontWeight: "700",
        color: "var(--text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    messageText: {
        color: "var(--text-primary)",
        lineHeight: "1.7",
        fontSize: "15px",
        padding: "14px 18px",
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "16px",
        border: "1px solid var(--border-primary)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    aiMessageText: {
        background: "rgba(0, 163, 255, 0.03)",
        borderColor: "rgba(0, 163, 255, 0.1)",
    },
    inputContainer: {
        padding: "20px 24px 32px",
        background: "rgba(255, 255, 255, 0.02)",
        borderTop: "1px solid var(--border-primary)",
    },
    inputWrapper: {
        display: "flex",
        gap: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid var(--border-primary)",
        borderRadius: "16px",
        padding: "6px",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    },
    input: {
        flex: 1,
        padding: "12px 16px",
        background: "transparent",
        border: "none",
        color: "var(--text-primary)",
        fontSize: "15px",
        outline: "none",
    },
    sendButton: {
        width: "48px",
        height: "48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--accent-gradient)",
        border: "none",
        borderRadius: "12px",
        color: "white",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 4px 15px rgba(0, 163, 255, 0.3)",
    },
    hint: {
        fontSize: "12px",
        color: "var(--text-muted)",
        textAlign: "center",
        marginTop: "12px",
        opacity: 0.6,
    },
    changesContainer: {
        marginTop: "16px",
        padding: "16px",
        background: "rgba(0, 163, 255, 0.05)",
        borderRadius: "14px",
        border: "1px solid rgba(0, 163, 255, 0.15)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
    },
    changesHeader: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "13px",
        fontWeight: "700",
        color: "var(--accent-primary)",
        marginBottom: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    changeItem: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    },
    changeFileInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    changePath: {
        fontSize: "14px",
        fontWeight: "600",
        color: "var(--text-primary)",
    },
    changeFullPath: {
        fontSize: "11px",
        color: "var(--text-muted)",
    },
    changeActions: {
        display: "flex",
        gap: "10px",
    },
    buttonGroup: {
        display: "flex",
        gap: "8px",
    },
    applyButton: {
        padding: "6px 14px",
        background: "var(--accent-gradient)",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "13px",
        cursor: "pointer",
        fontWeight: "600",
        boxShadow: "0 4px 12px rgba(0, 163, 255, 0.3)",
    },
    declineButton: {
        padding: "6px 14px",
        background: "rgba(255, 255, 255, 0.05)",
        color: "var(--text-secondary)",
        border: "1px solid var(--border-primary)",
        borderRadius: "8px",
        fontSize: "13px",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    appliedStatus: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: "#10b981",
        fontSize: "13px",
        fontWeight: "600",
    },
    declinedStatus: {
        color: "var(--text-muted)",
        fontSize: "13px",
        fontWeight: "600",
    },
    revertedStatus: {
        color: "var(--text-muted)",
        fontSize: "13px",
        fontStyle: "italic",
    },
    undoButton: {
        padding: "4px 10px",
        background: "transparent",
        color: "var(--text-muted)",
        border: "1px solid var(--border-primary)",
        borderRadius: "6px",
        fontSize: "11px",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
};

const codeBlockStyles = {
    container: {
        margin: "12px 0",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid var(--border-primary)",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        background: "var(--bg-tertiary)",
        borderBottom: "1px solid var(--border-primary)",
    },
    language: {
        fontSize: "12px",
        color: "var(--text-muted)",
        textTransform: "lowercase",
    },
    copyButton: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 8px",
        background: "transparent",
        border: "none",
        borderRadius: "4px",
        color: "var(--text-secondary)",
        fontSize: "12px",
        cursor: "pointer",
    },
};
