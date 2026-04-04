import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CHAT_TYPEWRITER_MAX_LEN,
  CHAT_WELCOME,
  getBotResponse,
  QUICK_PROMPTS,
} from "@/lib/chatbot";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "bot";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function TypewriterReply({
  text,
  onTick,
}: {
  text: string;
  onTick?: () => void;
}) {
  const [shown, setShown] = useState("");
  const tidRef = useRef<ReturnType<typeof setTimeout>>(0);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    setShown("");
    if (!text) return;
    let i = 0;
    let cancelled = false;
    const step = () => {
      if (cancelled) return;
      i += 1;
      setShown(text.slice(0, i));
      onTickRef.current?.();
      if (i < text.length) {
        tidRef.current = window.setTimeout(step, 14);
      }
    };
    tidRef.current = window.setTimeout(step, 70);
    return () => {
      cancelled = true;
      window.clearTimeout(tidRef.current);
    };
  }, [text]);

  return <span>{shown}</span>;
}

const HelpChatbot = () => {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    scrollToEnd("smooth");
  }, [messages, open, scrollToEnd]);

  const pushPair = useCallback((userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = { id: nextId(), role: "user", text: trimmed };
    const reply = getBotResponse(trimmed);
    const botMsg: ChatMessage = { id: nextId(), role: "bot", text: reply };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  }, []);

  const handleSend = useCallback(() => {
    const t = input.trim();
    if (!t) return;
    pushPair(t);
  }, [input, pushPair]);

  return (
    <>
      <div className="fixed inset-x-0 bottom-[4.5rem] z-[60] pointer-events-none">
        <div className="max-w-lg mx-auto flex justify-end pr-3 pointer-events-auto">
          <Button
            type="button"
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg gradient-primary border-0 text-primary-foreground hover:opacity-95"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="help-chat-panel"
            aria-labelledby={titleId}
          >
            {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
            <span className="sr-only">{open ? "Close help chat" : "Open help chat"}</span>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="help-chat-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed inset-x-0 bottom-[6.75rem] z-[59] flex justify-center px-3 pointer-events-none"
          >
            <div
              className={cn(
                "pointer-events-auto w-full max-w-md flex flex-col",
                "bg-card border border-border rounded-2xl shadow-xl",
                "h-[min(78vh,34rem)] overflow-hidden"
              )}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <h2 id={titleId} className="text-sm font-semibold text-foreground">
                  Help
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div
                ref={listRef}
                className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3"
              >
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground leading-relaxed px-1 whitespace-pre-line">
                    {CHAT_WELCOME}
                  </p>
                )}

                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      m.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-secondary-foreground rounded-bl-md whitespace-pre-line"
                      )}
                    >
                      {m.role === "bot" ? (
                        m.text.length >= CHAT_TYPEWRITER_MAX_LEN ? (
                          m.text
                        ) : (
                          <TypewriterReply
                            text={m.text}
                            onTick={() => {
                              const el = listRef.current;
                              if (el) el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
                            }}
                          />
                        )
                      ) : (
                        m.text
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-3 pb-2 shrink-0 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => pushPair(q.message)}
                    className="text-xs px-2.5 py-1 rounded-full border border-border bg-background text-foreground hover:bg-secondary transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <div className="p-3 pt-0 border-t border-border shrink-0 flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about claims, wallet, plans…"
                  className="flex-1 rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  aria-label="Message"
                />
                <Button
                  type="button"
                  size="icon"
                  className="rounded-xl shrink-0"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HelpChatbot;
