export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="text-4xl md:text-5xl">{title}</h1>
      <div className="mt-6 max-w-2xl space-y-4 text-muted-foreground">{children}</div>
    </div>
  );
}

export const Placeholder = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-lg border border-dashed border-border bg-card p-4 text-sm">{children}</p>
);
