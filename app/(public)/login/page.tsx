"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError("Incorrect email or password. Please try again.");
        return;
      }

      if (data.user) {
        const res = await fetch("/api/me");
        const userData = res.ok ? await res.json() : null;
        const role = userData?.role;
        if (role === "ENGINEER" || role === "ADMIN") {
          router.push("/dashboard");
        } else {
          router.push("/my-tickets");
        }
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <div>
            <p className="text-white font-semibold">AutoAce Tickets</p>
            <p className="text-gray-400 text-xs">Internal Support Portal</p>
          </div>
        </div>

        <div>
          <blockquote className="space-y-3">
            <p className="text-2xl font-semibold text-white leading-snug">
              &ldquo;Resolve issues faster, keep dealerships happy.&rdquo;
            </p>
            <p className="text-gray-400 text-sm">
              A unified portal for tracking, triaging, and closing engineering escalations — from first report to resolved.
            </p>
          </blockquote>
        </div>

        <div className="flex gap-3 text-xs text-gray-500">
          <span>© 2026 AutoAce</span>
          <span>·</span>
          <span>Internal use only</span>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
              A
            </div>
            <div>
              <p className="font-semibold text-gray-900">AutoAce Tickets</p>
              <p className="text-gray-400 text-xs">Internal Support</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 mt-1 text-sm">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@autoace.com"
                className="mt-1.5 h-11"
                required
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="mt-1.5 h-11"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3.5">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 gap-2 text-sm font-medium mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Not on the team?{" "}
              <Link href="/submit" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                Submit a ticket without logging in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
