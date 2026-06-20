"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

interface Step {
  labelKey: string;
  number: number;
}

interface BookingStepsProps {
  currentStep: number;
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  showActions?: boolean;
}

export function BookingSteps({
  currentStep,
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel,
  showActions = true,
}: BookingStepsProps) {
  const t = useT();

  const steps: Step[] = [
    { number: 1, labelKey: "landing.selectTime" },
    { number: 2, labelKey: "common.details" },
    { number: 3, labelKey: "common.confirm" },
  ];

  return (
    <div>
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, i) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isCompleted
                      ? "border-blue-600 bg-blue-600 text-white"
                      : isActive
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500"
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : step.number}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium whitespace-nowrap",
                    isActive ? "text-blue-600 dark:text-blue-400" : isCompleted ? "text-gray-700 dark:text-slate-300" : "text-gray-400 dark:text-slate-500"
                  )}
                >
                  {t(step.labelKey)}
                </span>
              </div>

              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-16 sm:w-24 mx-2 mb-6",
                    currentStep > step.number ? "bg-blue-600" : "bg-gray-200 dark:bg-slate-700"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {showActions && (
        <div className="flex justify-between mt-6">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              {t("common.back")}
            </button>
          ) : (
            <div />
          )}
          {onNext && currentStep < 3 && (
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {nextLabel || t("common.next")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
