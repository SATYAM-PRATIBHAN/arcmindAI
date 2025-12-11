"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAskDoubt } from "../hooks/useAskDoubt";
import { ApiKeyDialog } from "@/components/api-key-dialog";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface AskDoubtCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doubtText: string;
  onDoubtTextChange: (text: string) => void;
  generationId: string;
}

export default function AskDoubtCard({
  open,
  onOpenChange,
  doubtText,
  onDoubtTextChange,
  generationId,
}: AskDoubtCardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadedGenerationIdRef = useRef<string | null>(null);
  const { askDoubt, isLoading, error, showApiKeyDialog, closeApiKeyDialog } =
    useAskDoubt();
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [doubtChatCount, setDoubtChatCount] = useState<number>(0);
  const [limitReached, setLimitReached] = useState<boolean>(false);
  const FREE_TIER_DOUBT_LIMIT = 5;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages from localStorage
  const loadMessagesFromStorage = (genId: string) => {
    const storageKey = `doubt_chat_${genId}`;
    const savedMessages = localStorage.getItem(storageKey);

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        const messagesWithDates = parsed.map((msg: Message) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        return messagesWithDates;
      } catch (error) {
        console.error("Failed to parse saved messages:", error);
        return [];
      }
    }
    return [];
  };

  // Fetch user plan and generation data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await fetch("/api/user");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserPlan(userData.output.plan);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    const fetchGenerationData = async () => {
      if (!generationId) return;
      try {
        const genResponse = await fetch(`/api/generate/${generationId}`);
        if (genResponse.ok) {
          const genData = await genResponse.json();
          setDoubtChatCount(genData.output.doubtChatCount || 0);
          setLimitReached(
            userPlan === "free" &&
              genData.output.doubtChatCount >= FREE_TIER_DOUBT_LIMIT,
          );
        }
      } catch (error) {
        console.error("Failed to fetch generation data:", error);
      }
    };

    fetchUserData();
    fetchGenerationData();
  }, [generationId, userPlan, FREE_TIER_DOUBT_LIMIT]);

  // Load conversation history when generationId changes
  useEffect(() => {
    if (generationId && loadedGenerationIdRef.current !== generationId) {
      loadedGenerationIdRef.current = generationId;
      const loadedMessages = loadMessagesFromStorage(generationId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(loadedMessages);
    }
  }, [generationId]);

  // Save messages to localStorage whenever they change
  const saveMessagesToStorage = (updatedMessages: Message[]) => {
    if (generationId) {
      const storageKey = `doubt_chat_${generationId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
    }
  };

  const handleSubmit = async () => {
    if (!doubtText.trim() || isLoading || limitReached) return;

    const question = doubtText.trim();

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      sender: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessagesToStorage(updatedMessages);
    onDoubtTextChange("");

    // Build conversation history for AI context
    const conversationHistory = messages
      .filter((msg) => msg.sender === "user" || msg.sender === "assistant")
      .reduce(
        (acc, msg, idx, arr) => {
          if (msg.sender === "user" && arr[idx + 1]?.sender === "assistant") {
            acc.push({
              question: msg.text,
              answer: arr[idx + 1].text,
            });
          }
          return acc;
        },
        [] as Array<{ question: string; answer: string }>,
      );

    // Call the API to get AI response with conversation context
    const result = await askDoubt(generationId, question, conversationHistory);

    if (result && result.success) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: result.answer,
        sender: "assistant",
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveMessagesToStorage(finalMessages);

      // Increment local count for every question if user is on free plan
      if (userPlan === "free") {
        setDoubtChatCount((prev) => prev + 1);
      }
    } else {
      // Check if it's a limit reached error
      if (result && result.limitReached) {
        setLimitReached(true);
        setDoubtChatCount(result.currentCount || FREE_TIER_DOUBT_LIMIT);
        toast.error(result.message);
      } else {
        const errorText =
          error || "Sorry, I couldn't answer your question. Please try again.";
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: errorText,
          sender: "assistant",
          timestamp: new Date(),
        };
        const finalMessages = [...updatedMessages, errorMessage];
        setMessages(finalMessages);
        saveMessagesToStorage(finalMessages);

        // Show toast notification for errors
        if (error) {
          toast.error(error);
        }
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <ApiKeyDialog
        isOpen={showApiKeyDialog}
        onClose={closeApiKeyDialog}
        onSuccess={() => {
          closeApiKeyDialog();
          toast.info("API keys saved. Please try asking your question again.");
        }}
      />

      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0"
      >
        <SheetHeader className="px-4 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Ask a Doubt
          </SheetTitle>
          {userPlan === "free" && (
            <div className="text-xs text-muted-foreground mt-2">
              {doubtChatCount >= FREE_TIER_DOUBT_LIMIT ? (
                <span className="text-destructive font-medium">
                  Limit reached ({FREE_TIER_DOUBT_LIMIT}/{FREE_TIER_DOUBT_LIMIT}
                  )
                </span>
              ) : (
                <span>
                  {FREE_TIER_DOUBT_LIMIT - doubtChatCount} doubt chats remaining
                </span>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {limitReached && messages.length === 0 && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <Crown className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-sm">
                You&apos;ve reached the limit of {FREE_TIER_DOUBT_LIMIT} doubt
                chats for this generation.
                <Button
                  variant="link"
                  className="p-0 h-auto ml-1 text-primary"
                  onClick={() => (window.location.href = "/pricing")}
                >
                  Upgrade to Pro
                </Button>{" "}
                for unlimited doubt chats.
              </AlertDescription>
            </Alert>
          )}
          {messages.length === 0 && !limitReached ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">
                Ask any questions about this architecture
              </p>
              <p className="text-xs mt-2">
                Type your doubt and press Enter to send
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.sender === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.sender === "assistant" && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p
                    className={cn(
                      "text-xs mt-1",
                      message.sender === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.sender === "user" && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t px-4 py-4">
          <div className="flex gap-2">
            <Input
              type="text"
              value={doubtText}
              onChange={(e) => onDoubtTextChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                limitReached
                  ? "Limit reached - Upgrade to continue"
                  : "Type your doubt..."
              }
              className="flex-1"
              disabled={isLoading || limitReached}
            />
            <Button
              onClick={handleSubmit}
              disabled={!doubtText.trim() || isLoading || limitReached}
              className="cursor-pointer"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
