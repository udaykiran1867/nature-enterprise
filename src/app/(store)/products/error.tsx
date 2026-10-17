"use client";

export default function ProductsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-3xl">We couldn&apos;t load the products</h1>
      <p className="mt-2 text-muted-foreground">Please check your connection and try again.</p>
      <button onClick={reset} className="btn btn-primary mt-6">Try again</button>
    </div>
  );
}
