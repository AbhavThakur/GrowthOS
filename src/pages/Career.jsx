import { useState } from "react";
import { useStore } from "../store/useStore";
import useLocalStorage from "../hooks/useLocalStorage";
import { PROFILES } from "../data/constants";
import Dashboard from "./Dashboard";
import Search from "./Search";
import Jobs from "./Jobs";
import Tracker from "./Tracker";
import Companies from "./Companies";

const SUB_PAGES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "search", label: "Search" },
  { id: "jobs", label: "Jobs" },
  { id: "tracker", label: "Tracker" },
  { id: "companies", label: "Companies" },
];

export default function Career() {
  const [subPage, setSubPage] = useState("dashboard");
  const { activeProfile, switchProfile } = useStore();

  const [dsaTopics, setDsaTopics] = useLocalStorage("growthOS_dsa_topics", []);
  const [newTopic, setNewTopic] = useState("");
  const [newStatus, setNewStatus] = useState("Pending");

  const handleAddDsa = () => {
    if (!newTopic.trim()) return;
    setDsaTopics((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        topic: newTopic.trim(),
        status: newStatus,
        lastRevised: new Date().toISOString(),
      },
    ]);
    setNewTopic("");
  };

  const updateDsaStatus = (id, newStatusVal) => {
    setDsaTopics((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: newStatusVal,
              lastRevised: new Date().toISOString(),
            }
          : t,
      ),
    );
  };

  return (
    <div style={styles.page}>
      {/* Profile switcher + sub-tab bar */}
      <div style={styles.header}>
        <div style={styles.tabs}>
          {SUB_PAGES.map(({ id, label }) => (
            <button
              key={id}
              className={`nav-tab${subPage === id ? " active" : ""}`}
              onClick={() => setSubPage(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="profile-switcher">
          {Object.keys(PROFILES).map((id) => (
            <button
              key={id}
              className={`profile-btn${activeProfile === id ? " active" : ""}`}
              onClick={() => switchProfile(id)}
            >
              {PROFILES[id].name}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-page content */}
      <div style={styles.subPageWrapper}>
        {subPage === "dashboard" && <Dashboard onNavigate={setSubPage} />}
        {subPage === "search" && <Search />}
        {subPage === "jobs" && <Jobs />}
        {subPage === "tracker" && <Tracker />}
        {subPage === "companies" && <Companies />}
      </div>

      {/* DSA Tracker Section */}
      <div style={styles.dsaSection}>
        <h3 style={styles.dsaTitle}>DSA &amp; Interview Prep</h3>

        <div style={styles.dsaForm}>
          <input
            type="text"
            placeholder="New topic (e.g. Graph BFS)"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            style={styles.dsaInput}
            onKeyDown={(e) => e.key === "Enter" && handleAddDsa()}
          />
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            style={styles.dsaSelect}
          >
            <option value="Pending">Pending</option>
            <option value="Revised">Revised</option>
            <option value="Confident">Confident</option>
          </select>
          <button style={styles.dsaBtn} onClick={handleAddDsa}>
            Add Topic
          </button>
        </div>

        <div style={styles.dsaList}>
          {dsaTopics.length === 0 && (
            <div style={styles.empty}>No topics added yet.</div>
          )}
          {dsaTopics.map((t) => {
            let statusColor = "var(--text2)";
            if (t.status === "Confident") statusColor = "var(--green)";
            if (t.status === "Revised") statusColor = "var(--teal)";
            if (t.status === "Pending") statusColor = "var(--amber)";

            return (
              <div key={t.id} style={styles.dsaItem}>
                <div style={styles.dsaItemMain}>
                  <strong style={styles.dsaItemTitle}>{t.topic}</strong>
                  <span style={styles.dsaDate}>
                    Last revised: {new Date(t.lastRevised).toLocaleDateString()}
                  </span>
                </div>
                <select
                  value={t.status}
                  onChange={(e) => updateDsaStatus(t.id, e.target.value)}
                  style={{
                    ...styles.dsaSelectInline,
                    color: statusColor,
                    borderColor: statusColor,
                  }}
                >
                  <option value="Pending" style={{ color: "var(--text)" }}>
                    Pending
                  </option>
                  <option value="Revised" style={{ color: "var(--text)" }}>
                    Revised
                  </option>
                  <option value="Confident" style={{ color: "var(--text)" }}>
                    Confident
                  </option>
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 32,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  tabs: {
    display: "flex",
    gap: 2,
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 3,
  },
  subPageWrapper: {
    minHeight: 400,
  },
  dsaSection: {
    background: "var(--surface-solid)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  dsaTitle: {
    fontFamily: "var(--sans)",
    fontSize: 18,
    fontWeight: 700,
    color: "var(--text)",
  },
  dsaForm: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  dsaInput: {
    flex: 1,
    minWidth: 200,
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    padding: "10px 14px",
    borderRadius: "var(--radius-sm)",
    color: "var(--text)",
    fontFamily: "var(--sans)",
    fontSize: 14,
    outline: "none",
  },
  dsaSelect: {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    padding: "10px 14px",
    borderRadius: "var(--radius-sm)",
    color: "var(--text)",
    fontFamily: "var(--sans)",
    fontSize: 14,
    outline: "none",
  },
  dsaBtn: {
    background: "var(--teal)",
    color: "#0d0f12",
    fontWeight: 600,
    padding: "10px 20px",
    borderRadius: "var(--radius-sm)",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "var(--sans)",
  },
  empty: {
    color: "var(--muted)",
    fontSize: 14,
    fontStyle: "italic",
    padding: "12px 0",
  },
  dsaList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 8,
  },
  dsaItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--surface2)",
    padding: "12px 16px",
    borderRadius: "var(--radius-sm)",
    gap: 16,
  },
  dsaItemMain: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  dsaItemTitle: {
    fontSize: 15,
    color: "var(--text)",
    fontWeight: 600,
  },
  dsaDate: {
    fontSize: 11,
    color: "var(--muted)",
  },
  dsaSelectInline: {
    background: "transparent",
    borderWidth: "1px",
    borderStyle: "solid",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    outline: "none",
    cursor: "pointer",
  },
};
