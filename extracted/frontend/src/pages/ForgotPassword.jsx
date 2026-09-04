import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authAdapter } from "@/lib/adapters/authAdapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useI18n } from "@/i18n/I18nContext";

export default function ForgotPassword() {
  const { t, dir } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAdapter.resetPasswordRequest(email);
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      orbState="thinking"
      orbSize={85}
      icon={Mail}
      title={t("auth_reset_password")}
      subtitle={t("auth_reset_subtitle")}
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
          <BackIcon className="w-3 h-3" />
          {t("auth_back_to_login")}
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-foreground text-center">
          {t("auth_reset_sent")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth_email_address")}</Label>
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
          <Button type="submit" className="w-full h-12 font-semibold rounded-full tap-feedback" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 ms-2 animate-spin" />
                {t("auth_sending")}
              </>
            ) : (
              t("auth_send_reset_link")
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}