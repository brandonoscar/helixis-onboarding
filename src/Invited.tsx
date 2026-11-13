import { useEffect, useState } from "react";
import { releaseSessionForHandOff, supabase } from "./lib/supabase";
import { APP_URL } from "./lib/urls";
import { handOffUrl, PORTAL_METADATA, type Arrival } from "./lib/invite";
import { Wordmark } from "./Site";

// ─────────────────────────────────────────────────────────
// "I WAS INVITED": AN OWNER'S OR A TENANT'S WAY IN
//
// Staff of a property manager invite an owner or a tenant from their books;
// the email's link opens this page with the invite's token in the fragment,
// which main.tsx has already taken out of the address (lib/invite.ts). Here
// the person proves the email is theirs with an emailed code, which signs up
// a new account or signs in an existing one alike, and is handed to the app
// signed in, the invite beside the session. The app checks the invite was
// sent to this email, asks for their phone and whether the company may text
// them (in the books' own words, the company named: only a page on the
// books' origin can ask the books whose invite it is), and opens their portal.
//
// ⚠ A NEW ACCOUNT IS MARKED AS A PORTAL PERSON (user_metadata, through
// signInWithOtp's options.data, which GoTrue writes only at creation). The
// mark only ever WITHHOLDS: no company of their own, no workspace bootstrap
// (AgenticHelixis src/helixis/portal_people.py). An existing account keeps
// whatever it has; the invite links it to the portal and touches nothing else.
//
// ⚠ NEVER /start's bootstrap here, and nothing about a company: an owner or a
// tenant is never made the admin of one (AgenticHelixis ADR-one-product,
// decision 5).
// ─────────────────────────────────────────────────────────

const css = `
  .inv {
    min-height: 100vh; display: grid; place-items: center; padding: 24px 16px;
    background: var(--canvas-1); color: var(--ink);
    font-family: 'IBM Plex Sans Variable', 'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
    font-size: 16px; line-height: 1.55;
  }
  .inv-card {
    width: 100%; max-width: 440px; background: var(--canvas);
    border: 1px solid var(--line); border-radius: var(--r-lg); padding: 36px 28px;
  }
  .inv-word { font-family: 'Fraunces Variable', Georgia, serif; font-size: 22px; color: var(--ink); text-decoration: none; }
  .inv h1 { font-family: 'Fraunces Variable', Georgia, serif; font-weight: 500; font-size: 28px; line-height: 1.2; margin: 24px 0 8px; }
  .inv-sub { color: var(--ink-muted); font-size: 15px; margin-bottom: 24px; }
  .inv label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; }
  .inv input {
    width: 100%; height: 44px; padding: 0 12px; font: inherit; color: var(--ink);
    border: 1px solid var(--line-strong); border-radius: var(--r-sm); background: var(--canvas);
  }
  .inv input:focus { outline: none; border-color: var(--line-focus); box-shadow: 0 0 0 3px var(--iris-ring); }
  .inv-hint { color: var(--ink-muted); font-size: 13px; margin-top: 6px; }
  .inv-code { letter-spacing: 0.3em; font-variant-numeric: tabular-nums; }
  .inv .btn { width: 100%; margin-top: 20px; height: 44px; }
  .inv-error { margin-top: 14px; color: var(--danger); font-size: 14px; }
  .inv-note { margin-top: 14px; color: var(--ink-muted); font-size: 14px; }
  .inv-alts { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 4px 16px; }
  .inv-alts button { background: none; border: 0; padding: 0; font: inherit; font-size: 14px; color: var(--iris); cursor: pointer; }
  .inv-alts button:disabled { color: var(--ink-muted); cursor: default; }
  .inv-foot { margin-top: 24px; color: var(--ink-muted); font-size: 13px; }
  .inv-foot a { color: var(--ink-muted); }
`;

