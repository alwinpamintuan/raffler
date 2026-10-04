import React, { useContext, useMemo, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";
import { mergeParticipants, previewImport, ticketTotal } from "../lib/raffle";
import Dialog from "./Dialog";
import Icon from "./Icon";

export default function ImportDialog({ onClose }) {
  const { state, dispatch } = useContext(AppContext);
  const [text, setText] = useState(""),
    [format, setFormat] = useState("text"),
    [mode, setMode] = useState("unique"),
    [fileError, setFileError] = useState(""),
    [reading, setReading] = useState(false);
  const fileRef = useRef(null),
    mounted = useRef(true);
  React.useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  const preview = useMemo(() => {
    try {
      const result = previewImport(text, format, mode);
      return {
        ...result,
        combined: mergeParticipants(
          state.participants,
          result.participants,
          mode,
        ),
      };
    } catch (error) {
      return { error: error.message, participants: [] };
    }
  }, [text, format, mode, state.participants]);
  const readFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFileError("");
    if (!/\.(txt|csv)$/i.test(file.name)) {
      setFileError("Choose a .txt or .csv file.");
      return;
    }
    if (file.size > 1000000) {
      setFileError("Import up to 1 MB at a time.");
      return;
    }
    setReading(true);
    try {
      const value = await file.text();
      if (mounted.current) {
        setText(value);
        setFormat(/\.csv$/i.test(file.name) ? "csv" : "text");
      }
    } catch {
      if (mounted.current)
        setFileError("Could not read that file. Try pasting its contents.");
    } finally {
      if (mounted.current) setReading(false);
    }
    event.target.value = "";
  };
  return (
    <Dialog title="Bring everyone into the draw" onClose={onClose} wide>
      <p className="dialog-description">
        Paste a list or import a file. You’ll review it before anything changes.
      </p>
      <div className="import-toolbar">
        <label className="field-label">
          Format
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value)}
          >
            <option value="text">Names, one per line</option>
            <option value="csv">CSV with headers</option>
          </select>
        </label>
        <button
          className="button secondary"
          disabled={reading}
          onClick={() => fileRef.current.click()}
        >
          <Icon name="upload" />
          {reading ? "Reading…" : "Choose file"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.csv,text/plain,text/csv"
          className="visually-hidden"
          tabIndex={-1}
          aria-label="Import file"
          onChange={readFile}
        />
      </div>
      <label className="field-label" htmlFor="bulk-entries">
        {format === "csv" ? "CSV contents" : "Participant names"}
      </label>
      <textarea
        id="bulk-entries"
        data-autofocus
        rows={7}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setFileError("");
        }}
        placeholder={
          format === "csv"
            ? "name,tickets\nMaria Santos,3\nJuan Cruz,1"
            : "Maria Santos\nJuan Cruz\nAna Reyes"
        }
      />
      <p className="hint">
        {format === "csv"
          ? "Headers: name and optional tickets. Quoted fields are supported."
          : "Each nonempty line is an entry. Extra spaces are trimmed."}
      </p>
      <fieldset className="import-options">
        <legend>How should chances work?</legend>
        <label className={`radio-card ${mode === "unique" ? "selected" : ""}`}>
          <input
            type="radio"
            name="duplicate-mode"
            value="unique"
            checked={mode === "unique"}
            onChange={() => setMode("unique")}
          />
          <span>
            <strong>One ticket per name</strong>
            <small>Ignore repeats and imported ticket counts.</small>
          </span>
        </label>
        <label className={`radio-card ${mode === "tickets" ? "selected" : ""}`}>
          <input
            type="radio"
            name="duplicate-mode"
            value="tickets"
            checked={mode === "tickets"}
            onChange={() => setMode("tickets")}
          />
          <span>
            <strong>Combine repeats into tickets</strong>
            <small>Repeated names and ticket counts add extra chances.</small>
          </span>
        </label>
      </fieldset>
      {(fileError || preview.error) && (
        <p role="alert" className="form-error">
          {fileError || preview.error}
        </p>
      )}
      {!preview.error && (
        <div className="import-preview" aria-live="polite">
          <strong>
            {preview.participants.length.toLocaleString()} participants ·{" "}
            {preview.tickets?.toLocaleString()} tickets
          </strong>
          <span>
            {preview.duplicates} repeated{" "}
            {preview.duplicates === 1 ? "name" : "names"}{" "}
            {mode === "unique" ? "ignored" : "combined"}. After import:{" "}
            {preview.combined.length.toLocaleString()} participants,{" "}
            {ticketTotal(preview.combined).toLocaleString()} tickets.
          </span>
          <p>
            {preview.participants
              .slice(0, 5)
              .map((item) => `${item.name} (${item.tickets})`)
              .join(" · ")}
            {preview.participants.length > 5 ? " · …" : ""}
          </p>
        </div>
      )}
      <div className="dialog-actions">
        <button className="button secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="button primary"
          disabled={
            reading ||
            Boolean(fileError || preview.error) ||
            !preview.participants.length
          }
          onClick={() => {
            dispatch({ type: "PARTICIPANTS", participants: preview.combined });
            onClose();
          }}
        >
          Add to raffle
          <Icon name="arrow" />
        </button>
      </div>
    </Dialog>
  );
}
