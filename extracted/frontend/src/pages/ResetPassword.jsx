import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authAdapter } from "@/lib/adapters/authAdapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useI18n } from "@/i18n/I18nContext";

export default function ResetPassword() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError(t("auth_passwords_dont_match"));
      return;
    }
    setLoading(true);
    try {
      await authAdapter.resetPassword(resetToken, newPassword);
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || t("auth_failed_reset"));
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title={t("auth_invalid_reset_link")}
        subtitle={t("auth_invalid_reset_subtitle")}
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            {t("auth_request_new_link")}
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          {t("auth_invalid_reset_desc")}
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      orbState="secure"
      icon={Lock}
      title={t("auth_new_password")}
      subtitle={t("auth_new_password_subtitle")}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t("auth_password")}</Label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="ps-10 h-12 rounded-xl bg-white/[0.04] border-white/10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t("auth_confirm_password")}</Label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="ps-10 h-12 rounded-xl bg-white/[0.04] border-white/10"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-semibold rounded-full tap-feedback" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 ms-2 animate-spin" />
              {t("auth_resetting")}
            </>
          ) : (
            t("auth_reset_password_btn")
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}