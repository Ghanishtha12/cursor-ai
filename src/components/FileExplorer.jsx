"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    FolderOpen,
    FileCode,
    FileJson,
    FileText,
    Image,
    Coffee,
    RefreshCw,
    FilePlus,
    FolderPlus,
    Trash2,
    MoreVertical,
    Edit2,
    X,
    Loader2
} from "lucide-react";

const getFileIcon = (name, language) => {
    const ext = name.split(".").pop();

    if (language === "json" || ext === "json") return FileJson;
    if (language === "markdown" || ext === "md") return FileText;
    if (language === "image" || ["ico", "png", "jpg", "svg"].includes(ext)) return Image;
    if (["js", "jsx", "ts", "tsx", "mjs"].includes(ext)) return FileCode;
    if (ext === "java") return Coffee;

    return File;
};

const getFileColor = (name) => {
    const ext = name.split(".").pop();
    const colors = {
        js: "#f7df1e",
        jsx: "#61dafb",
        ts: "#3178c6",
        tsx: "#3178c6",
        json: "#cbcb41",
        css: "#264de4",
        html: "#e34c26",
        md: "#083fa1",
        mjs: "#f7df1e",
    };
    return colors[ext] || "var(--text-muted)";
};

function TreeNode({ node, depth = 0, onFileSelect, selectedFile, onFileOp, newItem, newItemName, setNewItemName, handleCreateSubmit, setNewItem }) {
    const [isOpen, setIsOpen] = useState(depth < 1);
    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(node.name);

    const isFolder = node.type === "folder";
    const isSelected = selectedFile === node.name;

    const handleClick = () => {
        if (isFolder) {
            setIsOpen(!isOpen);
        } else {
            onFileSelect(node);
        }
    };

    const handleEditComplete = (e) => {
        if (e.key === "Enter") {
            setIsEditing(false);
            if (editValue && editValue !== node.name) {
                onFileOp("rename", node.path, null, editValue);
            }
        } else if (e.key === "Escape") {
            setIsEditing(false);
            setEditValue(node.name);
        }
    };

    const FileIcon = isFolder
        ? (isOpen ? FolderOpen : Folder)
        : getFileIcon(node.name, node.language);

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                onClick={handleClick}
                style={{
                    ...styles.treeItem,
                    paddingLeft: `${depth * 12 + 16}px`,
                    ...(isSelected ? styles.treeItemSelected : {}),
                }}
            >
                {isFolder && (
                    <span style={styles.chevron}>
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                )}
                {!isFolder && <span style={{ width: 14 }} />}

                <FileIcon
                    size={16}
                    style={{
                        color: isFolder ? "var(--accent-orange)" : getFileColor(node.name),
                        flexShrink: 0,
                    }}
                />

                {isEditing ? (
                    <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleEditComplete}
                        onBlur={() => { setIsEditing(false); setEditValue(node.name); }}
                        style={styles.renameInput}
                    />
                ) : (
                    <span style={styles.fileName}>{node.name}</span>
                )}

                {isHovered && !isEditing && (
                    <div style={styles.itemActions}>
                        {isFolder && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onFileOp("create", node.path, "file"); }}
                                    style={styles.itemActionBtn} title="New File"
                                >
                                    <FilePlus size={12} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onFileOp("create", node.path, "folder"); }}
                                    style={styles.itemActionBtn} title="New Folder"
                                >
                                    <FolderPlus size={12} />
                                </button>
                            </>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                            style={styles.itemActionBtn} title="Rename"
                        >
                            <Edit2 size={12} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onFileOp("delete", node.path); }}
                            style={{ ...styles.itemActionBtn, color: "#ff4d4d" }} title="Delete"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}
            </div>

            {isFolder && isOpen && node.children && (
                <div style={styles.children}>
                    {newItem && newItem.parentPath === node.path && (
                        <div style={{ ...styles.treeItem, paddingLeft: `${(depth + 1) * 12 + 16}px` }}>
                            <span style={{ width: 14 }} />
                            {newItem.type === "folder" ? <Folder size={16} /> : <File size={16} />}
                            <input
                                autoFocus
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCreateSubmit();
                                    if (e.key === "Escape") setNewItem(null);
                                }}
                                onBlur={() => { if (!newItemName) setNewItem(null); }}
                                style={styles.renameInput}
                                placeholder={`New ${newItem.type}...`}
                            />
                        </div>
                    )}
                    {node.children.map((child, idx) => (
                        <TreeNode
                            key={idx}
                            node={child}
                            depth={depth + 1}
                            onFileSelect={onFileSelect}
                            selectedFile={selectedFile}
                            onFileOp={onFileOp}
                            newItem={newItem}
                            newItemName={newItemName}
                            setNewItemName={setNewItemName}
                            handleCreateSubmit={handleCreateSubmit}
                            setNewItem={setNewItem}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FileExplorer({ onFileSelect, selectedFile, refreshTrigger }) {
    const [fileTree, setFileTree] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newItem, setNewItem] = useState(null); // { parentPath, type }
    const [newItemName, setNewItemName] = useState("");
    const [rootPath, setRootPath] = useState(""); // empty means server default
    const [displayRoot, setDisplayRoot] = useState("");
    const [isPickerLoading, setIsPickerLoading] = useState(false);

    const fetchFiles = async () => {
        if (rootPath === "CLOSED") return;
        setIsLoading(true);
        try {
            const url = rootPath ? `/api/files?path=${encodeURIComponent(rootPath)}` : "/api/files";
            const response = await axios.get(url);
            setFileTree(response.data.tree);
            setDisplayRoot(response.data.rootDir);
        } catch (error) {
            console.error("Failed to fetch files:", error);
            alert("Failed to open folder. Please check the path.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileOp = async (action, targetPath, type, newName) => {
        let name = newName;
        if (action === "create") {
            setNewItem({ parentPath: targetPath, type });
            setNewItemName("");
            return;
        } else if (action === "delete") {
            if (!confirm(`Are you sure you want to delete ${targetPath.split(/[\\/]/).pop()}?`)) return;
        }

        try {
            await axios.post("/api/file-ops", { action, path: targetPath, name, type });
            fetchFiles();
        } catch (error) {
            alert(`File operation failed: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleCreateSubmit = async () => {
        if (!newItemName) {
            setNewItem(null);
            return;
        }
        try {
            await axios.post("/api/file-ops", {
                action: "create",
                path: newItem.parentPath,
                name: newItemName,
                type: newItem.type
            });
            setNewItem(null);
            setNewItemName("");
            fetchFiles();
        } catch (error) {
            alert(`Creation failed: ${error.message}`);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [refreshTrigger, rootPath]);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={styles.headerTitle}>EXPLORER</span>
                <div style={{ display: "flex", gap: "4px" }}>
                    <button
                        onClick={() => {
                            setFileTree([]);
                            setRootPath("CLOSED");
                            setDisplayRoot("No folder open");
                        }}
                        style={styles.refreshButton}
                        title="Close Folder"
                    >
                        <X size={12} />
                    </button>
                    <button
                        onClick={fetchFiles}
                        style={styles.refreshButton}
                        title="Refresh Explorer"
                        disabled={isLoading}
                    >
                        <RefreshCw size={12} className={isLoading ? "rotate" : ""} />
                    </button>
                </div>
            </div>

            <div style={styles.projectHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                    <ChevronDown size={14} />
                    <span style={styles.projectName}>{displayRoot.split(/[\\/]/).pop() || "PROJECT"}</span>
                    <span style={{ fontSize: "10px", opacity: 0.5, marginLeft: "auto" }}>
                        {displayRoot}
                    </span>
                </div>
                <button
                    onClick={async () => {
                        setIsPickerLoading(true);
                        try {
                            const response = await axios.get("/api/select-folder");
                            if (response.data.path) {
                                setRootPath(response.data.path);
                            }
                        } catch (err) {
                            console.error("Folder picker failed:", err);
                            const newPath = prompt("Picker failed. Enter absolute path manually:", displayRoot);
                            if (newPath) setRootPath(newPath);
                        } finally {
                            setIsPickerLoading(false);
                        }
                    }}
                    style={{
                        ...styles.refreshButton,
                        opacity: isPickerLoading ? 0.5 : 1,
                        cursor: isPickerLoading ? "wait" : "pointer"
                    }}
                    title="Open Folder"
                    disabled={isPickerLoading}
                >
                    {isPickerLoading ? <Loader2 size={14} className="rotate" /> : <FolderOpen size={14} />}
                </button>
            </div>

            <div style={styles.tree}>
                {newItem && newItem.parentPath === "." && (
                    <div style={{ ...styles.treeItem, paddingLeft: "16px" }}>
                        <span style={{ width: 14 }} />
                        {newItem.type === "folder" ? <Folder size={16} /> : <File size={16} />}
                        <input
                            autoFocus
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreateSubmit();
                                if (e.key === "Escape") setNewItem(null);
                            }}
                            onBlur={() => { if (!newItemName) setNewItem(null); }}
                            style={styles.renameInput}
                            placeholder={`New ${newItem.type}...`}
                        />
                    </div>
                )}
                {isLoading && fileTree.length === 0 ? (
                    <div style={styles.loading}>Loading files...</div>
                ) : (
                    fileTree.map((node, idx) => (
                        <TreeNode
                            key={idx}
                            node={node}
                            onFileSelect={onFileSelect}
                            selectedFile={selectedFile}
                            onFileOp={handleFileOp}
                            newItem={newItem}
                            newItemName={newItemName}
                            setNewItemName={setNewItemName}
                            handleCreateSubmit={handleCreateSubmit}
                            setNewItem={setNewItem}
                        />
                    ))
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
        padding: "16px",
        borderBottom: "1px solid var(--border-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(255, 255, 255, 0.02)",
    },
    refreshButton: {
        background: "transparent",
        border: "none",
        color: "var(--text-muted)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px",
        borderRadius: "8px",
        transition: "all 0.2s ease",
    },
    loading: {
        padding: "32px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "13px",
    },
    headerTitle: {
        fontSize: "12px",
        fontWeight: "700",
        letterSpacing: "1px",
        color: "var(--text-primary)",
        opacity: 0.8,
    },
    projectHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        padding: "12px 16px",
        color: "var(--text-primary)",
        fontWeight: "600",
        fontSize: "14px",
        background: "rgba(255, 255, 255, 0.03)",
        cursor: "pointer",
        minWidth: 0,
    },
    projectName: {
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        fontSize: "12px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        flex: 1,
    },
    tree: {
        flex: 1,
        overflowY: "auto",
        padding: "8px 0",
    },
    treeItem: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 16px",
        cursor: "pointer",
        color: "var(--text-secondary)",
        fontSize: "13px",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        userSelect: "none",
        position: "relative",
        borderRadius: "0 20px 20px 0",
        marginRight: "12px",
    },
    treeItemSelected: {
        background: "rgba(0, 163, 255, 0.1)",
        color: "var(--accent-primary)",
        boxShadow: "inset 4px 0 0 var(--accent-primary)",
    },
    chevron: {
        display: "flex",
        alignItems: "center",
        color: "var(--text-muted)",
        opacity: 0.6,
    },
    fileName: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontWeight: "400",
        flex: 1,
    },
    itemActions: {
        display: "flex",
        gap: "4px",
        marginLeft: "auto",
        paddingRight: "8px",
    },
    itemActionBtn: {
        background: "transparent",
        border: "none",
        color: "var(--text-muted)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px",
        borderRadius: "4px",
        transition: "all 0.15s ease",
        ":hover": {
            color: "var(--text-primary)",
            background: "rgba(255,255,255,0.1)",
        },
    },
    children: {
        position: "relative",
    },
    renameInput: {
        background: "var(--bg-tertiary)",
        border: "1px solid var(--accent-primary)",
        borderRadius: "4px",
        color: "var(--text-primary)",
        fontSize: "13px",
        padding: "2px 6px",
        outline: "none",
        width: "80%",
        fontFamily: "inherit",
    }
};
