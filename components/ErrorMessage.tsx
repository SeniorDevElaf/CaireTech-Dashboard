"use client";

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

/**
 * ErrorMessage Component
 * 
 * Displays error messages with a dismissible banner style.
 * Shows special guidance for map coverage errors.
 */
export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  const isMapCoverageError = message.includes("DATASET_INVALID") || message.includes("map coverage");
  
  return (
    <div className={`
      ${isMapCoverageError ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'} 
      border rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3 animate-fade-in-up
    `}>
      <div className="shrink-0 mt-0.5">
        {isMapCoverageError ? (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`text-xs sm:text-sm font-medium ${isMapCoverageError ? 'text-amber-800' : 'text-red-800'}`}>
          {isMapCoverageError ? 'Timefold API Limitation' : 'Something went wrong'}
        </h3>
        <p className={`text-xs sm:text-sm mt-1 ${isMapCoverageError ? 'text-amber-700' : 'text-red-700'} break-words`}>
          {isMapCoverageError 
            ? "The Timefold trial API doesn't have map routing enabled for these locations."
            : message
          }
        </p>
        {isMapCoverageError && (
          <p className="text-xs sm:text-sm text-amber-600 mt-2 flex flex-wrap items-center gap-1 sm:gap-2">
            <span className="font-medium">💡 Tip:</span>
            <span>
              Click <span className="font-semibold text-amber-800">&quot;Simulate Locally&quot;</span> to see optimization demo.
            </span>
          </p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`
            shrink-0 p-1 rounded-lg transition-colors touch-target flex items-center justify-center
            ${isMapCoverageError 
              ? 'text-amber-400 hover:text-amber-600 hover:bg-amber-100' 
              : 'text-red-400 hover:text-red-600 hover:bg-red-100'
            }
          `}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
