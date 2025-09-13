"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const predefinedAccounts = [
    { email: "admin@acme.test", label: "Acme Admin", tenant: "Acme Corp" },
    { email: "user@acme.test", label: "Acme Member", tenant: "Acme Corp" },
    {
      email: "admin@globex.test",
      label: "Globex Admin",
      tenant: "Globex Corporation",
    },
    {
      email: "user@globex.test",
      label: "Globex Member",
      tenant: "Globex Corporation",
    },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store the JWT token
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (testEmail) => {
    setEmail(testEmail);
    setPassword("password");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1E1E1E] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 font-jetbrains-mono">
            SaaS Notes
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300 font-jetbrains-mono">
            Multi-tenant notes application
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-[#262626] rounded-xl shadow-2xl dark:shadow-none dark:ring-1 dark:ring-gray-700 p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 font-jetbrains-mono"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-jetbrains-mono"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 font-jetbrains-mono"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-jetbrains-mono"
                placeholder="Enter your password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm font-jetbrains-mono">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 active:bg-black dark:active:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-jetbrains-mono"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Test Accounts */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-jetbrains-mono">
              Test Accounts (all use password: "password"):
            </p>
            <div className="space-y-2">
              {predefinedAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => quickLogin(account.email)}
                  className="w-full text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 font-jetbrains-mono">
                    {account.label}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-jetbrains-mono">
                    {account.email} • {account.tenant}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
