"use client";

import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, X, FileText, ChevronRight, Hash } from "lucide-react";
import axios from "axios";

export default function SearchPanel({ onFileSelect }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.length >= 2) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
            setResults(response.data);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={styles.title}>Search</span>
            </div>

            <div style={styles.searchBox}>
                <div style={styles.inputWrapper}>
                    <SearchIcon size={16} color="var(--text-muted)" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search in files..."
                        style={styles.input}
                        autoFocus
                    />
                    {query && (
                        <button onClick={() => setQuery("")} style={styles.clearBtn}>
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div style={styles.resultsArea}>
                {isLoading ? (
                    <div style={styles.status}>Searching...</div>
                ) : results.length > 0 ? (
                    <div style={styles.resultsList}>
                        <div style={styles.resultCount}>
                            {results.length} results found
                        </div>
                        {results.map((result, idx) => (
                            <div
                                key={idx}
                                style={styles.resultItem}
                                onClick={() => onFileSelect({ name: result.fileName, path: result.path })}
                            >
                                <div style={styles.resultHeader}>
                                    <FileText size={14} color="var(--accent-primary)" />
                                    <span style={styles.fileName}>{result.fileName}</span>
                                    <span style={styles.filePath}>{result.path}</span>
                                </div>
                                <div style={styles.resultContent}>
                                    <span style={styles.lineNumber}>{result.line}</span>
                                    <div style={styles.linePreview}>{result.content}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : query.length >= 2 ? (
                    <div style={styles.status}>No results found</div>
                ) : (
                    <div style={styles.emptyState}>
                        <SearchIcon size={40} style={{ opacity: 0.1, marginBottom: "16px" }} />
                        <p>Search across all project files</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        width: "280px",
        height: "100%",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border-primary)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    header: {
        padding: "20px 24px",
    },
    title: {
        fontSize: "13px",
        fontWeight: "700",
        color: "var(--text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    searchBox: {
        padding: "0 24px 20px",
    },
    inputWrapper: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid var(--border-primary)",
        borderRadius: "8px",
        padding: "8px 12px",
    },
    input: {
        flex: 1,
        background: "transparent",
        border: "none",
        outline: "none",
        color: "var(--text-primary)",
        fontSize: "14px",
    },
    clearBtn: {
        background: "transparent",
        border: "none",
        color: "var(--text-muted)",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        alignItems: "center",
    },
    resultsArea: {
        flex: 1,
        overflow: "auto",
        padding: "0 8px 20px",
    },
    resultsList: {
        display: "flex",
        flexDirection: "column",
    },
    resultCount: {
        padding: "10px 16px",
        fontSize: "12px",
        color: "var(--text-muted)",
    },
    resultItem: {
        padding: "12px 16px",
        cursor: "pointer",
        borderRadius: "8px",
        transition: "all 0.1s ease",
        ":hover": {
            background: "rgba(255, 255, 255, 0.03)",
        },
    },
    resultHeader: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "6px",
    },
    fileName: {
        fontSize: "13px",
        fontWeight: "600",
        color: "var(--text-primary)",
    },
    filePath: {
        fontSize: "11px",
        color: "var(--text-muted)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    resultContent: {
        display: "flex",
        gap: "10px",
        background: "rgba(0, 0, 0, 0.2)",
        padding: "6px 8px",
        borderRadius: "4px",
        border: "1px solid rgba(255, 255, 255, 0.03)",
    },
    lineNumber: {
        fontSize: "11px",
        color: "var(--accent-primary)",
        opacity: 0.6,
        minWidth: "16px",
    },
    linePreview: {
        fontSize: "12px",
        color: "var(--text-secondary)",
        fontFamily: "var(--font-mono)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    status: {
        padding: "32px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "14px",
    },
    emptyState: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "60%",
        padding: "24px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "14px",
    }
};
