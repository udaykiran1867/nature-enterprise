"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyMessage({ message }: { message: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy your order message:", message);
    }
  }
  return (
    <button type="button" onClick={copy} className="btn btn-outline">
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? "Copied" : "Copy order message"}
    </button>
  );
}
