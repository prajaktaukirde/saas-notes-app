"use client";

import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    window.location.href = "/login";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1E1E1E] flex items-center justify-center">
      <div className="text-gray-600 dark:text-gray-300 font-jetbrains-mono">
        Redirecting to login...
      </div>
    </div>
  );
}
