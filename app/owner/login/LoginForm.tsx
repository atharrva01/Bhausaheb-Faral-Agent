"use client";

import { useActionState } from "react";
import { login } from "@/app/owner/actions";
import { useOwnerLang } from "@/components/owner/OwnerLang";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, null);
  const { t } = useOwnerLang();
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="pw" className="mb-1 block text-[15px] font-semibold">
          {t.password}
        </label>
        <input
          id="pw"
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          aria-describedby={state?.error ? "pw-err" : undefined}
          className="h-12 w-full rounded-[8px] border border-line bg-card px-3 text-base"
        />
      </div>
      {state?.error && (
        <p id="pw-err" role="alert" className="text-[15px] text-danger">
          {state.error === "Wrong password." ? "Wrong password. Try again, or ask Atharva." : state.error}
        </p>
      )}
      <button disabled={pending} className="h-12 w-full rounded-[8px] bg-brand px-4 text-base font-semibold text-white hover:bg-brand-deep disabled:opacity-60">
        {pending ? "…" : t.openKhata}
      </button>
    </form>
  );
}
