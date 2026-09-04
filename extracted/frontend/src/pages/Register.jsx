import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { authAdapter } from "@/lib/adapters/authAdapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";

import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { loginWithAccountPicker } from "@/lib/authHelpers";
import { useI18n } from "@/i18n/I18nContext";

const PENDING_OTP_KEY = "homa_pending_otp_email";

export default function Register() {
  const { t, dir } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    try {
      const pendingEmail = localStorage.getItem(PENDING_OTP_KEY);
      if (pendingEmail) {
        setEmail(pendingEmail);
        setShowOtp(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get('ref');
      if (ref) localStorage.setItem('homa_ref', ref);
    } catch {}
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("auth_passwords_dont_match"));
      return;
    }
    const regEmail = email;
    const regPassword = password;

    setLoading(true);
    try {
      await authAdapter.register(regEmail, regPassword);
      try { localStorage.setItem(PENDING_OTP_KEY, regEmail); } catch {}
      setEmail(regEmail);
      setShowOtp(true);
    } catch (err) {
      setError(err.message || t("auth_registration_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await authAdapter.verifyOtp(email, otpCode);
      try { localStorage.removeItem(PENDING_OTP_KEY); } catch {}
      if (result?.access_token) authAdapter.setToken(result.access_token);
      window.location.href = '/onboarding';
    } catch (err) {
      setError(err.message || t("auth_invalid_code"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await authAdapter.resendOtp(email);
      toast({ title: t("auth_code_sent"), description: t("auth_check_email") });
    } catch (err) {
      setError(err.message || t("auth_registration_failed"));
    }
  };

  const handleBackFromOtp = () => {
    try { localStorage.removeItem(PENDING_OTP_KEY); } catch {}
    setShowOtp(false);
    setOtpCode("");
    setError("");
  };

  const handleGoogle = () => { try { loginWithAccountPicker("google"); } catch (e) { setError(e.message); } };
  const handleApple = () => { try { authAdapter.loginWithProvider("apple", safeReturnTo()); } catch (e) { setError(e.message); } };
  const handleMicrosoft = () => { try { loginWithAccountPicker("microsoft"); } catch (e) { setError(e.message); } };
  const handleFacebook = () => { try { loginWithAccountPicker("facebook"); } catch (e) { setError(e.message); } };

  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;

  if (showOtp) {
    return (
      <AuthLayout
        orbState="processing"
        title={t("auth_verify_email")}
        subtitle={`${t("auth_verify_subtitle")} ${email}`}
        footer={
          <button
            onClick={handleBackFromOtp}
            className="text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            <BackIcon className="w-3 h-3" />
            {t("back")}
          </button>
        }
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">{error}</div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12 font-semibold rounded-full tap-feedback" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? (
            <><Loader2 className="w-4 h-4 ms-2 animate-spin" />{t("auth_verifying")}</>
          ) : t("auth_verify_btn")}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {t("auth_didnt_receive")}{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            {t("auth_resend")}
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      orbState="creative"
      orbSize={120}
      title={t("auth_signup_title")}
      subtitle={t("auth_signup_subtitle")}
      footer={
        <>
          {t("auth_have_account")}{" "}
          <Link
            to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="text-primary font-semibold hover:underline"
          >
            {t("auth_log_in")}
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
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">{error}</div>
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
          <Label htmlFor="password">{t("auth_password")}</Label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <><Loader2 className="w-4 h-4 ms-2 animate-spin" />{t("auth_creating_account")}</>
          ) : t("auth_create_account_btn")}
        </Button>
      </form>
    </AuthLayout>
  );
}