import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Search } from "lucide-react";
import { MessageActions } from "@/components/admin/MessageActions";
import { Pagination } from "@/components/shell/Pagination";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/formatting";

export const metadata: Metadata = { title: "Messages" };
const PAGE_SIZE = 20;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const IST = "T00:00:00+05:30";

type Msg = { id: string; name: string; email: string; phone: string | null; subject: string; message: string; is_read: boolean; created_at: string };

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const thisYear = new Date().getFullYear();
  const q = one(sp.q).replace(/[^A-Za-z0-9@.+ -]/g, "").trim().slice(0, 60);
  const unread = one(sp.status) === "unread";
  const date = DATE.test(one(sp.date)) ? one(sp.date) : "";
  const month = /^(0[1-9]|1[0-2])$/.test(one(sp.month)) ? one(sp.month) : "";
  const year = /^\d{4}$/.test(one(sp.year)) ? one(sp.year) : "";
  const wanted = Math.max(1, parseInt(one(sp.page)) || 1);

  let query = supabase.from("contact_messages").select("*", { count: "exact" }).order("created_at", { ascending: false })
    .range((wanted - 1) * PAGE_SIZE, wanted * PAGE_SIZE - 1);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,subject.ilike.%${q}%,message.ilike.%${q}%`);
  if (unread) query = query.eq("is_read", false);
  if (date) {
    const next = new Date(`${date}T12:00:00Z`); next.setUTCDate(next.getUTCDate() + 1);
    query = query.gte("created_at", `${date}${IST}`).lt("created_at", `${next.toISOString().slice(0, 10)}${IST}`);
  } else if (month || year) {
    const y = Number(year || thisYear);
    if (month) {
      const m = Number(month);
      const end = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
      query = query.gte("created_at", `${y}-${month}-01${IST}`).lt("created_at", `${end}${IST}`);
    } else query = query.gte("created_at", `${y}-01-01${IST}`).lt("created_at", `${y + 1}-01-01${IST}`);
  }

  const { data, count, error } = await query;
  const rows = (data ?? []) as Msg[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(wanted, pages);
  const keep = { ...(q && { q }), ...(unread && { status: "unread" }), ...(date && { date }), ...(month && { month }), ...(year && { year }) };
  const hrefFor = (p: number) => `/admin/messages?${new URLSearchParams({ ...keep, ...(p > 1 && { page: String(p) }) })}`;
  const filtered = Boolean(q || unread || date || month || year);

  return (
    <div className="space-y-6">
      <div><h1 className="text-4xl">Messages</h1><p className="text-muted-foreground">Messages sent from the contact form. {total} {filtered ? "match" : "in total"}.</p></div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/admin/messages?${new URLSearchParams({ ...keep, status: "" })}`.replace("status=&", "").replace(/[?&]status=$/, "")} className={`chip ${!unread ? "chip-active" : ""}`}>All</Link>
        <Link href={`/admin/messages?${new URLSearchParams({ ...keep, status: "unread" })}`} className={`chip ${unread ? "chip-active" : ""}`}>Unread</Link>
      </div>

      <form role="search" className="card grid gap-3 p-3 md:grid-cols-[1fr_auto_auto_auto_auto_auto]">
        {unread && <input type="hidden" name="status" value="unread" />}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Search name, email, phone or message" aria-label="Search messages" className="field pl-9" />
        </div>
        <input type="date" name="date" defaultValue={date} aria-label="Exact date" className="field" />
        <select name="month" defaultValue={month} aria-label="Month" className="field">
          <option value="">Any month</option>
          {MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>)}
        </select>
        <select name="year" defaultValue={year} aria-label="Year" className="field">
          <option value="">Any year</option>
          {Array.from({ length: 5 }, (_, i) => thisYear - i).map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button className="btn btn-primary">Filter</button>
        {filtered ? <Link href="/admin/messages" className="btn btn-outline">Clear</Link> : <span className="hidden md:block" />}
      </form>

      {error ? <div className="card p-10 text-center text-destructive">Couldn&apos;t load messages. Please refresh.</div> : rows.length ? (
        <ul className="space-y-2">
          {rows.map((m) => {
            const phone = m.phone?.replace(/\D/g, "").slice(-10);
            return (
              <li key={m.id}>
                <details className="card group overflow-hidden open:shadow-md">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 p-4 marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className={`size-2.5 shrink-0 rounded-full ${m.is_read ? "bg-border" : "bg-terracotta"}`} aria-label={m.is_read ? "Read" : "Unread"} />
                    <span className={`w-40 truncate ${m.is_read ? "font-medium" : "font-semibold text-forest-dark"}`}>{m.name}</span>
                    <span className="badge badge-green">{m.subject}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{m.message}</span>
                    <time className="text-sm text-muted-foreground" dateTime={m.created_at}>{formatDateTime(m.created_at)}</time>
                  </summary>
                  <div className="space-y-4 border-t border-border bg-muted/40 p-4 sm:p-5">
                    <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                      <div><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{m.email}</dd></div>
                      {m.phone && <div><dt className="text-muted-foreground">Phone</dt><dd className="font-medium">{m.phone}</dd></div>}
                    </dl>
                    <p className="whitespace-pre-wrap rounded-lg bg-card p-4 text-sm leading-relaxed">{m.message}</p>
                    <MessageActions id={m.id} isRead={m.is_read} name={m.name}
                      mailto={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                      whatsapp={phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(`Hello ${m.name}, this is Nature Enterprises replying to your message.`)}` : null} />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="card flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <Inbox className="size-8 text-forest/50" aria-hidden />
          <p>{filtered ? "No messages match these filters." : "No messages yet. Messages from the contact form will appear here."}</p>
        </div>
      )}

      <Pagination page={page} pages={pages} total={total} pageSize={PAGE_SIZE} noun="messages" hrefFor={hrefFor} />
    </div>
  );
}
