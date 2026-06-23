"use client";

import { cn } from "@/lib/utils";

type SeverityOption = "P1" | "P2" | "P3" | "P4";

interface SeveritySelectorProps {
  value: SeverityOption | null;
  onChange: (value: SeverityOption) => void;
  error?: string;
}

const options: {
  value: SeverityOption;
  emoji: string;
  label: string;
  description: string;
  borderColor: string;
  bgColor: string;
  dotColor: string;
}[] = [
  {
    value: "P1",
    emoji: "🔴",
    label: "Critical",
    description: "System is completely down or customer is blocked from doing their job",
    borderColor: "border-red-500",
    bgColor: "bg-red-50",
    dotColor: "text-red-500",
  },
  {
    value: "P2",
    emoji: "🟠",
    label: "High",
    description: "Major issue, no workaround available",
    borderColor: "border-orange-500",
    bgColor: "bg-orange-50",
    dotColor: "text-orange-500",
  },
  {
    value: "P3",
    emoji: "🟡",
    label: "Medium",
    description: "Workaround exists but it's painful",
    borderColor: "border-yellow-500",
    bgColor: "bg-yellow-50",
    dotColor: "text-yellow-500",
  },
  {
    value: "P4",
    emoji: "🟢",
    label: "Low",
    description: "Minor issue, not time-sensitive",
    borderColor: "border-green-500",
    bgColor: "bg-green-50",
    dotColor: "text-green-500",
  },
];

export function SeveritySelector({ value, onChange, error }: SeveritySelectorProps) {
  return (
    <div>
      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "w-full text-left p-4 rounded-lg border-2 transition-all",
                isSelected
                  ? `${opt.borderColor} ${opt.bgColor}`
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{opt.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-900">{opt.label}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{opt.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
