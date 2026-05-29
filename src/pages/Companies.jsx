import { useEffect, useMemo, useState } from "react";
import { Database } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PROFILES, ZONE_LABELS } from "../data/constants";
import { seedCareerData, subscribeCareerCompanies } from "../services/careerData";
import { useStore } from "../store/useStore";

const ZONES = ["doorstep", "close", "nearby", "far"];
const PROFILE_ROLE_IDS = {
  abhav: "mobile_frontend",
  wife: "product_manager",
};

function formatDate(value) {
  if (!value) return "-";
  const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

function matchesProfile(company, activeProfile) {
  if (company.profile === activeProfile || company.profile === "both") return true;
  const roleId = PROFILE_ROLE_IDS[activeProfile];
  return Array.isArray(company.roleIds) && company.roleIds.includes(roleId);
}

export default function Companies() {
  const { user } = useAuth();
  const isSignedIn = user && !user.isOffline;
  const { activeProfile } = useStore();
  const profile = PROFILES[activeProfile];

  const [companies, setCompanies] = useState([]);
  const [zoneFilter, setZoneFilter] = useState("all");
  const [topFit, setTopFit] = useState(false);
  const [isLoading, setIsLoading] = useState(isSignedIn);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSignedIn) {
      setCompanies([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setError("");
    return subscribeCareerCompanies(
      "all",
      (nextCompanies) => {
        setCompanies(nextCompanies);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
    );
  }, [isSignedIn]);

  const filtered = useMemo(() => {
    let list = companies.filter((company) =>
      matchesProfile(company, activeProfile),
    );
    if (zoneFilter !== "all") {
      list = list.filter((company) => company.zone === zoneFilter);
    }
    if (topFit) {
      list = list.filter((company) => company.priority === 3);
    }
    return [...list].sort((a, b) => (a.dist || 0) - (b.dist || 0));
  }, [companies, activeProfile, zoneFilter, topFit]);

  const getCareerUrl = (company) => {
    const kw = encodeURIComponent(profile.defaultKw);
    return String(company.url || "#").replace("{{KW}}", kw);
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setError("");
    setSeedResult(null);
    try {
      const result = await seedCareerData();
      setSeedResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="page-header">
        <h2>Target Companies</h2>
        <div className="header-actions">
          <div className="filter-bar">
            <button
              className={`filter-btn${zoneFilter === "all" ? " active" : ""}`}
              onClick={() => setZoneFilter("all")}
            >
              All
            </button>
            {ZONES.map((zone) => (
              <button
                key={zone}
                className={`filter-btn${zoneFilter === zone ? " active" : ""}`}
                onClick={() => setZoneFilter(zone)}
              >
                {ZONE_LABELS[zone].split(" ")[1] || zone}
              </button>
            ))}
            <button
              className={`filter-btn${topFit ? " active" : ""}`}
              onClick={() => setTopFit(!topFit)}
            >
              Top Fit
            </button>
          </div>
        </div>
      </div>

      <p className="filter-summary">
        Showing {filtered.length} companies for {profile.name}
        {zoneFilter !== "all" && ` · ${ZONE_LABELS[zoneFilter]}`}
        {topFit && " · Top Priority Only"}
      </p>

      {!isSignedIn && (
        <div className="empty-state">
          Sign in with email/password or Google to view Firestore career companies.
        </div>
      )}

      {isSignedIn && companies.length === 0 && !isLoading && (
        <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
          <p style={{ marginBottom: "0.75rem" }}>
            No companies in Firestore yet. Seed target companies and jobs?
          </p>
          <button
            className="btn btn-accent"
            onClick={handleSeed}
            disabled={isSeeding}
          >
            <Database size={15} />
            {isSeeding ? "Seeding..." : "Seed career data"}
          </button>
          {seedResult && (
            <p style={{ marginTop: "0.75rem", color: "var(--accent)" }}>
              Synced {seedResult.syncedCompanies} companies and {seedResult.syncedJobs} jobs.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="empty-state job-error" role="alert">
          {error}
        </div>
      )}

      {isLoading && <div className="empty-state">Loading companies...</div>}

      <div className="company-grid">
        {filtered.map((company) => (
          <div key={company.id || company.name} className={`company-card zone-${company.zone}`}>
            <div className="ccard-top">
              <strong>{company.name}</strong>
              <div className="priority-dots">
                {[1, 2, 3].map((level) => (
                  <span
                    key={level}
                    className={`dot${level <= (company.priority || 1) ? " filled" : ""}`}
                  />
                ))}
              </div>
            </div>
            <span className="ccard-area">
              {company.area || "Bengaluru"} · {company.dist ?? "-"}km
            </span>
            <div className="ccard-tags">
              {(company.tags || []).slice(0, 5).map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <div className="job-meta-grid">
              <span>Last scanned: {formatDate(company.lastScannedAt || company.updatedAt)}</span>
              <span>Roles: {(company.roleIds || []).length || "-"}</span>
            </div>
            <div className="ccard-bottom">
              <a
                href={getCareerUrl(company)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
              >
                Careers
              </a>
            </div>
          </div>
        ))}
      </div>

      {isSignedIn && !isLoading && filtered.length === 0 && companies.length > 0 && (
        <div className="empty-state">
          <p>No companies match the current filters.</p>
        </div>
      )}
    </div>
  );
}
