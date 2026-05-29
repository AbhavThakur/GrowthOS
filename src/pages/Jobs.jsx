import { useEffect, useMemo, useState } from "react";
import {
  Database,
  ExternalLink,
  FileDown,
  FileText,
  Search,
} from "lucide-react";
import {
  CAREER_ROLES,
  DEFAULT_CAREER_ROLE_ID,
  getCareerRole,
} from "../data/careerRoles";
import {
  createCareerSearchRun,
  getCareerStorageUrl,
  seedCareerData,
  subscribeCareerJobs,
  subscribeCareerSearchRun,
} from "../services/careerData";
import { useAuth } from "../context/AuthContext";

function formatDate(value) {
  if (!value) return "-";
  const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);

  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function StorageLink({ directUrl, storagePath, children, icon: Icon }) {
  const [resolved, setResolved] = useState({ storagePath: "", url: "" });

  useEffect(() => {
    let cancelled = false;

    if (directUrl || !storagePath) return undefined;

    getCareerStorageUrl(storagePath)
      .then((nextUrl) => {
        if (!cancelled) setResolved({ storagePath, url: nextUrl || "" });
      })
      .catch(() => {
        if (!cancelled) setResolved({ storagePath, url: "" });
      });

    return () => {
      cancelled = true;
    };
  }, [directUrl, storagePath]);

  const url =
    directUrl || (resolved.storagePath === storagePath ? resolved.url : "");

  if (!url) return null;

  return (
    <a
      className="btn btn-sm btn-secondary"
      href={url}
      target="_blank"
      rel="noreferrer"
    >
      {Icon && <Icon size={14} />}
      {children}
    </a>
  );
}

