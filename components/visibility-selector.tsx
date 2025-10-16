"use client";

import { Globe, Link2, Lock, ChevronDown } from "lucide-react";
import type { VisibilityType } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VisibilitySelectorProps {
  value: VisibilityType;
  onChange: (value: VisibilityType) => void;
  disabled?: boolean;
  label?: string;
}

export function VisibilitySelector({ value, onChange, disabled = false, label }: VisibilitySelectorProps) {
  const options: { value: VisibilityType; label: string; icon: typeof Globe; description: string }[] = [
    {
      value: "public",
      label: "Public",
      icon: Globe,
      description: "Anyone can see this image and it appears in the public gallery"
    },
    {
      value: "unlisted",
      label: "Unlisted",
      icon: Link2,
      description: "Anyone with the link can view, but won't appear in public gallery"
    },
    {
      value: "private",
      label: "Private",
      icon: Lock,
      description: "Only you can view this image"
    }
  ];

  const selectedOption = options.find(opt => opt.value === value);
  const SelectedIcon = selectedOption?.icon || Globe;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
          {label}
        </label>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={disabled}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            <div className="flex items-center gap-2">
              <SelectedIcon className="h-4 w-4" />
              <span className="text-sm">{selectedOption?.label}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[320px] animate-in fade-in-0 zoom-in-95 duration-[50ms] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-[50ms]">
          <DropdownMenuRadioGroup value={value} onValueChange={(value) => onChange(value as VisibilityType)}>
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  className="flex-col items-start py-2.5 cursor-pointer focus:bg-accent [&>span]:top-3"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                    {option.description}
                  </p>
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
