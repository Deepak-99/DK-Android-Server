import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaFolder, FaFolderOpen, FaChevronRight, FaChevronDown } from "react-icons/fa";

/**
 * Props:
 * deviceId: the device id
 * currentPath: selected folder path
 * onSelectPath(path): callback when folder is clicked
 */

export default function FileTreeSidebar({ deviceId, currentPath, onSelectPath }) {
    const [rootNodes, setRootNodes] = useState([]);
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        loadChildren("/");
    }, []);

    const loadChildren = async (path) => {
        try {
            if (expanded[path]?.loaded) return;

            const res = await axios.get(`/api/devices/${deviceId}/fs`, {
                params: { path }
            });

            const onlyFolders = (res.data.data || []).filter(
                (e) => e.type === "directory"
            );

            setRootNodes((prev) => {
                const clone = { ...prev };
                clone[path] = onlyFolders.map((f) => ({
                    name: f.name,
                    path: path === "/" ? `/${f.name}` : `${path}/${f.name}`
                }));
                return clone;
            });

            setExpanded((prev) => ({
                ...prev,
                [path]: { open: true, loaded: true }
            }));
        } catch (err) {
            console.error("Tree load error:", err);
        }
    };

    const toggle = async (nodePath) => {
        const state = expanded[nodePath];

        if (!state?.open) {
            await loadChildren(nodePath);
            setExpanded((prev) => ({
                ...prev,
                [nodePath]: { ...prev[nodePath], open: true }
            }));
        } else {
            setExpanded((prev) => ({
                ...prev,
                [nodePath]: { ...prev[nodePath], open: false }
            }));
        }
    };

    const renderNode = (node) => {
        const nodeState = expanded[node.path];
        const isOpen = nodeState?.open;
        const isActive = currentPath === node.path;

        return (
            <div key={node.path} className={`tree-node ${isActive ? "active" : ""}`}>

                {/* Row */}
                <div className="row">
          <span className="toggle" onClick={() => toggle(node.path)}>
            {isOpen ? <FaChevronDown /> : <FaChevronRight />}
          </span>

                    <span
                        className="folder-label"
                        onClick={() => onSelectPath(node.path)}
                    >
            {isOpen ? <FaFolderOpen /> : <FaFolder />} {node.name}
          </span>
                </div>

                {/* Children */}
                {isOpen && rootNodes[node.path] && (
                    <div className="children">
                        {rootNodes[node.path].map((child) => renderNode(child))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="tree-container">
            {/* ROOT */}
            <div className={`tree-node ${currentPath === "/" ? "active" : ""}`}>
                <div className="row">
          <span className="toggle" onClick={() => toggle("/")}>
            {expanded["/"]?.open ? <FaChevronDown /> : <FaChevronRight />}
          </span>

                    <span className="folder-label" onClick={() => onSelectPath("/")}>
            <FaFolder /> root
          </span>
                </div>

                {expanded["/"]?.open && rootNodes["/"] && (
                    <div className="children">
                        {rootNodes["/"].map((node) => renderNode(node))}
                    </div>
                )}
            </div>

            {/* Styles */}
            <style>{`
        .tree-container {
          padding: 10px;
          font-size: 14px;
          background: var(--bg);
          color: var(--text);
        }

        .tree-node {
          margin-left: 6px;
        }

        .tree-node.active > .row > .folder-label {
          color: var(--accent);
          font-weight: bold;
        }

        .row {
          display: flex;
          align-items: center;
          cursor: pointer;
          padding: 4px 0;
        }

        .toggle {
          width: 18px;
          cursor: pointer;
          color: var(--text);
        }

        .folder-label {
          display: flex;
          align-items: center;
        }

        .folder-label svg {
          margin-right: 6px;
        }

        .children {
          margin-left: 18px;
          border-left: 1px solid var(--border);
          padding-left: 6px;
        }

        [data-theme="dark"] {
          --bg:#181818;
          --text:#eee;
          --border:#333;
          --accent:#4da3ff;
        }
      `}</style>
        </div>
    );
}
