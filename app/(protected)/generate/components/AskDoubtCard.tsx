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
import { Send, Bot, User, Crown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAskDoubt } from "../hooks/useAskDoubt";
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
  const { askDoubt, isLoading, error } = useAskDoubt();
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
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0 border-l border-border/40 bg-card/95 backdrop-blur-2xl shadow-2xl"
      >
        <SheetHeader className="px-6 py-6 border-b border-border/40 space-y-3">
          <SheetTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
            <div className="p-2 bg-foreground text-background rounded-xl">
              <Bot className="w-5 h-5" />
            </div>
            Ask a Doubt
          </SheetTitle>
          {userPlan === "free" && (
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              {doubtChatCount >= FREE_TIER_DOUBT_LIMIT ? (
                <span className="text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Limit reached ({FREE_TIER_DOUBT_LIMIT}/{FREE_TIER_DOUBT_LIMIT}
                  )
                </span>
              ) : (
                <span className="bg-accent px-2 py-0.5 rounded text-foreground">
                  {FREE_TIER_DOUBT_LIMIT - doubtChatCount} chats left
                </span>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
          {limitReached && messages.length === 0 && (
            <Alert className="border-destructive/20 bg-destructive/5 rounded-2xl">
              <Crown className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-sm">
                You&apos;ve reached the free limit.
                <Button
                  variant="link"
                  className="p-0 h-auto ml-1 text-foreground font-bold underline cursor-pointer"
                  onClick={() => (window.location.href = "/pricing")}
                >
                  Upgrade to Pro
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {messages.length === 0 && !limitReached ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-in fade-in zoom-in duration-700">
              <div className="p-6 bg-accent/30 rounded-full">
                <Bot className="w-12 h-12 text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold tracking-tight">
                  Architecture Assistant
                </p>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                  I can clarify component roles, tech stack choices, or
                  integration workflows.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  message.sender === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.sender === "assistant" && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center border border-border/40">
                    <Bot className="w-4 h-4 text-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                    message.sender === "user"
                      ? "bg-foreground text-background font-medium"
                      : "bg-accent/40 text-foreground border border-border/40",
                  )}
                >
                  <p className="text-[13px] whitespace-pre-wrap leading-relaxed">
                    {message.text}
                  </p>
                  <p
                    className={cn(
                      "text-[9px] mt-2 font-bold uppercase tracking-tighter opacity-50",
                      message.sender === "user"
                        ? "text-background"
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
                  <div className="shrink-0 w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
                    <User className="w-4 h-4 text-background" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-in fade-in duration-300">
              <div className="shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center border border-border/40">
                <Bot className="w-4 h-4 text-foreground" />
              </div>
              <div className="bg-accent/40 rounded-2xl px-4 py-3 border border-border/40">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                  <div
                    className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-border/40 bg-card/50">
          <div className="relative group">
            <Input
              type="text"
              value={doubtText}
              onChange={(e) => onDoubtTextChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                limitReached ? "Daily limit reached" : "Type your question..."
              }
              className="flex-1 rounded-xl bg-accent/30 border-border/40 focus-visible:ring-1 focus-visible:ring-foreground/20 pr-12 h-11 text-sm"
              disabled={isLoading || limitReached}
            />
            <Button
              onClick={handleSubmit}
              disabled={!doubtText.trim() || isLoading || limitReached}
              variant="ghost"
              size="icon"
              className="absolute right-1.5 top-1.5 h-8 w-8 rounded-lg hover:bg-foreground hover:text-background transition-colors duration-300"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-3">
            Press Enter to send your message
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
