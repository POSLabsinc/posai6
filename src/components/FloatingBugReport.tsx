import { useState, useEffect } from "react";
import { Bug, X } from "lucide-react";
import { toast } from "sonner";

const SENTRY_KEY = "sentry-enabled";

export const useSentryEnabled = () => {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(SENTRY_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handler = () => {
      setEnabled(localStorage.getItem(SENTRY_KEY) === "true");
    };
    window.addEventListener("sentry-toggled", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("sentry-toggled", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return enabled;
};

export const setSentryEnabled = (value: boolean) => {
  localStorage.setItem(SENTRY_KEY, String(value));
  window.dispatchEvent(new Event("sentry-toggled"));
};

const FloatingBugReport = () => {
  const sentryEnabled = useSentryEnabled();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  if (!sentryEnabled) return null;

  const handleSend = () => {
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    setSending(true);
    // Simulate sending
    setTimeout(() => {
      toast.success("Bug report sent successfully!");
      setName("");
      setEmail("");
      setDescription("");
      setShowForm(false);
      setSending(false);
    }, 800);
  };

  if (showForm) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[hsl(199,100%,55%)]">
          <button onClick={() => setShowForm(false)} className="text-white">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-white">Report a Bug</h1>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground text-base outline-none focus:ring-2 focus:ring-[hsl(199,100%,55%)]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.org"
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground text-base outline-none focus:ring-2 focus:ring-[hsl(199,100%,55%)]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Description <span className="text-muted-foreground">(Required)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the bug..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground text-base outline-none focus:ring-2 focus:ring-[hsl(199,100%,55%)] resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 space-y-3">
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full py-3.5 rounded-full bg-[hsl(199,100%,55%)] text-white font-semibold text-base disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send Bug Report"}
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="w-full text-center text-[hsl(199,100%,55%)] font-medium text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="fixed bottom-24 right-4 z-[9998] w-14 h-14 rounded-full bg-[hsl(340,100%,50%)] shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      aria-label="Report a Bug"
    >
      <Bug className="w-6 h-6 text-white" />
    </button>
  );
};

export default FloatingBugReport;
