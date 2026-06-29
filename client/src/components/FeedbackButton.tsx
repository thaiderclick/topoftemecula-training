import { useState } from "react";
import { MessageSquarePlus, X, Send, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface FeedbackButtonProps {
  moduleId: string;
  slideIndex?: number;
  context?: string; // e.g. "Day 1 – Slide 3: Mission Statement"
}

export default function FeedbackButton({ moduleId, slideIndex, context }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setMessage("");
      }, 1800);
    },
    onError: () => {
      toast.error("Couldn't submit feedback — please try again.");
    },
  });

  const handleSubmit = () => {
    if (!message.trim()) return;
    submit.mutate({ moduleId, slideIndex, context, message: message.trim() });
  };

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Leave feedback or a suggestion"
        className="flex items-center gap-1.5 text-xs text-amber-700/70 hover:text-amber-800 transition-colors duration-150 group"
      >
        <MessageSquarePlus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-150" />
        <span className="hidden sm:inline">Suggest an improvement</span>
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute bottom-8 right-0 z-50 w-72 bg-white rounded-xl shadow-xl border border-amber-100 p-4"
          style={{ animation: "fadeInUp 150ms cubic-bezier(0.23,1,0.32,1)" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-stone-800">Suggest an improvement</p>
              {context && (
                <p className="text-xs text-stone-500 mt-0.5 leading-tight">{context}</p>
              )}
            </div>
            <button
              onClick={() => { setOpen(false); setMessage(""); }}
              className="text-stone-400 hover:text-stone-600 transition-colors ml-2 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center py-4 gap-2 text-green-700">
              <CheckCircle2 className="w-8 h-8" />
              <p className="text-sm font-medium">Thanks for the feedback!</p>
            </div>
          ) : (
            <>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What's confusing, missing, or could be better? Your input helps improve this training for everyone."
                className="w-full text-sm border border-stone-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-stone-700 placeholder:text-stone-400"
                rows={3}
                maxLength={1000}
                autoFocus
              />
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-xs text-stone-400">{message.length}/1000</span>
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || submit.isPending}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150"
                >
                  <Send className="w-3 h-3" />
                  {submit.isPending ? "Sending…" : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: scale(0.95) translateY(4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}
