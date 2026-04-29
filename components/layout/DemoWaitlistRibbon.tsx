"use client";

import { FormEvent, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  Mail,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinWaitlist } from "@/lib/handlers/waitlist";
import { cn, getErrorMessage } from "@/lib/utils";

type SubmitState = "idle" | "submitting" | "success" | "error";

const getSuccessMessage = (status: "joined" | "already_joined") =>
  status === "already_joined"
    ? "You are already on the waitlist."
    : "You are on the waitlist.";

export function DemoWaitlistRibbon() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState("submitting");
    setMessage("");

    try {
      const result = await joinWaitlist({
        email,
        source: "dashboard_demo_ribbon",
      });
      setSubmitState("success");
      setMessage(getSuccessMessage(result.status));
    } catch (error) {
      setSubmitState("error");
      setMessage(
        getErrorMessage(error, "Could not join the waitlist. Try again."),
      );
    }
  };

  return (
    <section
      aria-label="Demo mode waitlist"
      className="w-full max-w-xl overflow-hidden rounded-lg border border-amber-300/60 bg-amber-50 text-amber-950 shadow-sm dark:border-amber-400/25 dark:bg-amber-950/35 dark:text-amber-50"
    >
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.16)]" />
            <p className="text-sm font-semibold leading-none">Demo App</p>
          </div>
          <p className="mt-1 text-xs leading-5 text-amber-900/75 dark:text-amber-100/75">
            Full version is still ongoing
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant={isExpanded ? "ghost" : "secondary"}
          className="h-9 shrink-0 rounded-md border border-amber-400/40 bg-white/70 px-3 text-xs font-semibold text-amber-950 shadow-none hover:bg-white dark:border-amber-300/20 dark:bg-amber-100/10 dark:text-amber-50 dark:hover:bg-amber-100/15"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((value) => !value)}
        >
          Join waitlist
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
          />
        </Button>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <form
            onSubmit={handleSubmit}
            className="border-t border-amber-300/50 px-4 py-3 dark:border-amber-300/20"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Email waitlist</span>
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-900/55 dark:text-amber-100/60" />
                <Input
                  type="email"
                  required
                  value={email}
                  disabled={submitState === "submitting"}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (submitState === "success" || submitState === "error") {
                      setSubmitState("idle");
                      setMessage("");
                    }
                  }}
                  placeholder="school@email.sch.id"
                  className="h-10 rounded-md border-amber-300/60 bg-white pl-9 text-sm text-amber-950 placeholder:text-amber-900/45 focus-visible:ring-amber-500/30 dark:border-amber-300/20 dark:bg-amber-950/40 dark:text-amber-50 dark:placeholder:text-amber-100/45"
                />
              </label>
              <Button
                type="submit"
                size="sm"
                disabled={submitState === "submitting" || !email.trim()}
                className="h-10 rounded-md bg-amber-600 px-3 text-xs font-semibold text-white shadow-none hover:bg-amber-700 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-300"
              >
                {submitState === "submitting" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Notify
              </Button>
            </div>

            {message && (
              <p
                aria-live="polite"
                className={cn(
                  "mt-2 flex items-center gap-2 text-xs leading-5",
                  submitState === "success"
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-destructive",
                )}
              >
                {submitState === "success" && (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                )}
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
