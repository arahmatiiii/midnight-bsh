const REPO_URL = "https://github.com/arahmatiiii/midnight-bsh";
const APK_URL = `${REPO_URL}/releases/download/apk/midnight-bsh.apk`;

const FEATURES = [
  {
    icon: "👛",
    title: "Wallet auth",
    body: "No email, no password. Connect MetaMask and sign a Sign-In-With-Ethereum message.",
  },
  {
    icon: "🌙",
    title: "Open 9pm–9am",
    body: "Posting and voting are only allowed during the night window. It's enforced server-side, not just in the UI.",
  },
  {
    icon: "🎓",
    title: "Certificates",
    body: 'Silly, self-declared badges like "College Graduate" or "Over 21" that can gate who sees or votes on a post.',
  },
  {
    icon: "📜",
    title: "Nightly archive",
    body: "Every morning the best and worst posts of the night are archived — nothing is deleted, the feed just resets.",
  },
];

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center">
        <div className="mb-4 text-6xl">🌙</div>
        <h1 className="mb-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Midnight <span className="text-accent">BSH</span>
        </h1>
        <p className="mb-8 max-w-xl text-lg text-muted">
          A social app for posting bullshit — but only between 9pm and 9am.
        </p>

        <div className="mb-16 flex flex-wrap items-center justify-center gap-3">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium hover:border-accent"
          >
            View source on GitHub
          </a>
          <a
            href={APK_URL}
            className="rounded-full bg-accent-strong px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            ⬇ Download Android APK
          </a>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="mb-2 text-2xl">{f.icon}</div>
              <h2 className="mb-1 font-semibold">{f.title}</h2>
              <p className="text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-16 max-w-xl text-xs text-muted">
          This page is a static description of the project — the app itself
          needs a Postgres database and a server (see the README for
          self-hosting instructions), so it isn't running live here. The
          Android app above wraps this same page.
        </p>
      </main>
    </div>
  );
}

export default App;
