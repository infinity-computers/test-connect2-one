"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  Check,
  Zap,
  AlertCircle,
  Wifi,
  Headphones,
  Clock,
  MessageCircle,
  Shield,
} from "lucide-react";

// ─── Issue Type Options with Icons ──────────────────────────────────────────
const issueTypes = [
  { value: "Internet_speed", label: "Internet Speed", icon: Zap },
  { value: "Downtime_outage", label: "Downtime / Outage", icon: AlertCircle },
  { value: "Billing_error", label: "Billing Error", icon: Shield },
  { value: "Equipment_fault", label: "Equipment Fault", icon: Wifi },
  { value: "New_connection_delay", label: "New Connection Delay", icon: Clock },
  { value: "Poor_signal", label: "Poor Signal", icon: Headphones },
  {
    value: "Not_working_more_than_4_hours",
    label: "Not Working > 4 Hrs",
    icon: AlertCircle,
  },
  {
    value: "Not_working_more_than_24_hours",
    label: "Not Working > 24 Hrs",
    icon: AlertCircle,
  },
  {
    value: "Not_working_more_than_48_hours",
    label: "Not Working > 48 Hrs",
    icon: AlertCircle,
  },
  { value: "Other", label: "Other", icon: MessageCircle },
];

// ─── Custom Dropdown Component ──────────────────────────────────────────────
interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  className?: string;
  options?: typeof issueTypes;
}

export function CustomDropdown({
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  placeholder = "Select an option",
  className = "",
  options = issueTypes,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (onBlur) onBlur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onBlur]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        if (onBlur) onBlur();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onBlur]);

  const handleToggle = () => {
    if (!isOpen && onFocus) onFocus();
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    if (onBlur) onBlur();
    // Return focus to button
    setTimeout(() => buttonRef.current?.focus(), 0);
  };

  const getIcon = (icon: any) => {
    const Icon = icon;
    return <Icon size={14} />;
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
          if (e.key === "ArrowDown" && isOpen) {
            e.preventDefault();
            const firstOption = document.querySelector(
              "[data-dropdown-option]",
            ) as HTMLElement;
            firstOption?.focus();
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select issue type"
        className={`
          w-full rounded-xl border bg-white/[0.05] px-3 py-2.5 text-sm text-white 
          placeholder:text-slate-600 focus:outline-none transition-all duration-200
          flex items-center justify-between gap-2
          ${error ? "border-red-400/40 focus:border-red-400/60" : "border-white/[0.08] focus:border-cyan-300/40"}
          ${isOpen ? "border-cyan-300/40 bg-white/[0.08]" : ""}
          hover:bg-white/[0.07] hover:border-white/[0.12]
        `}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption ? (
            <>
              <span className="text-cyan-300 shrink-0">
                {getIcon(selectedOption.icon)}
              </span>
              <span className="truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-slate-600">{placeholder}</span>
          )}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown
            size={16}
            className={`${isOpen ? "text-cyan-300" : "text-slate-500"}`}
          />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for click outside */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="absolute z-20 mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#0a1a2f] shadow-2xl shadow-black/50 overflow-hidden"
              style={{
                backdropFilter: "blur(20px)",
                background:
                  "linear-gradient(135deg, rgba(10,26,47,0.98), rgba(2,6,23,0.98))",
              }}
            >
              <div className="max-h-60 overflow-y-auto py-1.5 scrollbar-thin scrollbar-thumb-cyan-300/20 scrollbar-track-transparent">
                {options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      data-dropdown-option
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelect(option.value);
                        }
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          const next = e.currentTarget
                            .nextElementSibling as HTMLElement;
                          next?.focus();
                        }
                        if (e.key === "ArrowUp") {
                          e.preventDefault();
                          const prev = e.currentTarget
                            .previousElementSibling as HTMLElement;
                          prev?.focus();
                        }
                      }}
                      className={`
                        w-full px-3 py-2.5 text-sm text-left flex items-center gap-3
                        transition-all duration-150
                        ${
                          isSelected
                            ? "bg-cyan-300/10 text-cyan-300"
                            : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                        }
                        focus:outline-none focus:bg-white/[0.05] focus:text-white
                      `}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="shrink-0">{getIcon(option.icon)}</span>
                      <span className="flex-1 truncate">{option.label}</span>
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 15,
                          }}
                        >
                          <Check size={14} className="text-cyan-300 shrink-0" />
                        </motion.span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 mt-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
