"use client";

import { useEffect, useState } from "react";
import type { CertificateDTO } from "@/lib/types";

export function PostComposer({
  disabled,
  disabledReason,
  onPosted,
}: {
  disabled: boolean;
  disabledReason: string;
  onPosted: () => void;
}) {
  const [content, setContent] = useState("");
  const [hashtagsInput, setHashtagsInput] = useState("");
  const [certificates, setCertificates] = useState<CertificateDTO[]>([]);
  const [requiredCertificateId, setRequiredCertificateId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/certificates")
      .then((r) => r.json())
      .then((data) => setCertificates(data.certificates ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const hashtags = hashtagsInput
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          hashtags,
          requiredCertificateId: requiredCertificateId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to post.");
      setContent("");
      setHashtagsInput("");
      setRequiredCertificateId("");
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (disabled) {
    return (
      <div className="mb-6 rounded-xl border border-dashed border-border bg-surface p-4 text-center text-sm text-muted">
        {disabledReason}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-xl border border-border bg-surface p-4"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's your bullshit tonight?"
        maxLength={500}
        rows={3}
        required
        className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={hashtagsInput}
          onChange={(e) => setHashtagsInput(e.target.value)}
          placeholder="up to 3 hashtags, space separated"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        <select
          value={requiredCertificateId}
          onChange={(e) => setRequiredCertificateId(e.target.value)}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-muted outline-none focus:border-accent"
        >
          <option value="">No certificate gate</option>
          {certificates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isSubmitting || content.trim().length === 0}
          className="rounded-lg bg-accent-strong px-4 py-1.5 text-sm font-medium text-white hover:bg-accent disabled:opacity-50"
        >
          {isSubmitting ? "Posting…" : "Post"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </form>
  );
}
