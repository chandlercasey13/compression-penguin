import { useRef, useState } from "react";

const ACCEPTED = ".jpg,.jpeg,.png";

export function FileDropZone({ file, onFileSelect }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);

  function selectFile(f) {
    if (!f) {
      onFileSelect(null);
      setPreview(null);
      return;
    }
    onFileSelect(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && isImageFile(dropped)) selectFile(dropped);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleClick() {
    inputRef.current?.click();
  }

  function handleInputChange(e) {
    const selected = e.target.files[0];
    if (selected) selectFile(selected);
  }

  function isImageFile(f) {
    return /\.(jpe?g|png)$/i.test(f.name) || f.type.startsWith("image/");
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getExtension(name) {
    const parts = name.split(".");
    return parts.length > 1 ? `.${parts.pop().toUpperCase()}` : "FILE";
  }

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        ...styles.zone,
        ...(dragOver ? styles.zoneDragOver : {}),
        ...(file ? styles.zoneHasFile : {}),
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleInputChange}
        style={{ display: "none" }}
      />

      {file ? (
        <div style={styles.fileInfo}>
          {preview && (
            <div style={styles.thumbWrapper}>
              <img src={preview} alt="Preview" style={styles.thumb} />
            </div>
          )}
          <div style={styles.fileMeta}>
            <div style={styles.fileNameRow}>
              <span style={styles.extBadge}>{getExtension(file.name)}</span>
              <p style={styles.fileName}>{file.name}</p>
            </div>
            <p style={styles.fileSize}>{formatSize(file.size)}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              selectFile(null);
            }}
            style={styles.removeBtn}
            title="Remove file"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ) : (
        <div style={styles.placeholder}>
          <div style={styles.uploadIconWrapper}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <div style={styles.placeholderTextGroup}>
            <p style={styles.placeholderText}>
              Drag and drop an image, or <span style={styles.link}>browse</span>
            </p>
            <p style={styles.placeholderHint}>
              JPG, JPEG, and PNG accepted
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  zone: {
    border: "1.5px dashed var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "2rem 1.5rem",
    textAlign: "center",
    cursor: "pointer",
    transition: "all var(--transition)",
    background: "var(--bg-subtle)",
  },
  zoneDragOver: {
    borderColor: "var(--primary)",
    background: "var(--primary-muted)",
    boxShadow: "0 0 0 3px var(--primary-muted)",
  },
  zoneHasFile: {
    borderColor: "var(--primary)",
    borderStyle: "solid",
    background: "var(--primary-muted)",
    padding: "1rem 1.5rem",
  },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    textAlign: "left",
  },
  thumbWrapper: {
    width: "52px",
    height: "52px",
    borderRadius: "10px",
    overflow: "hidden",
    flexShrink: 0,
    border: "1px solid var(--border)",
  },
  thumb: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  fileMeta: {
    flex: 1,
    minWidth: 0,
  },
  fileNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  extBadge: {
    fontSize: "0.55rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    padding: "0.15rem 0.4rem",
    borderRadius: "4px",
    background: "var(--surface-raised)",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
    flexShrink: 0,
  },
  fileName: {
    fontWeight: 600,
    fontSize: "0.85rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  fileSize: {
    color: "var(--text-muted)",
    fontSize: "0.78rem",
    marginTop: "0.2rem",
  },
  removeBtn: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "all var(--transition)",
  },
  placeholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
  },
  uploadIconWrapper: {
    width: "56px",
    height: "56px",
    borderRadius: "14px",
    background: "var(--surface-raised)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-secondary)",
  },
  placeholderTextGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  placeholderText: {
    fontSize: "0.88rem",
    color: "var(--text-secondary)",
  },
  placeholderHint: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  link: {
    color: "var(--primary)",
    fontWeight: 600,
    textDecoration: "underline",
    textUnderlineOffset: "2px",
  },
};
