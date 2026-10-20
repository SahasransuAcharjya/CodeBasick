import React, { InputHTMLAttributes, forwardRef, useId } from "react";
import styles from "./Form.module.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, errorMessage, required, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className={styles.formGroup}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            <span>
              {label}
              {required && <span className={styles.required}>*</span>}
            </span>
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${styles.control} ${errorMessage ? styles.controlError : ""} ${className || ""}`}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={
            errorMessage ? errorId : helperText ? helperId : undefined
          }
          required={required}
          {...props}
        />
        {errorMessage ? (
          <p id={errorId} className={styles.errorText} role="alert">
            {errorMessage}
          </p>
        ) : helperText ? (
          <p id={helperId} className={styles.helperText}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
