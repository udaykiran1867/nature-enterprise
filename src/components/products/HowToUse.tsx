import { Camera, ExternalLink, Play } from "lucide-react";
import type { ReactNode } from "react";

const URL_RE = /(https?:\/\/[^\s<>"']+)/g;
const TRAILING = /[.,;:!?)\]]+$/;

function hostOf(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.hostname.replace(/^www\./, "").toLowerCase() : null;
  } catch { return null; }
}

function kind(url: string): "youtube" | "instagram" | "link" | null {
  const h = hostOf(url);
  if (!h) return null;
  if (h === "youtu.be" || h === "youtube.com" || h.endsWith(".youtube.com")) return "youtube";
  if (h === "instagram.com" || h.endsWith(".instagram.com") || h === "instagr.am") return "instagram";
  return "link";
}

function LinkButton({ url }: { url: string }) {
  const k = kind(url);
  if (!k) return null;
  const Icon = k === "youtube" ? Play : k === "instagram" ? Camera : ExternalLink;
  const label = k === "youtube" ? "Watch on YouTube" : k === "instagram" ? "View on Instagram" : "Open link";
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-outline h-10 w-fit gap-2">
      <Icon className="size-4" aria-hidden /> {label}
    </a>
  );
}

function inline(line: string): ReactNode[] {
  return line.split(URL_RE).map((part, i) => {
    if (i % 2 === 0) return part;
    const url = part.replace(TRAILING, "");
    const rest = part.slice(url.length);
    if (!kind(url)) return part;
    return <span key={i}><a href={url} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-forest underline underline-offset-4">{url}</a>{rest}</span>;
  });
}

/** Renders the optional "How to use" content: plain text, with links clickable. A line that is only a link becomes a button. */
export function HowToUse({ value }: { value: string }) {
  const lines = value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  return (
    <section aria-labelledby="how-to-use" className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 id="how-to-use" className="font-sans text-base font-semibold text-foreground">How to use</h2>
      <div className="space-y-2 text-sm text-muted-foreground">
        {lines.map((line, i) => {
          const only = /^https?:\/\/\S+$/.test(line) && kind(line);
          return only ? <LinkButton key={i} url={line} /> : <p key={i} className="whitespace-pre-line">{inline(line)}</p>;
        })}
      </div>
    </section>
  );
}