function JobCard({ job }) {
  const roleLabels = Array.isArray(job.roleIds)
    ? job.roleIds
        .map((roleId) => getCareerRole(roleId)?.label)
        .filter(Boolean)
        .join(", ")
    : "";
  const companyName = job.companyName || job.company || "Unknown company";
  const scannedAt = job.lastScannedAt || job.firstSeenAt;

  return (
    <article className="job-card">
      <div className="job-card-main">
        <div>
          <h3>{job.title || "Untitled role"}</h3>
          <p className="job-company">
            {companyName}
            {job.location ? ` · ${job.location}` : ""}
          </p>
        </div>
        <span className={`job-status status-${job.status || "new"}`}>
          {job.status || "new"}
        </span>
      </div>

      <div className="job-meta-grid">
        <span>Role: {roleLabels || "-"}</span>
        <span>Score: {typeof job.score === "number" ? job.score : "-"}</span>
        <span>Source: {job.sourcePortal || job.source || "career-ops"}</span>
        <span>Scanned: {formatDate(scannedAt)}</span>
      </div>

      {job.notes && <p className="job-notes">{job.notes}</p>}

      <div className="job-card-actions">
        {job.applyUrl && (
          <a
            className="btn btn-sm btn-accent"
            href={job.applyUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={14} />
            Apply
          </a>
        )}
        <StorageLink
          directUrl={job.reportUrl}
          storagePath={job.reportStoragePath}
          icon={FileText}
        >
          Report
        </StorageLink>
        <StorageLink
          directUrl={job.pdfUrl}
          storagePath={job.pdfStoragePath}
          icon={FileDown}
        >
          PDF
        </StorageLink>
      </div>
    </article>
  );
}

export default function Jobs() {
  const { user } = useAuth();
  const isSignedIn = user && !user.isOffline;
  const [roleId, setRoleId] = useState(DEFAULT_CAREER_ROLE_ID);
  const [queryText, setQueryText] = useState("");
  const [location, setLocation] = useState("Bengaluru");
  const [radiusKm, setRadiusKm] = useState(20);
  const [jobs, setJobs] = useState([]);
  const [searchRunId, setSearchRunId] = useState("");
  const [searchRun, setSearchRun] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(
    !isSignedIn ? false : true,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const role = getCareerRole(roleId);
    setQueryText(role?.keywords?.[0] || "");
  }, [roleId]);

  useEffect(() => {
    if (!isSignedIn) {
      setJobs([]);
      setIsLoadingJobs(false);
      return undefined;
    }

    setIsLoadingJobs(true);
    setError("");

    return subscribeCareerJobs(
      roleId,
      (nextJobs) => {
        setJobs(nextJobs);
        setIsLoadingJobs(false);
      },
      (err) => {
        setError(err.message);
        setIsLoadingJobs(false);
      },
    );
  }, [roleId, isSignedIn]);

  useEffect(() => {
    if (!searchRunId) return undefined;

    return subscribeCareerSearchRun(searchRunId, setSearchRun, (err) =>
      setError(err.message),
    );
  }, [searchRunId]);

  const visibleJobs = useMemo(() => {
    const normalizedQuery = queryText.trim().toLowerCase();
    if (!normalizedQuery) return jobs;

    return jobs.filter((job) => {
      const text = [
        job.title,
        job.companyName,
        job.company,
        job.location,
        job.notes,
        job.sourcePortal,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(normalizedQuery);
    });
  }, [jobs, queryText]);

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!queryText.trim()) {
      setError("Enter a search query.");
      return;
    }

    setIsSearching(true);
    setError("");

    try {
      const nextSearchRunId = await createCareerSearchRun({
        roleId,
        query: queryText,
        location,
        radiusKm,
      });
      setSearchRunId(nextSearchRunId);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
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
    <div className="jobs-page">
      <div className="page-header">
        <h2>Jobs Search</h2>
        <p className="subtitle">
          Trigger async career-ops searches and review read-only results.
        </p>
      </div>

      <form className="card jobs-search-form" onSubmit={handleSubmit}>
        <div className="search-row">
          <div className="field">
            <label>Role</label>
            <select
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
            >
              {CAREER_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field grow">
            <label>Search</label>
            <input
              value={queryText}
              onChange={(event) => setQueryText(event.target.value)}
              placeholder="React Native, Product Manager..."
            />
          </div>
          <div className="field">
            <label>Location</label>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Bengaluru"
            />
          </div>
          <div className="field jobs-radius-field">
            <label>Radius KM</label>
            <input
              min="1"
              type="number"
              value={radiusKm}
              onChange={(event) => setRadiusKm(event.target.value)}
            />
          </div>
        </div>
        <button
          className="btn btn-accent"
          type="submit"
          disabled={isSearching || !isSignedIn}
        >
          <Search size={15} />
          {isSearching ? "Starting search..." : "Start async search"}
        </button>
      </form>

      {!isSignedIn && (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <p>
            Sign in with Google to search jobs and view results from Firestore.
          </p>
        </div>
      )}

      {isSignedIn && jobs.length === 0 && !isLoadingJobs && (
        <div
          className="card"
          style={{ textAlign: "center", padding: "1.5rem" }}
        >
          <p style={{ marginBottom: "0.75rem" }}>
            No jobs in Firestore yet. Seed existing career-ops data?
          </p>
          <button
            className="btn btn-accent"
            onClick={handleSeed}
            disabled={isSeeding}
          >
            <Database size={15} />
            {isSeeding ? "Seeding..." : "Seed jobs from career-ops"}
          </button>
          {seedResult && (
            <p style={{ marginTop: "0.75rem", color: "var(--accent)" }}>
              Synced {seedResult.syncedCount} jobs ({seedResult.loadedCount}{" "}
              loaded, {seedResult.matchedCount} matched)
            </p>
          )}
        </div>
      )}

      {searchRun && (
        <div className="card search-status-card">
          <div>
            <h3>Latest Search</h3>
            <p>Status: {searchRun.status}</p>
          </div>
          <div>
            <span className="stat-num">{searchRun.resultCount || 0}</span>
            <span className="stat-label">Results</span>
          </div>
          {searchRun.error && <p className="job-error">{searchRun.error}</p>}
        </div>
      )}

      {error && (
        <div className="empty-state job-error" role="alert">
          {error}
        </div>
      )}

      <div className="jobs-results-header">
        <h3>Results</h3>
        <span>{visibleJobs.length} jobs</span>
      </div>

      {isLoadingJobs && <div className="empty-state">Loading jobs...</div>}

      {!isLoadingJobs && visibleJobs.length === 0 && (
        <div className="empty-state">
          No jobs found for this role/search yet.
        </div>
      )}

      <div className="jobs-list">
        {visibleJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
