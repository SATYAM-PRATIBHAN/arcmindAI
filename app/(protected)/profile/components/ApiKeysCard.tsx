import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiKeyStatus, useApiKeys } from "@/hooks/useApiKeys";
import { APIKeyProvider } from "@/lib/crypto/encryption";
import { Eye, EyeOff, KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const PROVIDERS: {
  id: APIKeyProvider;
  label: string;
  placeholder: string;
  statusKey: keyof ApiKeyStatus;
}[] = [
  {
    id: "gemini",
    label: "Gemini API Key",
    placeholder: "AI...",
    statusKey: "hasGeminiKey",
  },
  {
    id: "openai",
    label: "OpenAI API Key",
    placeholder: "sk-...",
    statusKey: "hasOpenAIKey",
  },
];

export function ApiKeysCard() {
  const {
    apiKeyStatus,
    refreshApiKeyStatus,
    saveApiKeys,
    deleteApiKey,
    isLoading,
    isMutating,
    error,
  } = useApiKeys();
  const [values, setValues] = useState<Record<APIKeyProvider, string>>({
    gemini: "",
    openai: "",
  });
  const [visible, setVisible] = useState<Record<APIKeyProvider, boolean>>({
    gemini: false,
    openai: false,
  });

  useEffect(() => {
    refreshApiKeyStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    const payload: { geminiApiKey?: string; openaiApiKey?: string } = {};
    if (values.gemini.trim()) payload.geminiApiKey = values.gemini.trim();
    if (values.openai.trim()) payload.openaiApiKey = values.openai.trim();

    if (!payload.geminiApiKey && !payload.openaiApiKey) return;

    const res = await saveApiKeys(payload);
    if (res.success) {
      setValues({ gemini: "", openai: "" });
    }
  };

  const handleRemove = async (provider: APIKeyProvider) => {
    await deleteApiKey(provider);
  };

  const nothingToSave = !values.gemini.trim() && !values.openai.trim();

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="w-5 h-5" />
          API Key Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Add your own provider API keys to run generations against your own
          quota. Keys are encrypted before being stored and are never shown back
          to you.
        </p>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {PROVIDERS.map((provider) => {
              const existed = !!apiKeyStatus?.[provider.statusKey];
              return (
                <div key={provider.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${provider.id}-key`}>
                      {provider.label}
                    </Label>
                    {existed && (
                      <Badge
                        variant="outline"
                        className="text-xs flex items-center gap-1 bg-green-100 text-green-800 border-green-500"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                        Encrypted
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id={`${provider.id}-key`}
                        type={visible[provider.id] ? "text" : "password"}
                        autoComplete="off"
                        value={values[provider.id]}
                        placeholder={
                          existed
                            ? "•••••••••• (enter a new key to replace)"
                            : provider.placeholder
                        }
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            [provider.id]: e.target.value,
                          }))
                        }
                        className="pr-10"
                      />
                      <button
                        type="button"
                        aria-label={
                          visible[provider.id] ? "Hide key" : "Show key"
                        }
                        onClick={() =>
                          setVisible((prev) => ({
                            ...prev,
                            [provider.id]: !prev[provider.id],
                          }))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {visible[provider.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {existed && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Remove ${provider.label}`}
                        disabled={isMutating}
                        onClick={() => handleRemove(provider.id)}
                        className="shrink-0 cursor-pointer text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSave}
                disabled={isMutating || nothingToSave}
                className="cursor-pointer"
              >
                {isMutating ? "Saving..." : "Save keys"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
