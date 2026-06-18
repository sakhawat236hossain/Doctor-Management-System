import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  number: number;
}

const steps: Step[] = [
  { number: 1, label: "তারিখ বেছে নিন" },
  { number: 2, label: "বিস্তারিত দিন" },
  { number: 3, label: "নিশ্চিতকরণ" },
];

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
  nextLabel = "Next",
  showActions = true,
}: BookingStepsProps) {
  return (
    <div>
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, i) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <div key={step.number} className="flex items-center">
              {/* Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isCompleted
                      ? "border-blue-600 bg-blue-600 text-white"
                      : isActive
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-gray-200 bg-white text-gray-400"
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : step.number}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium whitespace-nowrap",
                    isActive ? "text-blue-600" : isCompleted ? "text-gray-700" : "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Line */}
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-16 sm:w-24 mx-2 mb-6",
                    currentStep > step.number ? "bg-blue-600" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex justify-between mt-6">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
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
              {nextLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
