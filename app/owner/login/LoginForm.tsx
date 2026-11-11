"use client";

import { useActionState } from "react";
import { login } from "@/app/owner/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Owner password</span>
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          className="w-full rounded-lg border border-line bg-white px-3 py-2.5 outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20"
        />
      </label>
      {state?.error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-maroon py-2.5 font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60">
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
