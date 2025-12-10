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
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAskDoubt } from "../hooks/useAskDoubt";
import { ApiKeyDialog } from "@/components/api-key-dialog";
import { toast } from "sonner";

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
    if (!doubtText.trim() || isLoading) return;

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
        [] as Array<{ question: string; answer: string }>
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
        </SheetHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
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
                  message.sender === "user" ? "justify-end" : "justify-start"
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
                      : "bg-muted text-foreground"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p
                    className={cn(
                      "text-xs mt-1",
                      message.sender === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
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
              placeholder="Type your doubt..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSubmit}
              disabled={!doubtText.trim() || isLoading}
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
