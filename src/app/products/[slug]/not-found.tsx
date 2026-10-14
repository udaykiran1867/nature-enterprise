import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-3xl">Product not found</h1>
      <p className="mt-2 text-muted-foreground">This product may have been removed or is no longer available.</p>
      <Link href="/products" className="btn btn-primary mt-6">Back to the shop</Link>
    </div>
  );
}
