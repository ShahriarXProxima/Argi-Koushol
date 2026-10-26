"use client";

import * as React from "react";
import { Send, Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Web Speech API interface definitions
interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  [index: number]: { [index: number]: SpeechRecognitionResultItem };
}

interface SpeechRecognitionEventLike {
  results?: SpeechRecognitionResultList;
  error?: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEventLike) => void;
  onerror: (event: SpeechRecognitionEventLike) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface IWindow extends Window {
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  SpeechRecognition?: SpeechRecognitionConstructor;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  language: "en" | "bn";
}

export function ChatInput({
  onSend,
  isStreaming,
  language,
}: ChatInputProps) {
  const [input, setInput] = React.useState("");
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<SpeechRecognitionInstance | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Web Speech API Speech-to-Text Handler
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const win = typeof window !== "undefined" ? (window as unknown as IWindow) : null;
    const SpeechRec = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    if (!SpeechRec) {
      toast.error(
        language === "bn"
          ? "আপনার ব্রাউজারে ভয়েস টাইপিং সমর্থিত নয়। অনুগ্রহ করে লিখে পাঠান।"
          : "Voice recognition is not supported in this browser. Please type your message."
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = language === "bn" ? "bn-BD" : "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info(
          language === "bn"
            ? "শুনছি... আপনার প্রশ্ন বলুন..."
            : "Listening... Please speak your question..."
        );
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: SpeechRecognitionEventLike) => {
        console.warn("[SpeechRecognition] Error:", event.error);
        setIsListening(false);
        if (event.error !== "no-speech") {
          toast.error(
            language === "bn"
              ? "ভয়েস শনাক্তকরণে সমস্যা হয়েছে।"
              : "Voice recognition failed. Please try again or type."
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("[SpeechRecognition] Failed to initialize:", err);
      setIsListening(false);
      toast.error(
        language === "bn"
          ? "মাইক্রোফোন সক্রিয় করা সম্ভব হয়নি।"
          : "Could not activate microphone."
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-2.5 bg-card/90 backdrop-blur-md border-t border-border/80 flex items-end gap-1.5 rounded-b-2xl"
    >
      {/* Speech-to-text Microphone Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={toggleListening}
        className={cn(
          "size-9 rounded-xl shrink-0 transition-colors cursor-pointer",
          isListening
            ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 animate-pulse"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title={
          isListening
            ? "Stop listening"
            : language === "bn"
            ? "ভয়েস মেসেজ দিন (bn-BD)"
            : "Voice input (Speech to text)"
        }
        aria-label={isListening ? "Stop listening" : "Voice input"}
      >
        {isListening ? (
          <MicOff className="size-4 text-destructive" />
        ) : (
          <Mic className="size-4" />
        )}
      </Button>

      {/* Auto-growing Text Area */}
      <div className="relative flex-1">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            language === "bn"
              ? "শস্য-প্রহরীকে প্রশ্ন করুন (যেমন: সেচ বা আবহাওয়া)..."
              : "Ask Shoshsho-Prohori (e.g. Should I irrigate?)..."
          }
          rows={1}
          className="w-full resize-none rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs sm:text-[13px] text-foreground placeholder:text-muted-foreground outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/20 max-h-24 min-h-[38px] leading-relaxed transition-all"
        />
      </div>

      {/* Send Button */}
      <Button
        type="submit"
        size="icon-sm"
        disabled={!input.trim() || isStreaming}
        className="size-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-95"
        aria-label="Send message"
      >
        {isStreaming ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
      </Button>
    </form>
  );
}
