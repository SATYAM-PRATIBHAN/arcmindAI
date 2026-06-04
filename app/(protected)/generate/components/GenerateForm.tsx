import { RotateCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface GenerateFormProps {
  handleRef: any;
  restRegisterField: any;
  userInput: string;
  MAX_INPUT_LENGTH: number;
  counterColor: string;
  handleGenerate: () => void;
  isLoading: boolean;
  isRateLimited: boolean;
  isGuestLocked: boolean;
  showError: boolean;
}

export function GenerateForm({
  handleRef,
  restRegisterField,
  userInput,
  MAX_INPUT_LENGTH,
  counterColor,
  handleGenerate,
  isLoading,
  isRateLimited,
  isGuestLocked,
  showError,
}: GenerateFormProps) {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-border/50 to-border/50 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
      <Card className="relative border-border/60 shadow-lg bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col space-y-3">
            <Textarea
              ref={handleRef}
              placeholder="Describe the system architecture you want to generate..."
              {...restRegisterField}
              maxLength={MAX_INPUT_LENGTH}
              className="min-h-[120px] w-full bg-transparent border-none shadow-none focus-visible:ring-0 text-lg resize-none placeholder:text-muted-foreground/50 p-2"
            />

            <div className="flex items-center justify-between border-t border-border/40 pt-4 px-2">
              <div className="flex items-center gap-4">
                <p
                  className={`text-xs transition-opacity duration-300 ${userInput.length > 0 ? "opacity-100" : "opacity-0"} ${counterColor}`}
                >
                  {userInput.length} / {MAX_INPUT_LENGTH}
                </p>

                {/* Polished shortcut hint: minimal and subtle */}
                <div
                  className="hidden sm:flex ml-3 items-center gap-4 text-[11px] text-muted-foreground/60 select-none"
                  title="Shortcuts: Cmd/Ctrl+Enter to submit, Cmd/Ctrl+K to focus"
                >
                  <div className="flex items-center gap-1.5 transition-colors hover:text-muted-foreground/90">
                    <span className="flex items-center gap-0.5">
                      <kbd className="font-sans bg-muted/60 border border-border/60 rounded px-1.5 text-[10px] leading-tight text-muted-foreground/80">
                        ⌘
                      </kbd>
                      <kbd className="font-sans bg-muted/60 border border-border/60 rounded px-1.5 text-[10px] leading-tight text-muted-foreground/80">
                        Enter
                      </kbd>
                    </span>
                    <span>to submit</span>
                  </div>
                  <div className="flex items-center gap-1.5 transition-colors hover:text-muted-foreground/90">
                    <span className="flex items-center gap-0.5">
                      <kbd className="font-sans bg-muted/60 border border-border/60 rounded px-1.5 text-[10px] leading-tight text-muted-foreground/80">
                        ⌘
                      </kbd>
                      <kbd className="font-sans bg-muted/60 border border-border/60 rounded px-1.5 text-[10px] leading-tight text-muted-foreground/80">
                        K
                      </kbd>
                    </span>
                    <span>to focus</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleGenerate()}
                disabled={
                  isLoading ||
                  !userInput.trim() ||
                  isRateLimited ||
                  isGuestLocked
                }
                size="lg"
                className="rounded-xl px-6 transition-all duration-300 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Processing
                  </>
                ) : showError ? (
                  <>
                    <RotateCw className="w-4 h-4 mr-2" />
                    Retry
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
