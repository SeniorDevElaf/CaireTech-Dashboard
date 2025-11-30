"use client";

interface LoadingOverlayProps {
  isVisible: boolean;
  message: string;
  subMessage?: string;
}

/**
 * LoadingOverlay Component
 * 
 * Full-screen loading overlay with animated spinner.
 * Used during optimization to prevent interactions.
 */
export function LoadingOverlay({
  isVisible,
  message,
  subMessage,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center animate-scale-in">
        {/* Animated Logo/Spinner */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-5 sm:mb-6">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-brand-100"></div>
          {/* Spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin"></div>
          {/* Inner icon */}
          <div className="absolute inset-2.5 sm:inset-3 rounded-full bg-gradient-to-br from-brand-500 to-success flex items-center justify-center shadow-lg shadow-brand-500/30">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>

        {/* Messages */}
        <h3 className="font-display font-semibold text-base sm:text-lg text-slate-900 mb-2">
          {message}
        </h3>
        {subMessage && (
          <p className="text-xs sm:text-sm text-slate-500">{subMessage}</p>
        )}

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-5 sm:mt-6">
          <span
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-500 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-500 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-500 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Inline loading indicator for smaller contexts
 */
export function InlineLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500">
      <svg
        className="animate-spin h-4 w-4 text-brand-500"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-sm">{text}</span>
    </div>
  );
}
