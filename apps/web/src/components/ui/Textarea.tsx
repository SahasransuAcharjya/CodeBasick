import React, { TextareaHTMLAttributes, forwardRef, useId } from "react";
import styles from "./Form.module.css";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, errorMessage, required, className, id, rows = 3, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    return (
      <div className={styles.formGroup}>
        {label && (
          <label htmlFor={textareaId} className={styles.label}>
            <span>
              {label}
              {required && <span className={styles.required}>*</span>}
            </span>
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
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

Textarea.displayName = "Textarea";
