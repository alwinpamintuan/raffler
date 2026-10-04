import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import App from "./App";
import { AppContext, AppContextProvider } from "./context/AppContext";
import { STORAGE_KEY } from "./lib/sessions";

beforeEach(() => {
  localStorage.clear();
  window.matchMedia = jest.fn(() => ({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: {
      getRandomValues: jest.fn((buffer) => {
        buffer[0] = 0;
        return buffer;
      }),
    },
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});
const samples = () =>
  fireEvent.click(screen.getByRole("button", { name: /Try sample entries/ }));
const saveSession = (name) => {
  fireEvent.click(
    screen.getByRole("button", { name: "Save session", exact: true }),
  );
  const dialog = screen.getByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("Session name"), {
    target: { value: name },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "Save session" }));
};

test("renders the newsroom and preview applies imports only on request", () => {
  render(<App />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Let luck make the headline.",
  );
  fireEvent.click(screen.getByRole("button", { name: /Paste or import/ }));
  const dialog = screen.getByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("Participant names"), {
    target: { value: "Ana\nANA\nBea" },
  });
  fireEvent.click(
    within(dialog).getByLabelText(/Combine repeats into tickets/),
  );
  expect(
    within(dialog).getByText("2 participants · 3 tickets"),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("Tickets for Ana")).not.toBeInTheDocument();
  fireEvent.click(
    within(dialog).getByRole("button", { name: /Add to raffle/ }),
  );
  expect(screen.getByLabelText("Tickets for Ana")).toHaveValue(2);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("draw locks setup, switches to Draw, reveals once, removes winner and supports undo", () => {
  jest.useFakeTimers();
  render(<App />);
  samples();
  fireEvent.click(screen.getByRole("button", { name: "Draw a winner" }));
  expect(screen.getByRole("tab", { name: /Draw/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.getByLabelText("Tickets for Maria Santos")).toBeDisabled();
  expect(
    screen.getByRole("button", { name: /Drawing the headline/ }),
  ).toBeDisabled();
  act(() => jest.advanceTimersByTime(3120));
  expect(screen.getByText("WINNER ANNOUNCED")).toBeInTheDocument();
  expect(
    screen.queryByLabelText("Tickets for Maria Santos"),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Maria Santos", level: 2 }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Undo last draw" }));
  expect(screen.getByLabelText("Tickets for Maria Santos")).toHaveValue(1);
  expect(screen.getByText("No headlines. Yet.")).toBeInTheDocument();
});

test("instant and reduced-motion draws finish without a suspense timer", () => {
  jest.useFakeTimers();
  window.matchMedia.mockReturnValue({
    matches: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
  render(<App />);
  samples();
  fireEvent.click(screen.getByRole("button", { name: "Draw a winner" }));
  expect(screen.getByText("WINNER ANNOUNCED")).toBeInTheDocument();
  expect(jest.getTimerCount()).toBe(0);
});

test("unmounting a draw clears its single animation timer", () => {
  jest.useFakeTimers();
  const { unmount } = render(<App />);
  samples();
  fireEvent.click(screen.getByRole("button", { name: "Draw a winner" }));
  expect(jest.getTimerCount()).toBe(1);
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

test("saving is manual; refresh is empty and loading restores a saved session", () => {
  const view = render(<App />);
  samples();
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  saveSession("Team Friday");
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).sessions[0].name).toBe(
    "Team Friday",
  );
  fireEvent.change(screen.getByLabelText("Tickets for Maria Santos"), {
    target: { value: "5" },
  });
  fireEvent.blur(screen.getByLabelText("Tickets for Maria Santos"));
  expect(
    JSON.parse(localStorage.getItem(STORAGE_KEY)).sessions[0].data
      .participants[0].tickets,
  ).toBe(1);
  view.unmount();
  render(<App />);
  expect(
    screen.queryByLabelText("Tickets for Maria Santos"),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Saved/ }));
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Load" }),
  );
  expect(screen.getByLabelText("Tickets for Maria Santos")).toHaveValue(1);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("rename and deletion are explicit, and deletion keeps the open raffle", () => {
  render(<App />);
  samples();
  saveSession("Friday");
  fireEvent.click(screen.getByRole("button", { name: /Saved/ }));
  fireEvent.click(screen.getByRole("button", { name: /Rename Friday/ }));
  fireEvent.change(screen.getByLabelText("Session name"), {
    target: { value: "Saturday" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save name" }));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).sessions[0].name).toBe(
    "Saturday",
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete Saturday" }));
  expect(screen.getByRole("button", { name: "Close dialog" })).toHaveFocus();
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).sessions).toHaveLength(
    1,
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete session" }));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).sessions).toHaveLength(
    0,
  );
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(screen.getByLabelText("Tickets for Maria Santos")).toBeInTheDocument();
});

test("loading over unsaved changes requires an explicit replace", () => {
  render(<App />);
  samples();
  saveSession("Friday");
  fireEvent.change(screen.getByLabelText("Tickets for Maria Santos"), {
    target: { value: "7" },
  });
  fireEvent.blur(screen.getByLabelText("Tickets for Maria Santos"));
  fireEvent.click(screen.getByRole("button", { name: /Saved/ }));
  fireEvent.click(screen.getByRole("button", { name: "Load" }));
  expect(screen.getByRole("dialog")).toHaveAccessibleName(
    "Replace the current raffle?",
  );
  fireEvent.click(screen.getByRole("button", { name: "Replace and load" }));
  expect(screen.getByLabelText("Tickets for Maria Santos")).toHaveValue(1);
});

test("storage failure keeps the dialog and current raffle usable", () => {
  render(<App />);
  samples();
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  saveSession("Friday");
  expect(screen.getByRole("alert")).toHaveTextContent("Could not save");
  expect(screen.getByLabelText("Tickets for Maria Santos")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(screen.getByRole("button", { name: "Draw a winner" })).toBeEnabled();
});

test("invalid ticket edit reverts safely; search never changes the eligible pool", () => {
  render(<App />);
  samples();
  fireEvent.change(screen.getByLabelText("Tickets for Maria Santos"), {
    target: { value: "0" },
  });
  fireEvent.blur(screen.getByLabelText("Tickets for Maria Santos"));
  expect(screen.getByLabelText("Tickets for Maria Santos")).toHaveValue(1);
  fireEvent.change(screen.getByLabelText("Search participants"), {
    target: { value: "nobody" },
  });
  expect(screen.getByText(/No names match/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Draw a winner" })).toBeEnabled();
});

test("copy/export feedback and final winner survive an exhausted pool", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Add participant" }));
  fireEvent.change(screen.getByLabelText("Participant name"), {
    target: { value: "Ana" },
  });
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Add participant",
    }),
  );
  fireEvent.click(screen.getByLabelText(/Instant reveal/));
  fireEvent.click(screen.getByRole("button", { name: "Draw a winner" }));
  expect(
    screen.getByText("That’s a wrap. The pool is empty."),
  ).toBeInTheDocument();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: jest.fn().mockResolvedValue() },
  });
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Copy", exact: true })),
  );
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    expect.stringContaining("Draw 1: Ana"),
  );
  expect(screen.getByText(/copied to your clipboard/)).toBeInTheDocument();
  URL.createObjectURL = jest.fn(() => "blob:test");
  URL.revokeObjectURL = jest.fn();
  const anchor = jest
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
  expect(anchor).toHaveBeenCalled();
  expect(screen.getByText(/exported as CSV/)).toBeInTheDocument();
});

