"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/utils";

const RangeInput = ({
  min = 0,
  max = 100,
  step = 1,
  unit,
  value,
  onChange,
  id,
  "aria-label": ariaLabel,
  "aria-invalid": invalid,
  className,
  disabled,
}: {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  value: number;
  onChange: (value: number) => void;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  className?: string;
  disabled?: boolean;
}) => {
  const uid = React.useId();
  const componentId = id ?? uid;
  const inputRef = useRef<HTMLInputElement>(null);

  const [sliderValue, setSliderValue] = useState<number[]>([value]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [hasUserInput, setHasUserInput] = useState(false);

  // Calculate decimal places from step
  const getDecimalPlaces = useCallback((stepValue: number) => {
    const stepStr = stepValue.toString();
    return stepStr.includes(".") ? stepStr.split(".")[1]?.length || 0 : 0;
  }, []);

  const decimalPlaces = getDecimalPlaces(step);

  // Format value for display
  const formatValue = useCallback((val: number) => val.toFixed(decimalPlaces), [decimalPlaces]);

  // Clamp and round value
  const processValue = useCallback(
    (val: number) => {
      const clampedValue = Math.min(max, Math.max(min, val));
      const roundedValue = Math.round(clampedValue / step) * step;
      return Number.parseFloat(roundedValue.toFixed(10));
    },
    [min, max, step],
  );

  // Update internal state when external value changes
  useEffect(() => {
    const processedValue = processValue(value);
    setSliderValue([processedValue]);

    // Only update input value if user isn't currently typing
    if (!isInputFocused || !hasUserInput) {
      setInputValue(formatValue(processedValue));
    }
  }, [value, processValue, formatValue, isInputFocused, hasUserInput]);

  // Handle input changes with minimal interference
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      setInputValue(rawValue);
      setHasUserInput(true);

      // Allow empty input
      if (rawValue === "") {
        return;
      }

      // Allow negative sign for negative ranges
      if (rawValue === "-" && min < 0) {
        return;
      }

      // Basic number validation - allow partial numbers during typing
      const numberRegex = /^-?(\d+\.?\d*|\.\d+)$/u;
      if (numberRegex.test(rawValue)) {
        const numValue = Number.parseFloat(rawValue);
        if (!isNaN(numValue)) {
          const processedValue = processValue(numValue);
          setSliderValue([processedValue]);
          onChange(processedValue);
        }
      }
    },
    [min, processValue, onChange],
  );

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
    setHasUserInput(false);
  }, []);

  // Handle input blur - format and validate
  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);
    setHasUserInput(false);

    if (inputValue === "" || inputValue === "-") {
      // Use minimum value for empty input
      const processedValue = processValue(min);
      setSliderValue([processedValue]);
      setInputValue(formatValue(processedValue));
      onChange(processedValue);
      return;
    }

    const numValue = Number.parseFloat(inputValue);
    if (!isNaN(numValue)) {
      const processedValue = processValue(numValue);
      setSliderValue([processedValue]);
      setInputValue(formatValue(processedValue));
      onChange(processedValue);
    } else {
      // Reset to current slider value if invalid
      const currentValue = sliderValue[0] || min;
      setInputValue(formatValue(currentValue));
    }
  }, [inputValue, min, processValue, formatValue, onChange, sliderValue]);

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        inputRef.current?.blur();
        return;
      }

      // Allow navigation and editing keys
      const allowedKeys = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
        "Tab",
        "Escape",
      ];

      if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
        return;
      }

      // Allow digits
      if (/^\d$/u.test(e.key)) {
        return;
      }

      // Allow decimal point if not already present
      if (e.key === "." && !inputValue.includes(".") && decimalPlaces > 0) {
        return;
      }

      // Allow minus sign at the beginning for negative ranges
      if (e.key === "-" && min < 0 && inputValue === "") {
        return;
      }

      // Block all other keys
      e.preventDefault();
    },
    [inputValue, decimalPlaces, min],
  );

  // Handle slider changes
  const handleSliderChange = useCallback(
    (newValue: number[]) => {
      const firstValue = newValue[0];
      if (firstValue !== undefined) {
        setSliderValue(newValue);

        // Only update input if user isn't actively typing
        if (!isInputFocused || !hasUserInput) {
          setInputValue(formatValue(firstValue));
        }

        onChange(firstValue);
      }
    },
    [onChange, formatValue, isInputFocused, hasUserInput],
  );

  // Calculate dynamic width based on content
  const getInputWidth = useCallback(() => {
    const maxLength = Math.max(formatValue(min).length, formatValue(max).length, inputValue.length);
    const baseWidth = Math.max(maxLength * 0.6 + 1, 3); // Minimum 3rem
    return unit ? baseWidth + 1.5 : baseWidth; // Add space for unit
  }, [min, max, inputValue, formatValue, unit]);

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Slider
        value={sliderValue}
        onValueChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        aria-hidden
        className="grow"
        disabled={disabled ?? false}
      />

      <div className="relative flex h-8 items-center">
        <Input
          ref={inputRef}
          id={componentId}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          aria-invalid={invalid}
          aria-label={ariaLabel}
          inputMode="decimal"
          placeholder={formatValue(min)}
          className={cn(
            "h-full rounded-md px-2 py-1 text-right transition-all duration-200",
            unit ? "pr-6" : "",
            // Dynamic width with smooth transition
            `min-w-[3rem]`,
          )}
          style={{
            width: `${getInputWidth()}rem`,
          }}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
        />

        {unit ? (
          <span className="text-muted-foreground pointer-events-none absolute right-1.5 text-xs select-none">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default RangeInput;
