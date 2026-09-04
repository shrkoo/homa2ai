import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authAdapter } from "@/lib/adapters/authAdapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";

import { safeReturnTo } from "@/lib/authReturnTo";
import { loginWithAccountPicker } from "@/lib/authHelpers";
import { useI18n } from "@/i18n/I18nContext";

export default function Login() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authAdapter.login(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || t("auth_invalid_credentials"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => { try { loginWithAccountPicker("google"); } catch (e) { setError(e.message); } };
  const handleApple = () => { try { authAdapter.loginWithProvider("apple", returnTo); } catch (e) { setError(e.message); } };
  const handleMicrosoft = () => { try { loginWithAccountPicker("microsoft"); } catch (e) { setError(e.message); } };
  const handleFacebook = () => { try { loginWithAccountPicker("facebook"); } catch (e) { setError(e.message); } };

  return (
    <AuthLayout
      title={t("auth_login_title")}
      subtitle={t("auth_login_subtitle")}
      footer={
        <>
          {t("auth_no_account")}{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-semibold hover:underline"
          >
            {t("auth_create_one")}
          </Link>
        </>
      }
    >
      <SocialAuthButtons
        onGoogle={handleGoogle}
        onApple={handleApple}
        onMicrosoft={handleMicrosoft}
        onFacebook={handleFacebook}
      />

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("auth_or")}</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <div className="relative">
            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ps-10 h-12 rounded-xl bg-white/[0.04] border-white/10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth_password")}</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              {t("auth_forgot_password")}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ps-10 h-12 rounded-xl bg-white/[0.04] border-white/10"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 font-semibold rounded-full tap-feedback" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 ms-2 animate-spin" />
              {t("auth_logging_in")}
            </>
          ) : (
            t("auth_login_btn")
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}