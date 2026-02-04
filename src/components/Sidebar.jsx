"use client";

import {
    Files,
    Search,
    MessageSquare,
    Settings,
    Plus,
    GitBranch,
    Package,
    Terminal as TerminalIcon
} from "lucide-react";

const navItems = [
    { icon: Files, label: "Explorer", id: "explorer" },
    { icon: Search, label: "Search", id: "search" },
    { icon: GitBranch, label: "Source Control", id: "git" },
    { icon: Package, label: "Extensions", id: "extensions" },
];

export default function Sidebar({
    activePanel,
    setActivePanel,
    onNewChat,
    chatHistoryOpen,
    setChatHistoryOpen,
    terminalOpen,
    setTerminalOpen
}) {
    return (
        <aside style={styles.sidebar}>
            {/* Top Navigation */}
            <nav style={styles.nav}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePanel === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActivePanel(isActive ? null : item.id)}
                            style={{
                                ...styles.navButton,
                                ...(isActive ? styles.navButtonActive : {}),
                            }}
                            className="tooltip"
                            data-tooltip={item.label}
                            title={item.label}
                        >
                            <Icon size={24} strokeWidth={1.5} />
                            {isActive && <span style={styles.activeIndicator} />}
                        </button>
                    );
                })}
            </nav>

            {/* Divider */}
            <div style={styles.divider} />

            {/* AI Chat Button */}
            <button
                onClick={() => setChatHistoryOpen(!chatHistoryOpen)}
                style={{
                    ...styles.navButton,
                    ...(chatHistoryOpen ? styles.navButtonActive : {}),
                }}
                title="AI Chat"
            >
                <MessageSquare size={24} strokeWidth={1.5} />
                {chatHistoryOpen && <span style={styles.activeIndicator} />}
            </button>

            {/* New Chat Button */}
            <button
                onClick={onNewChat}
                style={styles.newChatButton}
                title="New Chat"
            >
                <Plus size={20} strokeWidth={2} />
            </button>

            {/* Bottom Section */}
            <div style={styles.bottomNav}>
                <button
                    onClick={() => setTerminalOpen(!terminalOpen)}
                    style={{
                        ...styles.navButton,
                        ...(terminalOpen ? styles.navButtonActive : {}),
                    }}
                    title="Toggle Terminal (Ctrl+J)"
                >
                    <TerminalIcon size={24} strokeWidth={1.5} />
                    {terminalOpen && <span style={styles.activeIndicator} />}
                </button>
                <button style={styles.navButton} title="Settings">
                    <Settings size={22} strokeWidth={1.5} />
                </button>
            </div>
        </aside>
    );
}

const styles = {
    sidebar: {
        width: "68px",
        height: "100%",
        background: "var(--bg-primary)",
        borderRight: "1px solid var(--border-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "12px",
        gap: "8px",
        zIndex: 10,
    },
    nav: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
    },
    navButton: {
        position: "relative",
        width: "44px",
        height: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        borderRadius: "12px",
        color: "var(--text-muted)",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    navButtonActive: {
        color: "var(--text-primary)",
        background: "rgba(255, 255, 255, 0.05)",
        boxShadow: "inset 0 0 0 1px var(--border-primary)",
    },
    activeIndicator: {
        position: "absolute",
        left: "-12px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "4px",
        height: "20px",
        background: "var(--accent-primary)",
        borderRadius: "0 4px 4px 0",
        boxShadow: "0 0 15px var(--accent-primary)",
        animation: "pulse 2s infinite ease-in-out",
    },
    divider: {
        width: "30px",
        height: "1px",
        background: "var(--border-primary)",
        margin: "8px 0",
    },
    newChatButton: {
        width: "44px",
        height: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--accent-gradient)",
        border: "none",
        borderRadius: "14px",
        color: "white",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        marginTop: "4px",
        boxShadow: "0 4px 15px rgba(0, 163, 255, 0.3)",
    },
    bottomNav: {
        marginTop: "auto",
        paddingBottom: "16px",
    },
};
