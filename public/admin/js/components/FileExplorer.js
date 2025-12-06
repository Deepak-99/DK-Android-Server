import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import FileTreeSidebar from "./FileTreeSidebar";
import FilePreviewModal from "./FilePreviewModal";
import {
  FaFolder,
  FaFile,
  FaUpload,
  FaDownload,
  FaTrash,
  FaPlus,
  FaCheckSquare,
  FaRegSquare
} from "react-icons/fa";

export default function FileExplorer({ deviceId }) {
  const [currentPath, setCurrentPath] = useState("/");
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [previewFile, setPreviewFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showMkdir, setShowMkdir] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const dropRef = useRef(null);

  const loadDirectory = useCallback(async (path) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/devices/${deviceId}/fs`, {
        params: { path }
      });
      setEntries(res.data.data || []);
      setCurrentPath(path);
      setSelected(new Set()); // clear selection on new path
    } catch (err) {
      console.error("Failed to load directory:", err);
      alert("Failed to load directory");
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    loadDirectory("/");
  }, [loadDirectory]);

  // Navigate into folder
  const openEntry = (entry) => {
    if (entry.type === "directory") {
      const newPath = currentPath === "/" ? `/${entry.name}` : `${currentPath}/${entry.name}`;
      loadDirectory(newPath);
    } else {
      setPreviewFile({ ...entry, fullPath: `${currentPath}/${entry.name}` });
    }
  };

  // Select entry (Ctrl, Shift, etc.)
  const toggleSelect = (entryName) => {
    const newSet = new Set(selected);
    if (newSet.has(entryName)) newSet.delete(entryName);
    else newSet.add(entryName);
    setSelected(newSet);
  };

  const selectAll = () => {
    const all = new Set(entries.map(e => e.name));
    setSelected(all);
  };

  const clearSelection = () => setSelected(new Set());

  // Drag drop upload
  useEffect(() => {
    const drop = dropRef.current;

    const handleDragOver = (e) => {
      e.preventDefault();
      drop.classList.add("drag-over");
    };
    const handleDragLeave = () => drop.classList.remove("drag-over");
    const handleDrop = async (e) => {
      e.preventDefault();
      drop.classList.remove("drag-over");

      const files = [...e.dataTransfer.files];
      await uploadFiles(files);
    };

    drop.addEventListener("dragover", handleDragOver);
    drop.addEventListener("dragleave", handleDragLeave);
    drop.addEventListener("drop", handleDrop);

    return () => {
      drop.removeEventListener("dragover", handleDragOver);
      drop.removeEventListener("dragleave", handleDragLeave);
      drop.removeEventListener("drop", handleDrop);
    };
  }, [currentPath]);

  // Upload
  const uploadFiles = async (fileList) => {
    try {
      for (const file of fileList) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", currentPath);

        await axios.post(`/api/devices/${deviceId}/fs/upload`, formData);
      }
      loadDirectory(currentPath);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed");
    }
  };

  const handleDownloadSelected = () => {
    [...selected].forEach((name) => {
      window.open(
        `/api/devices/${deviceId}/fs/download?path=${encodeURIComponent(
          `${currentPath}/${name}`
        )}`,
        "_blank"
      );
    });
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Delete ${selected.size} item(s)?`)) return;

    try {
      for (const name of selected) {
        await axios.delete(`/api/devices/${deviceId}/fs`, {
          params: { path: `${currentPath}/${name}` }
        });
      }
      loadDirectory(currentPath);
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("Failed to delete some items");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await axios.post(`/api/devices/${deviceId}/fs/mkdir`, {
      path: currentPath,
      name: newFolderName
    });
    setShowMkdir(false);
    setNewFolderName("");
    loadDirectory(currentPath);
  };

  return (
    <div className="fe-container">

      {/* Sidebar Tree */}
      <div className="fe-sidebar">
        <FileTreeSidebar deviceId={deviceId} onSelectPath={loadDirectory} currentPath={currentPath} />
      </div>

      {/* Main Section */}
      <div className="fe-main">
        {/* Controls */}
        <div className="fe-controls">
          <div>
            <button className="btn" onClick={selectAll}><FaCheckSquare /> Select All</button>
            <button className="btn" onClick={clearSelection}><FaRegSquare /> Clear</button>
          </div>

          <div>
            <label className="btn">
              <FaUpload /> Upload
              <input type="file" multiple hidden onChange={(e) => uploadFiles(e.target.files)} />
            </label>

            <button
              className="btn"
              disabled={selected.size === 0}
              onClick={handleDownloadSelected}
            >
              <FaDownload /> Download
            </button>

            <button
              className="btn delete"
              disabled={selected.size === 0}
              onClick={handleDeleteSelected}
            >
              <FaTrash /> Delete
            </button>

            <button className="btn" onClick={() => setShowMkdir(true)}>
              <FaPlus /> Folder
            </button>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div ref={dropRef} className="fe-dropzone">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.name}
                className={`fe-item ${selected.has(entry.name) ? "selected" : ""}`}
                onClick={(e) => {
                  if (e.ctrlKey) toggleSelect(entry.name);
                  else openEntry(entry);
                }}
              >
                <div className="icon">
                  {entry.type === "directory" ? <FaFolder /> : <FaFile />}
                </div>

                <div className="name">{entry.name}</div>

                <input
                  type="checkbox"
                  checked={selected.has(entry.name)}
                  onChange={() => toggleSelect(entry.name)}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          deviceId={deviceId}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* Create Folder Modal */}
      {showMkdir && (
        <div className="modal">
          <div className="modal-box">
            <h3>Create Folder</h3>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
            />
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleCreateFolder}>
                Create
              </button>
              <button className="btn" onClick={() => setShowMkdir(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .fe-container {
          display: flex;
          height: 600px;
          background: var(--bg);
          color: var(--text);
          border-radius: 10px;
        }

        .fe-sidebar {
          width: 250px;
          border-right: 1px solid var(--border);
          overflow-y: auto;
        }

        .fe-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .fe-controls {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          border-bottom: 1px solid var(--border);
        }

        .fe-dropzone {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
        }

        .fe-dropzone.drag-over {
          border: 2px dashed var(--accent);
        }

        .fe-item {
          display: flex;
          align-items: center;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
        }

        .fe-item.selected {
          background: var(--accent-soft);
        }

        .modal {
          position: fixed;
          top:0;left:0;right:0;bottom:0;
          background: rgba(0,0,0,0.5);
          display:flex;
          align-items:center;
          justify-content:center;
        }

        [data-theme="dark"] {
          --bg:#181818;
          --text:#eee;
          --border:#333;
          --accent:#4da3ff;
          --accent-soft:#253d55;
        }
      `}</style>
    </div>
  );
}
