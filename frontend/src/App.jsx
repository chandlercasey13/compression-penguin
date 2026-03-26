import { useConversion } from "./hooks/useConversion.js";
import { FileDropZone } from "./components/FileDropZone.jsx";
import { StatusDisplay } from "./components/StatusDisplay.jsx";

const FEATURES = [
  { icon: "shield", label: "Secure Transfer", desc: "Direct encrypted upload" },
  { icon: "zap", label: "Instant Compression", desc: "WebP output in seconds" },
  { icon: "layers", label: "Space Savings", desc: "See before & after" },
];

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  );
}

const ICON_MAP = { shield: ShieldIcon, zap: ZapIcon, layers: LayersIcon };

export default function App() {
  const compression = useConversion();

  const canSubmit = compression.file && compression.phase === "idle";

  return (
    <div style={styles.layout}>
      <nav style={styles.nav}>
        <div className="nav-inner">
          <div style={styles.navBrand}>
            <div style={styles.navLogo}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            </div>
            <span style={styles.navTitle}>Compression Penguin</span>
            <span style={styles.navBadge}>WebP</span>
          </div>
          <div style={styles.navRight} />
        </div>
      </nav>

      <div className="page-wrapper" style={styles.pageWrapper}>
        <div className="page-content">
          <aside className="sidebar" style={styles.sidebar}>
            <div style={styles.sidebarSection}>
              <h2 style={styles.sidebarTitle}>Image Compression</h2>
              <p className="sidebar-desc" style={styles.sidebarDesc}>
                Compress JPEG and PNG images to WebP format.
                See exactly how much space you save with a
                side-by-side size comparison.
              </p>
            </div>

            <div className="sidebar-details" style={styles.featureList}>
              {FEATURES.map((f) => {
                const Icon = ICON_MAP[f.icon];
                return (
                  <div key={f.label} style={styles.featureItem}>
                    <div style={styles.featureIcon}><Icon /></div>
                    <div>
                      <div style={styles.featureLabel}>{f.label}</div>
                      <div style={styles.featureDesc}>{f.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sidebar-details" style={styles.formatBadges}>
              <span style={styles.fmtBadge}>.JPG</span>
              <span style={styles.fmtBadge}>.JPEG</span>
              <span style={styles.fmtBadge}>.PNG</span>
              <span style={styles.fmtArrow}>→</span>
              <span style={{ ...styles.fmtBadge, ...styles.fmtBadgeOut }}>.WEBP</span>
            </div>
          </aside>

          <main style={styles.main}>
            <div style={styles.card}>
              <div className="card-header">
                <h3 style={styles.cardTitle}>
                  {compression.phase === "idle"
                    ? "Compress Image"
                    : compression.phase === "completed"
                      ? "Compression Complete"
                      : compression.phase === "error"
                        ? "Compression Failed"
                        : "Compressing"}
                </h3>
                {compression.phase === "idle" && (
                  <span style={styles.cardSubtitle}>Drop a JPEG or PNG to compress to WebP</span>
                )}
              </div>

              <div className="card-body">
                {compression.phase === "idle" && (
                  <>
                    <FileDropZone
                      file={compression.file}
                      onFileSelect={compression.setFile}
                    />

                    <button
                      style={{
                        ...styles.button,
                        ...(canSubmit ? {} : styles.buttonDisabled),
                      }}
                      onClick={compression.submit}
                      disabled={!canSubmit}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.5rem" }}>
                        <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>
                      </svg>
                      Compress to WebP
                    </button>
                  </>
                )}

                {compression.phase !== "idle" && (
                  <StatusDisplay
                    phase={compression.phase}
                    uploadProgress={compression.uploadProgress}
                    job={compression.job}
                    downloadUrl={compression.downloadUrl}
                    error={compression.error}
                    onReset={compression.reset}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "var(--bg)",
  },
  nav: {
    borderBottom: "1px solid var(--border)",
    background: "rgba(9, 11, 17, 0.8)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  navLogo: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "var(--primary-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: "0.95rem",
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  navBadge: {
    fontSize: "0.65rem",
    fontWeight: 600,
    color: "var(--success)",
    background: "var(--success-muted)",
    padding: "0.15rem 0.5rem",
    borderRadius: "20px",
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  pageWrapper: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "clamp(2rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem) clamp(3rem, 8vw, 6rem)",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
    animation: "fadeIn 0.4s ease-out",
  },
  sidebarSection: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  sidebarTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    letterSpacing: "-0.025em",
    lineHeight: 1.2,
  },
  sidebarDesc: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    lineHeight: 1.7,
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.85rem",
  },
  featureIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "var(--surface-raised)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--primary)",
    flexShrink: 0,
  },
  featureLabel: {
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  featureDesc: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  formatBadges: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    flexWrap: "wrap",
  },
  fmtBadge: {
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    padding: "0.3rem 0.6rem",
    borderRadius: "6px",
    background: "var(--surface-raised)",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
  },
  fmtBadgeOut: {
    background: "var(--primary-muted)",
    borderColor: "rgba(99,102,241,0.3)",
    color: "var(--primary)",
  },
  fmtArrow: {
    color: "var(--text-muted)",
    fontSize: "0.85rem",
    margin: "0 0.15rem",
  },
  main: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    animation: "fadeIn 0.4s ease-out 0.1s both",
  },
  card: {
    background: "var(--surface)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-lg), var(--shadow-glow)",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  cardTitle: {
    fontSize: "1.05rem",
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  cardSubtitle: {
    fontSize: "0.82rem",
    color: "var(--text-muted)",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  button: {
    width: "100%",
    padding: "0.85rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#fff",
    background: "var(--primary)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    transition: "all var(--transition)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 2px rgba(0,0,0,0.2), 0 0 0 1px rgba(99,102,241,0.3)",
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
    boxShadow: "none",
  },
};
