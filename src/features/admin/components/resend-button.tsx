"use client";

import { useState, useTransition } from "react";

import { resendInvite } from "../actions";

export function ResendButton({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await resendInvite(email);
            setMessage(r.error ?? r.success);
          })
        }
        className="h-11 cursor-pointer rounded-full border border-input bg-card px-3 text-xs font-semibold hover:bg-secondary disabled:opacity-50 lg:h-9"
      >
        {pending ? "Enviando…" : "Reenviar convite"}
      </button>
      {message ? (
        <span className="text-[11px] text-muted-foreground">{message}</span>
      ) : null}
    </div>
  );
}