test("presentation exits with Escape and dialogs return focus to their trigger", () => {
  render(<App />);
  const trigger = screen.getByRole("button", { name: "Save session" });
  trigger.focus();
  fireEvent.click(trigger);
  expect(screen.getByLabelText("Session name")).toHaveFocus();
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(trigger).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Present" }));
  expect(
    screen.queryByRole("heading", { name: "The entry desk" }),
  ).not.toBeInTheDocument();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.getByRole("button", { name: "Present" })).toBeInTheDocument();
});

test("two synchronous activations cannot start two draws", () => {
  jest.useFakeTimers();
  let current;
  function Probe() {
    current = React.useContext(AppContext);
    return null;
  }
  render(
    <AppContextProvider>
      <Probe />
    </AppContextProvider>,
  );
  act(() =>
    current.dispatch({
      type: "PARTICIPANTS",
      participants: [{ id: "a", name: "Ana", tickets: 1 }],
    }),
  );
  act(() => {
    current.draw();
    current.draw();
  });
  expect(window.crypto.getRandomValues).toHaveBeenCalledTimes(1);
  act(() => jest.advanceTimersByTime(3120));
  expect(current.state.winners).toHaveLength(1);
});

test("a new raffle resets participant search and local editor state", () => {
  render(<App />);
  samples();
  fireEvent.change(screen.getByLabelText("Search participants"), {
    target: { value: "nobody" },
  });
  fireEvent.click(screen.getByRole("button", { name: "New raffle" }));
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "New raffle" }),
  );
  expect(screen.getByLabelText("Search participants")).toHaveValue("");
  samples();
  expect(screen.getByLabelText("Tickets for Maria Santos")).toHaveValue(1);
});