/** Every sentence the page says, so the tests read the words a person reads. */
export const SAY = {
  title: "You're invited",
  lead: "Your property manager invited you to their owner and tenant portal.",
  emailHint: "Use the email your invite was sent to.",
  broken: "This link is broken. Ask your property manager for a new invite.",
  signInLink:
    "That sign-in link can't carry your invite. Open the invite in your property manager's email again, then type the 6-digit code we send you.",
  codeSent: (email: string) => `We sent a 6-digit code to ${email}.`,
  wrongCode: "That code didn't match. Check it, or send a new one.",
  opening: "Opening your portal…",
} as const;

type Step = "email" | "code" | "opening";

export default function Invited({ arrival }: { arrival: Arrival }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    document.title = "Your invite | Occupella";
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const sendCode = async () => {
    const to = email.trim();
    if (!to.includes("@") || loading) return;
    setLoading(true);
    setError("");
    const { error: e } = await supabase.auth.signInWithOtp({
      email: to,
      options: {
        // The emailed link, if clicked instead of typing the code, comes back here and is
        // told to use the code: it can't carry the invite (lib/invite.ts readArrival).
        emailRedirectTo: window.location.origin + "/invited",
        // Written only when this makes the account. Withholds only (see the note above).
        data: { ...PORTAL_METADATA },
      },
    });
    setLoading(false);
    if (e) {
      setError(e.message);
      return;
    }
    setStep("code");
    setCooldown(45);
  };

  const verify = async () => {
    if (arrival.kind !== "invite") return;
    const typed = code.replace(/\D/g, "");
    if (typed.length !== 6 || loading) return;
    setLoading(true);
    setError("");
    const { data, error: e } = await supabase.auth.verifyOtp({ email: email.trim(), token: typed, type: "email" });
    if (e || !data.session) {
      setLoading(false);
      setError(SAY.wrongCode);
      return;
    }
    setStep("opening");
    const url = handOffUrl(APP_URL, data.session, arrival.token);
    // Let go of this origin's copy without ending the session the app now holds (lib/supabase).
    releaseSessionForHandOff();
    // `replace`: Back must not return to a page whose invite already left it.
    window.location.replace(url);
  };

  const usable = arrival.kind === "invite";

  return (
    <div className="inv">
      <style>{css}</style>
      <main className="inv-card">
        <Wordmark className="inv-word" />
        {!usable ? (
          <>
            <h1>This invite can't be opened</h1>
            <p className="inv-sub" role="alert">
              {arrival.kind === "sign-in-link" ? SAY.signInLink : SAY.broken}
            </p>
          </>
        ) : step === "email" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode();
            }}
          >
            <h1>{SAY.title}</h1>
            <p className="inv-sub">{SAY.lead}</p>
            <label htmlFor="inv-email">Email</label>
            <input
              id="inv-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              aria-describedby="inv-email-hint"
              autoFocus
            />
            <p className="inv-hint" id="inv-email-hint">
              {SAY.emailHint}
            </p>
            {error && (
              <p className="inv-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-primary" type="submit" disabled={!email.includes("@") || loading}>
              {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : step === "code" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void verify();
            }}
          >
            <h1>Check your email</h1>
            <p className="inv-sub">{SAY.codeSent(email.trim())}</p>
            <label htmlFor="inv-code">6-digit code</label>
            <input
              id="inv-code"
              className="inv-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={12}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              autoFocus
            />
            {error && (
              <p className="inv-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-primary" type="submit" disabled={code.replace(/\D/g, "").length !== 6 || loading}>
              {loading ? "Checking…" : "Continue"}
            </button>
            <div className="inv-alts">
              <button type="button" onClick={() => void sendCode()} disabled={cooldown > 0 || loading}>
                {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
              >
                Use a different email
              </button>
            </div>
          </form>
        ) : (
          <>
            <h1>{SAY.opening}</h1>
            <p className="inv-note" role="status">
              One more step there: your phone number.
            </p>
          </>
        )}
        <p className="inv-foot">
          Your property manager runs their portal on Occupella. <a href="/privacy">Privacy policy</a>
        </p>
      </main>
    </div>
  );
}
