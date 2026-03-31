"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  BrainCog,
  Mic,
  Paperclip,
  ShieldQuestion,
  Square,
  StopCircle,
  X,
} from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn("z-50 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground shadow-md", className)}
    {...props}
  />
));

TooltipContent.displayName = "TooltipContent";

function ImageDialog({ imageUrl, onClose }: { imageUrl: string | null; onClose: () => void }) {
  if (!imageUrl) return null;
  return (
    <DialogPrimitive.Root open={!!imageUrl} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-[780px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] bg-card p-0 shadow-2xl">
          <img src={imageUrl} alt="attachment preview" className="max-h-[80vh] w-full object-contain" />
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function ClawrencePromptBox({
  placeholder = "Ask Calma about spending, saving, subscriptions, or approval risk...",
  onSend,
  isLoading,
}: {
  placeholder?: string;
  onSend: (message: string, files?: File[]) => void;
  isLoading?: boolean;
}) {
  const [input, setInput] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [recording, setRecording] = React.useState(false);
  const [deepReasoning, setDeepReasoning] = React.useState(false);
  const uploadRef = React.useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!input.trim() && files.length === 0) return;
    onSend(deepReasoning ? `[deeper-guidance] ${input}` : input, files);
    setInput("");
    setFiles([]);
    setPreview(null);
  };

  const hasContent = input.trim().length > 0 || files.length > 0;

  const attach = (file?: File) => {
    if (!file) return;
    setFiles([file]);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => setPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <TooltipProvider>
      <div className={cn("rounded-[2rem] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,241,231,0.98))] p-3 shadow-[0_20px_60px_rgba(38,70,63,0.12)]", isLoading && "border-primary/50")}>
        {preview && (
          <div className="mb-3 flex gap-2">
            <button className="group relative overflow-hidden rounded-2xl" onClick={() => setPreview(preview)}>
              <img src={preview} alt="attachment preview" className="h-16 w-16 object-cover" />
              <span className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-90">
                <X className="h-3 w-3" />
              </span>
            </button>
          </div>
        )}
        <textarea
          className="min-h-28 w-full resize-none border-none bg-transparent px-1 py-2 text-base text-foreground outline-none placeholder:text-muted-foreground"
          placeholder={placeholder}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-3">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
                  onClick={() => uploadRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Attach context</TooltipContent>
            </Tooltip>
            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => attach(event.target.files?.[0])}
            />
            <button
              type="button"
              className={cn(
                "flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.18em] transition",
                deepReasoning ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-white/70 text-muted-foreground",
              )}
              onClick={() => setDeepReasoning((current) => !current)}
            >
              <BrainCog className="h-4 w-4" />
              Think
            </button>
            <div className="rounded-full border border-border bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <ShieldQuestion className="mr-1 inline h-4 w-4 text-primary" />
              Policy-aware
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.button
              key={`${recording}-${hasContent}-${isLoading}`}
              type="button"
              className={cn(
                "flex h-11 min-w-11 items-center justify-center rounded-full px-4 transition",
                hasContent ? "bg-primary text-primary-foreground" : "bg-foreground text-background",
              )}
              onClick={() => {
                if (isLoading) return;
                if (recording) setRecording(false);
                else if (hasContent) submit();
                else setRecording(true);
              }}
              initial={{ scale: 0.94, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0.7 }}
            >
              {isLoading ? (
                <Square className="h-4 w-4" />
              ) : recording ? (
                <StopCircle className="h-5 w-5" />
              ) : hasContent ? (
                <>
                  <ArrowUp className="h-4 w-4" />
                  <span className="text-sm font-semibold">Send</span>
                </>
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </motion.button>
          </AnimatePresence>
        </div>
      </div>
      <ImageDialog imageUrl={preview} onClose={() => setPreview(null)} />
    </TooltipProvider>
  );
}
