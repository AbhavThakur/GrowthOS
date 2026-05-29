import { useState, useMemo } from "react";
import { useStore } from "../store/useStore";
import { PROFILES, ZONE_LABELS } from "../data/constants";

const ZONES = ["doorstep", "close", "nearby", "far"];
const READ_ONLY_CAREER_MVP = true;

export default function Companies() {
  const {
    activeProfile,
    getAllCompanies,
    addCompany,
    deleteCompany,
    customCompanies,
  } = useStore();
  const profile = PROFILES[activeProfile];

  const [zoneFilter, setZoneFilter] = useState("all");
  const [topFit, setTopFit] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    area: "",
    dist: "",
    url: "",
    tags: "",
    zone: "close",
    profile: "both",
    priority: 2,
  });

  const allCompanies = getAllCompanies();

  const filtered = useMemo(() => {
    let list = allCompanies.filter(
      (c) => c.profile === activeProfile || c.profile === "both",
    );
    if (zoneFilter !== "all") {
      list = list.filter((c) => c.zone === zoneFilter);
    }
    if (topFit) {
      list = list.filter((c) => c.priority === 3);
    }
    return list.sort((a, b) => a.dist - b.dist);
  }, [allCompanies, activeProfile, zoneFilter, topFit]);

  const getCareerUrl = (company) => {
    const kw = encodeURIComponent(profile.defaultKw);
    return company.url.replace("{{KW}}", kw);
  };

  const handleAdd = () => {
    if (!form.name.trim() || !form.url.trim()) return;
    addCompany({
      name: form.name,
      area: form.area,
      dist: Number(form.dist) || 0,
      url: form.url,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      zone: form.zone,
      profile: form.profile,
      priority: Number(form.priority),
    });
    setShowModal(false);
    setForm({
      name: "",
      area: "",
      dist: "",
      url: "",
      tags: "",
      zone: "close",
      profile: "both",
      priority: 2,
    });
  };

  const isCustom = (name) => customCompanies.some((c) => c.name === name);

  return (
    <div className="companies-page">
      <div className="page-header">
        <h2>🏢 Target Companies</h2>
        <div className="header-actions">
          <div className="filter-bar">
            <button
              className={`filter-btn${zoneFilter === "all" ? " active" : ""}`}
              onClick={() => setZoneFilter("all")}
            >
              All
            </button>
            {ZONES.map((z) => (
              <button
                key={z}
                className={`filter-btn${zoneFilter === z ? " active" : ""}`}
                onClick={() => setZoneFilter(z)}
              >
                {ZONE_LABELS[z].split(" ")[0]}
              </button>
            ))}
            <button
              className={`filter-btn${topFit ? " active" : ""}`}
              onClick={() => setTopFit(!topFit)}
            >
              ⭐ Top Fit
            </button>
          </div>
          {!READ_ONLY_CAREER_MVP && (
            <button
              className="btn btn-accent"
              onClick={() => setShowModal(true)}
            >
              ＋ Add Company
            </button>
          )}
        </div>
      </div>

      <p className="filter-summary">
        Showing {filtered.length} companies for {profile.name}
        {zoneFilter !== "all" && ` · ${ZONE_LABELS[zoneFilter]}`}
        {topFit && " · Top Priority Only"}
      </p>

      {/* Company Grid */}
      <div className="company-grid">
        {filtered.map((c) => (
          <div key={c.name} className={`company-card zone-${c.zone}`}>
            <div className="ccard-top">
              <strong>{c.name}</strong>
              <div className="priority-dots">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`dot${i <= c.priority ? " filled" : ""}`}
                  />
                ))}
              </div>
            </div>
            <span className="ccard-area">
              📍 {c.area} · {c.dist}km
            </span>
            <div className="ccard-tags">
              {(c.tags || []).map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
            <div className="ccard-bottom">
              <a
                href={getCareerUrl(c)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
              >
                Careers →
              </a>
              {!READ_ONLY_CAREER_MVP && isCustom(c.name) && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => deleteCompany(c.name)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>No companies match the current filters.</p>
        </div>
      )}

      {/* Add Company Modal */}
      {!READ_ONLY_CAREER_MVP && showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Company</h3>
            <div className="form-grid">
              <div className="field">
                <label>Company Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              <div className="field">
                <label>Careers URL *</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://... (use {{KW}} for keyword)"
                />
              </div>
              <div className="field">
                <label>Area</label>
                <input
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  placeholder="e.g. Koramangala"
                />
              </div>
              <div className="field">
                <label>Distance (km)</label>
                <input
                  type="number"
                  value={form.dist}
                  onChange={(e) => setForm({ ...form, dist: e.target.value })}
                  placeholder="e.g. 5"
                />
              </div>
              <div className="field">
                <label>Zone</label>
                <select
                  value={form.zone}
                  onChange={(e) => setForm({ ...form, zone: e.target.value })}
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      {ZONE_LABELS[z]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Profile</label>
                <select
                  value={form.profile}
                  onChange={(e) =>
                    setForm({ ...form, profile: e.target.value })
                  }
                >
                  <option value="both">Both</option>
                  <option value="abhav">Abhav</option>
                  <option value="wife">Wife (PM)</option>
                </select>
              </div>
              <div className="field">
                <label>Priority (1-3)</label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: Number(e.target.value) })
                  }
                >
                  <option value="1">1 - Low</option>
                  <option value="2">2 - Medium</option>
                  <option value="3">3 - High</option>
                </select>
              </div>
              <div className="field">
                <label>Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. RN, Fintech, PM"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-accent" onClick={handleAdd}>
                Add Company
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
