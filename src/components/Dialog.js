import React, { useEffect, useRef } from "react";
import Icon from "./Icon";

export default function Dialog({ title, children, onClose, wide = false }) {
  const ref = useRef(null),
    closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current,
      previous = document.activeElement;
    const controls = () =>
      [
        ...dialog.querySelectorAll(
          'button, input, textarea, select, a[href], [tabindex="0"]',
        ),
      ].filter(
        (element) =>
          !element.disabled && !element.hidden && element.tabIndex >= 0,
      );
    const handle = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeRef.current();
      }
      if (event.key === "Tab") {
        const list = controls(),
          first = list[0],
          last = list[list.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !list.includes(document.activeElement))
        ) {
          event.preventDefault();
          last?.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !list.includes(document.activeElement))
        ) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = oldOverflow;
      dialog.removeEventListener("keydown", handle);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => {
    const dialog = ref.current;
    const first = [
      ...dialog.querySelectorAll("button, input, textarea, select"),
    ].find((element) => !element.disabled && element.tabIndex >= 0);
    (dialog.querySelector("[data-autofocus]") || first || dialog).focus();
  }, [title]);
  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabIndex={-1}
        className={`dialog ${wide ? "dialog-wide" : ""}`}
      >
        <div className="dialog-header">
          <h2 id="dialog-title">{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onClose,
}) {
  return (
    <Dialog title={title} onClose={onClose}>
      <p className="dialog-description">{message}</p>
      <div className="dialog-actions">
        <button className="button secondary" data-autofocus onClick={onClose}>
          Cancel
        </button>
        <button
          className="button primary"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
