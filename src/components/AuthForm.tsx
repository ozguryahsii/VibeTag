"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, type FormState } from "@/lib/actions/auth";
import { Wordmark } from "@/components/Logo";

const initial: FormState = {};

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-[12px] font-bold text-muted mb-1.5 ml-1">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-2xl border border-line bg-warmwhite px-4 h-13 text-[15px] font-medium outline-none focus:border-orange/60 focus:ring-4 focus:ring-orange/10 transition"
      />
    </label>
  );
}

function Submit({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="w-full h-13 rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)] active:scale-[0.98] transition-transform"
    >
      {label}
    </button>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <main className="min-h-dvh px-6 pt-14 pb-10 flex flex-col">
      <Wordmark size={20} />
      <h1 className="mt-10 text-[30px] font-black tracking-[-0.03em] leading-tight">
        Tekrar hoş geldin 👋
      </h1>
      <p className="text-[14px] text-muted mt-1.5">
        Vibe profilin seni bekliyor.
      </p>

      <form action={action} className="mt-8 grid gap-4">
        <Field
          label="E-posta"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="sen@ornek.com"
          required
        />
        <Field
          label="Şifre"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••"
          required
        />
        {state.error && (
          <p className="text-[13px] font-semibold text-coral bg-coral/8 border border-coral/20 rounded-2xl px-4 py-3">
            {state.error}
          </p>
        )}
        <div className="mt-1">
          <Submit label={pending ? "Giriş yapılıyor…" : "Giriş yap"} />
        </div>
      </form>

      <p className="mt-auto pt-8 text-center text-[14px] text-muted">
        Hesabın yok mu?{" "}
        <Link href="/register" className="font-bold text-orange">
          Kayıt ol
        </Link>
      </p>
    </main>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <main className="min-h-dvh px-6 pt-14 pb-10 flex flex-col">
      <Wordmark size={20} />
      <h1 className="mt-10 text-[30px] font-black tracking-[-0.03em] leading-tight">
        My Vibe’ını oluştur
      </h1>
      <p className="text-[14px] text-muted mt-1.5">
        Birkaç saniye — sonra çevrenden gerçek geri bildirim toplamaya başla.
      </p>

      <form action={action} className="mt-8 grid gap-4">
        <Field label="İsim" name="name" placeholder="Özgür Yahşi" required />
        <Field
          label="Kullanıcı adı"
          name="username"
          placeholder="ozguryahsi"
          required
        />
        <Field
          label="E-posta"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="sen@ornek.com"
          required
        />
        <Field
          label="Şifre"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="En az 6 karakter"
          required
        />
        {state.error && (
          <p className="text-[13px] font-semibold text-coral bg-coral/8 border border-coral/20 rounded-2xl px-4 py-3">
            {state.error}
          </p>
        )}
        <div className="mt-1">
          <Submit label={pending ? "Oluşturuluyor…" : "Hesabımı oluştur"} />
        </div>
      </form>

      <p className="mt-auto pt-8 text-center text-[14px] text-muted">
        Zaten hesabın var mı?{" "}
        <Link href="/login" className="font-bold text-orange">
          Giriş yap
        </Link>
      </p>
    </main>
  );
}
