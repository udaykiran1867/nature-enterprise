"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ShoppingBag } from "lucide-react";
import { selectCount, useCart } from "@/store/cart";

const subscribe = () => () => {};

export function CartButton() {
  const count = useCart(selectCount);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const shown = mounted ? count : 0;

  return (
    <Link href="/cart" className="icon-btn" aria-label={`Cart, ${shown} item${shown === 1 ? "" : "s"}`}>
      <ShoppingBag className="size-5" aria-hidden />
      {shown > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-[11px] font-semibold leading-5 text-white">
          {shown}
        </span>
      )}
    </Link>
  );
}
