import { FormEvent, useEffect, useMemo, useState } from "react";

type View = "overview" | "connection";

type ConnectionResult = {
  reachable: boolean;
  remoteApiUrl: string;
  status: number | null;
  authenticationRequired: boolean;
};

const REMOTE_API_KEY = "eternal-dodjo.desktop.remote-api-url";

function readStoredApiUrl() {
  return window.localStorage.getItem(REMOTE_API_KEY) ?? "";
}

export default function App() {
  const [view, setView] = useState<View>("overview");
  const [appVersion, setAppVersion] = useState("0.1.0");
  const [remoteApiUrl, setRemoteApiUrl] = useState(readStoredApiUrl);
  const [connection, setConnection] = useState<ConnectionResult | null>(null);
  const [message, setMessage] = useState("Loading desktop shell…");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    void window.eternalDesktop.getRuntimeInfo().then((runtime) => {
      setAppVersion(runtime.appVersion);
      setRemoteApiUrl((stored) => stored || runtime.defaultRemoteApiUrl);
      setMessage("Desktop shell ready. Remote work stays behind the Eternal Dodjo API.");
    });
  }, []);

  const remoteAppUrl = useMemo(() => {
    try {
      return new URL(remoteApiUrl).origin;
    } catch {
      return "";
    }
  }, [remoteApiUrl]);

  async function checkConnection(event?: FormEvent) {
    event?.preventDefault();
    setChecking(true);
    setConnection(null);
    setMessage("Checking the remote API boundary…");

    try {
      const result = await window.eternalDesktop.probeRemoteApi(remoteApiUrl);
      setConnection(result);
      window.localStorage.setItem(REMOTE_API_KEY, result.remoteApiUrl);
      setRemoteApiUrl(result.remoteApiUrl);
      setMessage(
        result.reachable
          ? result.authenticationRequired
            ? "Remote API is reachable and correctly requests a signed session."
            : "Remote API is reachable."
          : "The remote API did not respond. Your local desktop settings are unchanged.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Connection settings could not be checked.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="desktop-shell">
      <aside className="desktop-rail" aria-label="Desktop navigation">
        <div className="mark" aria-hidden="true">道場</div>
        <p className="rail-title">ETERNAL DODJO</p>
        <p className="rail-subtitle">DESKTOP LINE</p>

        <nav className="rail-nav">
          <button
            className={view === "overview" ? "nav-item active" : "nav-item"}
            onClick={() => setView("overview")}
            type="button"
          >
            <span>01</span> Overview
          </button>
          <button
            className={view === "connection" ? "nav-item active" : "nav-item"}
            onClick={() => setView("connection")}
            type="button"
          >
            <span>02</span> Connection
          </button>
        </nav>

        <div className="rail-footer">
          <span className="status-dot" /> Desktop {appVersion}
        </div>
      </aside>

      <section className="desktop-workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">PRIVATE PRACTICE · LOCAL SHELL</p>
            <h1>{view === "overview" ? "Keep the line visible." : "Connection boundary."}</h1>
          </div>
          <span className="platform-chip">ELECTRON DESKTOP</span>
        </header>

        {view === "overview" ? (
          <section className="overview-grid">
            <article className="hero-card">
              <p className="eyebrow accent">DESKTOP COMPANION</p>
              <h2>A focused surface for the same practice system.</h2>
              <p>
                This desktop shell deliberately does not open a database connection. It reaches shared data only through the existing Eternal Dodjo API, which keeps the Neon database and production secrets off the device.
              </p>
              <div className="hero-actions">
                {remoteAppUrl ? (
                  <a className="primary-action" href={remoteAppUrl} target="_blank" rel="noreferrer">
                    Open secure web session
                  </a>
                ) : (
                  <button className="primary-action" type="button" onClick={() => setView("connection")}>
                    Configure connection
                  </button>
                )}
                <button className="secondary-action" type="button" onClick={() => setView("connection")}>
                  Review remote boundary
                </button>
              </div>
            </article>

            <article className="signal-card">
              <p className="eyebrow teal">REMOTE DATA RULE</p>
              <h3>API first, database never.</h3>
              <dl>
                <div><dt>Desktop keeps</dt><dd>only a chosen HTTPS API origin</dd></div>
                <div><dt>Remote service keeps</dt><dd>authentication, sessions and data access</dd></div>
                <div><dt>Future sync</dt><dd>can extend through authenticated API routes</dd></div>
              </dl>
            </article>

            <article className="status-card">
              <p className="eyebrow gold">CURRENT STATE</p>
              <h3>{connection?.reachable ? "Remote path checked" : "Remote path unverified"}</h3>
              <p>{message}</p>
              <button className="quiet-button" type="button" onClick={() => setView("connection")}>
                {connection?.reachable ? "Review connection" : "Check connection"}
              </button>
            </article>
          </section>
        ) : (
          <section className="connection-layout">
            <article className="connection-card">
              <p className="eyebrow accent">REMOTE API CONFIGURATION</p>
              <h2>Bind the desktop shell to the service, not to the database.</h2>
              <p>
                Use the HTTPS origin of the Eternal Dodjo API. The setting is stored locally on this device; it contains no password, database URL, cookie or API secret.
              </p>

              <form onSubmit={checkConnection} className="connection-form">
                <label htmlFor="remote-api-url">Remote API origin</label>
                <input
                  id="remote-api-url"
                  value={remoteApiUrl}
                  onChange={(event) => setRemoteApiUrl(event.target.value)}
                  inputMode="url"
                  placeholder="https://your-eternal-dodjo-api.example"
                  spellCheck="false"
                  required
                />
                <div className="connection-actions">
                  <button className="primary-action" type="submit" disabled={checking}>
                    {checking ? "Checking…" : "Check API boundary"}
                  </button>
                  {remoteAppUrl && (
                    <a className="secondary-action" href={remoteAppUrl} target="_blank" rel="noreferrer">
                      Open hosted login
                    </a>
                  )}
                </div>
              </form>
            </article>

            <aside className="connection-result" aria-live="polite">
              <p className="eyebrow teal">CONNECTION STATUS</p>
              <h3>{connection?.reachable ? "Reachable" : "Waiting for a check"}</h3>
              <p>{message}</p>
              {connection && (
                <dl>
                  <div><dt>Origin</dt><dd>{connection.remoteApiUrl}</dd></div>
                  <div><dt>Response</dt><dd>{connection.status ?? "No response"}</dd></div>
                  <div><dt>Session gate</dt><dd>{connection.authenticationRequired ? "Protected" : "Not confirmed"}</dd></div>
                </dl>
              )}
            </aside>
          </section>
        )}
      </section>
    </main>
  );
}
