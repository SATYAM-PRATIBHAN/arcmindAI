"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Copy, Check, Webhook, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface WebhookDelivery {
  id: string;
  event: string;
  status: string;
  responseCode: number | null;
  createdAt: string;
}

interface Webhook {
  id: string;
  url: string;
  isActive: boolean;
  createdAt: string;
  deliveries: WebhookDelivery[];
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<{ id: string; secret: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch("/api/webhooks");
      const data = await res.json();
      if (data.success) setWebhooks(data.webhooks);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleAdd = async () => {
    if (!url.trim()) return;
    setAdding(true);
    setError(null);

    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to add webhook.");
        return;
      }

      setNewSecret({ id: data.webhook.id, secret: data.webhook.secret });
      setUrl("");
      await fetchWebhooks();
    } catch {
      setError("Something went wrong.");
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      setWebhooks((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isActive } : w))
      );
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      if (newSecret?.id === id) setNewSecret(null);
    } catch {
      // silently fail
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Webhook className="h-6 w-6" /> Webhooks
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Register HTTPS URLs to receive a POST notification whenever a generation completes or fails.
        </p>
      </div>

      {/* Add webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Register a new webhook</CardTitle>
          <CardDescription>Must be a valid HTTPS URL. No internal IPs allowed.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://your-server.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              disabled={adding}
            />
            <Button onClick={handleAdd} disabled={adding || !url.trim()} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-1" />
              {adding ? "Adding…" : "Add"}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}

          {/* Show secret once after creation */}
          {newSecret && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
              <p className="font-medium text-amber-800 mb-1">
                ⚠️ Copy your signing secret — it won&apos;t be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white border rounded px-2 py-1 break-all">
                  {newSecret.secret}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer shrink-0"
                  onClick={() => handleCopy(newSecret.secret)}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-amber-700 mt-2">
                Use this to verify incoming requests via the <code>x-webhook-signature</code> header (HMAC-SHA256).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook list */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading webhooks…</p>
        ) : webhooks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">
              No webhooks registered yet. Add one above.
            </CardContent>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id} className={cn(!webhook.isActive && "opacity-60")}>
              <CardContent className="pt-4 flex flex-col gap-3">
                {/* URL + controls row */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">{webhook.url}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Added {new Date(webhook.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={webhook.isActive ? "default" : "secondary"}>
                      {webhook.isActive ? "Active" : "Paused"}
                    </Badge>
                    <Switch
                      checked={webhook.isActive}
                      onCheckedChange={(v) => handleToggle(webhook.id, v)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive cursor-pointer"
                      onClick={() => handleDelete(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Delivery history toggle */}
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === webhook.id ? null : webhook.id)
                  }
                >
                  {expandedId === webhook.id ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {webhook.deliveries.length} recent delivery
                  {webhook.deliveries.length !== 1 ? "s" : ""}
                </button>

                {expandedId === webhook.id && (
                  <div className="border rounded-md overflow-hidden">
                    {webhook.deliveries.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-3">No deliveries yet.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left px-3 py-2">Event</th>
                            <th className="text-left px-3 py-2">Status</th>
                            <th className="text-left px-3 py-2">Code</th>
                            <th className="text-left px-3 py-2">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {webhook.deliveries.map((d) => (
                            <tr key={d.id} className="border-t">
                              <td className="px-3 py-2 font-mono">{d.event}</td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant={d.status === "success" ? "default" : "destructive"}
                                  className="text-[10px]"
                                >
                                  {d.status}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {d.responseCode ?? "—"}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {new Date(d.createdAt).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Payload docs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payload format</CardTitle>
          <CardDescription>
            Every webhook POST sends JSON with the following shape, signed with HMAC-SHA256.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted rounded-md p-4 text-xs overflow-x-auto">
{`{
  "event": "generation.completed" | "generation.failed",
  "status": "success" | "failed",
  "userId": "...",
  "generationId": "...",
  "metadata": {
    "generatedAt": "2025-01-01T00:00:00.000Z",
    "durationSeconds": 3.2
  },
  "result": { ... },   // present on success
  "error": "..."       // present on failure
}

// Verify signature in your server:
const sig = req.headers["x-webhook-signature"];
const expected = crypto
  .createHmac("sha256", YOUR_SECRET)
  .update(JSON.stringify(body))
  .digest("hex");
const isValid = sig === expected;`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
