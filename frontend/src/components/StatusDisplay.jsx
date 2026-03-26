export function StatusDisplay({
  phase,
  uploadProgress,
  job,
  downloadUrl,
  error,
  onReset,
}) {
  return (
    <div style={styles.wrapper}>
      {/* Step tracker */}
      <div style={styles.tracker}>
        <StepNode number={1} label="Upload" status={stepStatus("uploading", phase)} />
        <StepConnector active={stepStatus("uploading", phase) === "done"} />
        <StepNode number={2} label="Compress" status={stepStatus("processing", phase)} />
        <StepConnector active={stepStatus("processing", phase) === "done"} />
        <StepNode number={3} label="Done" status={stepStatus("completed", phase)} />
      </div>

      {/* Upload progress */}
      {phase === "uploading" && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionLabel}>Uploading file</span>
            <span style={styles.sectionValue}>{uploadProgress}%</span>
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Processing */}
      {phase === "processing" && (
        <div style={styles.processingCard}>
          <div style={styles.processingHeader}>
            <div style={styles.spinnerRing} />
            <div>
              <p style={styles.processingTitle}>Compressing to WebP</p>
              <p style={styles.processingMeta}>This usually takes a few seconds...</p>
            </div>
          </div>
          <div style={styles.shimmerBar} />
        </div>
      )}

      {/* Completed with size comparison */}
      {phase === "completed" && downloadUrl && (
        <div style={styles.successWrapper}>
          {/* Size comparison */}
          {job?.originalSize && job?.compressedSize && (
            <SizeComparison
              originalSize={job.originalSize}
              compressedSize={job.compressedSize}
            />
          )}

          <div style={styles.successActions}>
            <div style={styles.successRow}>
              <div style={styles.successIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span style={styles.successLabel}>Ready to download</span>
            </div>
            <button
              onClick={() => {
                fetch(downloadUrl)
                  .then((res) => res.blob())
                  .then((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = job?.outputKey?.split("/").pop() || "compressed.webp";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  });
              }}
              style={styles.downloadButton}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.5rem" }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download WebP
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {phase === "error" && (
        <div style={styles.errorCard}>
          <div style={styles.errorIconWrapper}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div>
            <p style={styles.errorTitle}>Compression failed</p>
            <p style={styles.errorMessage}>{error || "An unexpected error occurred."}</p>
          </div>
        </div>
      )}

      {/* Reset */}
      {(phase === "completed" || phase === "error") && (
        <button onClick={onReset} style={styles.resetButton}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.4rem" }}>
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          Compress Another Image
        </button>
      )}
    </div>
  );
}

function SizeComparison({ originalSize, compressedSize }) {
  const saved = originalSize - compressedSize;
  const percent = Math.round((saved / originalSize) * 100);
  const isSmaller = saved > 0;

  return (
    <div style={styles.comparisonCard}>
      <div style={styles.comparisonHeader}>
        <span style={styles.comparisonTitle}>Space Saved</span>
        <span style={{
          ...styles.percentBadge,
          background: isSmaller ? "var(--success-muted)" : "var(--error-muted)",
          color: isSmaller ? "var(--success)" : "var(--error)",
        }}>
          {isSmaller ? `−${percent}%` : `+${Math.abs(percent)}%`}
        </span>
      </div>

      <div style={styles.barComparison}>
        {/* Original */}
        <div style={styles.barRow}>
          <span style={styles.barLabel}>Original</span>
          <div style={styles.barTrack}>
            <div style={{ ...styles.barFillOriginal, width: "100%" }} />
          </div>
          <span style={styles.barSize}>{formatBytes(originalSize)}</span>
        </div>
        {/* Compressed */}
        <div style={styles.barRow}>
          <span style={styles.barLabel}>WebP</span>
          <div style={styles.barTrack}>
            <div style={{
              ...styles.barFillCompressed,
              width: `${Math.max((compressedSize / originalSize) * 100, 2)}%`,
            }} />
          </div>
          <span style={styles.barSize}>{formatBytes(compressedSize)}</span>
        </div>
      </div>

      {isSmaller && (
        <div style={styles.savedRow}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
          </svg>
          <span style={styles.savedText}>{formatBytes(saved)} saved</span>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function stepStatus(stepPhase, currentPhase) {
  const order = ["uploading", "processing", "completed"];
  const stepIdx = order.indexOf(stepPhase);
  const currentIdx = order.indexOf(currentPhase);
  if (currentPhase === "error") return currentIdx >= stepIdx ? "error" : "pending";
  if (currentIdx > stepIdx) return "done";
  if (currentIdx === stepIdx) return "active";
  return "pending";
}

function StepNode({ number, label, status }) {
  const ringColor = {
    pending: "var(--border)", active: "var(--primary)",
    done: "var(--success)", error: "var(--error)",
  }[status];
  const bgColor = {
    pending: "transparent", active: "var(--primary-muted)",
    done: "var(--success-muted)", error: "var(--error-muted)",
  }[status];

  return (
    <div style={styles.stepNode}>
      <div style={{
        ...styles.stepRing,
        borderColor: ringColor, background: bgColor,
        color: status === "pending" ? "var(--text-muted)" : ringColor,
        boxShadow: status === "active" ? `0 0 12px ${ringColor}40` : "none",
      }}>
        {status === "done" ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <span style={{ fontSize: "0.7rem", fontWeight: 700 }}>{number}</span>
        )}
      </div>
      <span style={{ ...styles.stepLabel, color: status === "pending" ? "var(--text-muted)" : "var(--text)" }}>
        {label}
      </span>
    </div>
  );
}

function StepConnector({ active }) {
  return (
    <div style={{ ...styles.connector, background: active ? "var(--success)" : "var(--border)" }} />
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    animation: "fadeIn 0.3s ease-out",
  },
  tracker: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNode: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    minWidth: "72px",
  },
  stepRing: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s",
  },
  stepLabel: {
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.02em",
    transition: "color 0.3s",
  },
  connector: {
    width: "clamp(24px, 6vw, 48px)",
    height: "2px",
    borderRadius: "1px",
    transition: "background 0.3s",
    marginBottom: "1.5rem",
  },

  section: { display: "flex", flexDirection: "column", gap: "0.6rem" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { fontSize: "0.82rem", fontWeight: 500, color: "var(--text-secondary)" },
  sectionValue: { fontSize: "0.82rem", fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums" },
  progressTrack: { width: "100%", height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, var(--primary), #818cf8)", borderRadius: "2px", transition: "width 0.3s ease" },

  processingCard: {
    background: "var(--bg-subtle)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)", padding: "1.25rem",
    display: "flex", flexDirection: "column", gap: "1rem",
  },
  processingHeader: { display: "flex", alignItems: "center", gap: "0.85rem" },
  spinnerRing: {
    width: "28px", height: "28px",
    border: "2.5px solid var(--border)", borderTop: "2.5px solid var(--primary)",
    borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0,
  },
  processingTitle: { fontSize: "0.88rem", fontWeight: 600 },
  processingMeta: { fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.1rem" },
  shimmerBar: {
    height: "3px", borderRadius: "2px",
    background: "linear-gradient(90deg, var(--border) 0%, var(--primary) 50%, var(--border) 100%)",
    backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite linear",
  },

  // Completed
  successWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    animation: "scaleIn 0.3s ease-out",
  },

  // Size comparison
  comparisonCard: {
    background: "var(--bg-subtle)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  comparisonHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  comparisonTitle: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    letterSpacing: "0.02em",
  },
  percentBadge: {
    fontSize: "0.82rem",
    fontWeight: 700,
    padding: "0.2rem 0.65rem",
    borderRadius: "20px",
    fontVariantNumeric: "tabular-nums",
  },
  barComparison: {
    display: "flex",
    flexDirection: "column",
    gap: "0.65rem",
  },
  barRow: {
    display: "grid",
    gridTemplateColumns: "48px 1fr 58px",
    alignItems: "center",
    gap: "0.5rem",
  },
  barLabel: {
    fontSize: "0.72rem",
    fontWeight: 600,
    color: "var(--text-muted)",
    textAlign: "right",
  },
  barTrack: {
    height: "8px",
    background: "var(--border)",
    borderRadius: "4px",
    overflow: "hidden",
  },
  barFillOriginal: {
    height: "100%",
    background: "var(--text-muted)",
    borderRadius: "4px",
    transition: "width 0.6s ease",
  },
  barFillCompressed: {
    height: "100%",
    background: "linear-gradient(90deg, var(--success), #34d399)",
    borderRadius: "4px",
    transition: "width 0.6s ease",
  },
  barSize: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text)",
    fontVariantNumeric: "tabular-nums",
    textAlign: "right",
  },
  savedRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    paddingTop: "0.25rem",
    borderTop: "1px solid var(--border)",
  },
  savedText: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--success)",
  },

  // Actions
  successActions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.85rem",
  },
  successRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  successIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "var(--success-muted)",
    color: "var(--success)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  successLabel: {
    fontSize: "0.88rem",
    fontWeight: 600,
  },
  downloadButton: {
    display: "inline-flex",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    padding: "0.75rem 1.75rem",
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "#fff",
    background: "var(--success)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    transition: "all var(--transition)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(16,185,129,0.3)",
  },

  errorCard: {
    display: "flex", alignItems: "flex-start", gap: "0.85rem", padding: "1.25rem",
    background: "var(--error-muted)", border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "var(--radius-sm)", animation: "fadeIn 0.3s ease-out",
  },
  errorIconWrapper: {
    width: "32px", height: "32px", borderRadius: "8px",
    background: "rgba(239, 68, 68, 0.15)", color: "var(--error)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  errorTitle: { fontSize: "0.88rem", fontWeight: 600, color: "var(--error)" },
  errorMessage: { fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem", lineHeight: 1.5 },

  resetButton: {
    width: "100%", padding: "0.75rem", fontSize: "0.85rem", fontWeight: 600,
    color: "var(--text-secondary)", background: "var(--bg-subtle)",
    border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
    transition: "all var(--transition)", display: "flex",
    alignItems: "center", justifyContent: "center",
  },
};
