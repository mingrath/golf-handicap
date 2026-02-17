"use client";

import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1 py-3 px-4 bg-slate-900/50 border-b border-slate-800/50">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                i < currentStep
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : i === currentStep
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-slate-800 text-slate-500 border border-slate-700"
              }`}
            >
              {i < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-[10px] leading-tight font-medium ${
                i === currentStep
                  ? "text-emerald-400"
                  : i < currentStep
                  ? "text-emerald-500/70"
                  : "text-slate-500"
              }`}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 mb-4 rounded-full transition-all ${
                i < currentStep
                  ? "bg-gradient-to-r from-emerald-500/60 to-emerald-500/30"
                  : "bg-slate-700/50"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
