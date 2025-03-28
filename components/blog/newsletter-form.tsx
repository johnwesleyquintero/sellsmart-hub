"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error();
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold">Subscribe to Amazon Seller Tips</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Get the latest Amazon selling strategies and tool updates directly to
        your inbox.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" disabled={status === "loading"}>
          <Mail className="mr-2 h-4 w-4" />
          Subscribe
        </Button>
      </form>
      {status === "success" && (
        <p className="mt-2 text-sm text-green-600">Successfully subscribed!</p>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-red-600">
          Subscription failed. Please try again.
        </p>
      )}
    </div>
  );
}
