"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ContextPackPanelProps = {
  pack: string;
};

const CHATGPT_URL = "https://chatgpt.com/";

export function ContextPackPanel({ pack }: ContextPackPanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pack);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copié" : "Copier le pack"}
        </Button>
        <Button asChild variant="primary" size="sm">
          <a href={CHATGPT_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
            Ouvrir ChatGPT
          </a>
        </Button>
      </div>
      <Textarea
        readOnly
        value={pack}
        rows={16}
        aria-label="Pack de contexte à copier dans ChatGPT"
        className="font-mono text-sm leading-relaxed"
        onFocus={(event) => event.currentTarget.select()}
      />
    </div>
  );
}
