import { useState, forwardRef } from "react";

interface GlowInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  isValid?: boolean;
}

const GlowInput = forwardRef<HTMLInputElement, GlowInputProps>(
  ({ hasError, isValid, className, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <div className="glow-input-wrapper" data-focused={focused} data-error={hasError} data-valid={isValid && !hasError}>
        {/* Rotating conic-gradient ring */}
        <div className="glow-ring" />
        {/* Inner mask to hollow out the ring */}
        <div className="glow-ring-mask" />
        <input
          ref={ref}
          {...props}
          className={`glow-input ${className || ""}`}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
        />
      </div>
    );
  }
);

GlowInput.displayName = "GlowInput";
export default GlowInput;
