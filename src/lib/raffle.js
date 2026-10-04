export const MAX_TICKETS = 1000000;
export const REMOVAL_POLICIES = ["participant", "ticket", "keep"];
let sequence = 0;
export const createId = () =>
  `${Date.now().toString(36)}-${(++sequence).toString(36)}`;
export const nameKey = (name) => name.trim().toLocaleLowerCase("en");
export const ticketTotal = (participants) =>
  participants.reduce((sum, item) => sum + item.tickets, 0);

export function validateTickets(value) {
  const tickets = Number(value);
  if (
    !/^\d+$/.test(String(value).trim()) ||
    !Number.isSafeInteger(tickets) ||
    tickets < 1 ||
    tickets > MAX_TICKETS
  ) {
    throw new Error(
      `Tickets must be a whole number from 1 to ${MAX_TICKETS.toLocaleString()}.`,
    );
  }
  return tickets;
}

// CSV with quoted commas, escaped quotes, and multiline fields.
export function parseCSV(text) {
  const rows = [];
  let row = [],
    field = "",
    quoted = false,
    closed = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
        closed = true;
      } else field += char;
    } else if (char === '"') {
      if (field || closed)
        throw new Error(
          "Unexpected quote in CSV. Wrap the entire field in quotes.",
        );
      quoted = true;
    } else if (char === "," || char === "\n" || char === "\r") {
      row.push(field);
      field = "";
      closed = false;
      if (char !== ",") {
        rows.push(row);
        row = [];
        if (char === "\r" && text[i + 1] === "\n") i++;
      }
    } else {
      if (closed && !/\s/.test(char))
        throw new Error("Unexpected text after a quoted CSV field.");
      if (!closed) field += char;
    }
  }
  if (quoted)
    throw new Error("A quoted CSV field is missing its closing quote.");
  row.push(field);
  rows.push(row);
  return rows.filter((values) => values.some((value) => value.trim()));
}

export function previewImport(text, format = "text", mode = "unique") {
  if (text.length > 1000000) throw new Error("Import up to 1 MB at a time.");
  let source;
  if (format === "csv") {
    const rows = parseCSV(text.replace(/^\uFEFF/, ""));
    if (!rows.length) return { participants: [], duplicates: 0, tickets: 0 };
    const headers = rows.shift().map(nameKey);
    const nameColumn = headers.indexOf("name"),
      ticketColumn = headers.indexOf("tickets");
    if (nameColumn < 0)
      throw new Error(
        'CSV needs a header named "name" and optionally "tickets".',
      );
    source = rows.map((row, index) => {
      if (row.length !== headers.length)
        throw new Error(
          `CSV row ${index + 2} has the wrong number of columns.`,
        );
      const name = row[nameColumn].trim();
      if (!name) throw new Error(`CSV row ${index + 2} needs a name.`);
      try {
        return {
          name,
          tickets: ticketColumn < 0 ? 1 : validateTickets(row[ticketColumn]),
        };
      } catch (error) {
        throw new Error(`CSV row ${index + 2}: ${error.message}`);
      }
    });
  } else {
    source = text
      .split(/\r\n|\n|\r/)
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name, tickets: 1 }));
  }
  if (source.length > 10000)
    throw new Error("Import up to 10,000 entries at a time.");
  const merged = new Map();
  let duplicates = 0;
  source.forEach((item) => {
    const key = nameKey(item.name);
    if (merged.has(key)) {
      duplicates++;
      if (mode === "tickets") merged.get(key).tickets += item.tickets;
    } else
      merged.set(key, {
        id: createId(),
        name: item.name,
        tickets: mode === "unique" ? 1 : item.tickets,
      });
  });
  const participants = [...merged.values()],
    tickets = ticketTotal(participants);
  if (tickets > MAX_TICKETS)
    throw new Error(
      `A raffle can contain up to ${MAX_TICKETS.toLocaleString()} tickets.`,
    );
  return { participants, duplicates, tickets };
}

export function mergeParticipants(existing, incoming, mode) {
  const result = existing.map((item) => ({ ...item }));
  const byName = new Map(result.map((item) => [nameKey(item.name), item]));
  incoming.forEach((item) => {
    const key = nameKey(item.name),
      match = byName.get(key);
    if (match && mode === "tickets") match.tickets += item.tickets;
    else if (!match) {
      const next = { ...item };
      result.push(next);
      byName.set(key, next);
    }
  });
  if (ticketTotal(result) > MAX_TICKETS)
    throw new Error(
      `A raffle can contain up to ${MAX_TICKETS.toLocaleString()} tickets.`,
    );
  return result;
}

export function randomInteger(size, cryptoSource = window.crypto) {
  if (!Number.isSafeInteger(size) || size < 1 || size > 0x100000000)
    throw new Error("No valid tickets to draw.");
  if (!cryptoSource?.getRandomValues)
    throw new Error(
      "Secure drawing is unavailable. Open Raffler over HTTPS or localhost.",
    );
  const limit = Math.floor(0x100000000 / size) * size;
  const buffer = new Uint32Array(1);
  do {
    cryptoSource.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % size;
}
export function participantAtTicket(participants, ticket) {
  if (
    !Number.isInteger(ticket) ||
    ticket < 0 ||
    ticket >= ticketTotal(participants)
  )
    throw new Error("Ticket is outside the eligible pool.");
  for (const participant of participants) {
    if (ticket < participant.tickets) return participant;
    ticket -= participant.tickets;
  }
}
export function chooseWinner(participants, cryptoSource) {
  return participantAtTicket(
    participants,
    randomInteger(ticketTotal(participants), cryptoSource),
  );
}
// Visual cycling is independent of the already-selected winning ticket.
export const animationIndex = (frame, count) =>
  Math.floor(((frame * 0.618033988749895) % 1) * count);

const csvField = (value) => {
  let text = String(value);
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};
export const resultsText = (winners) =>
  winners
    .map(
      (winner) =>
        `Draw ${winner.number}: ${winner.name} — ${new Date(winner.drawnAt).toLocaleString()}`,
    )
    .join("\n");
export const resultsCSV = (winners) =>
  "\uFEFF" +
  [
    ["Draw", "Name", "Drawn at", "Removal policy"],
    ...winners.map((winner) => [
      winner.number,
      winner.name,
      winner.drawnAt,
      winner.policy,
    ]),
  ]
    .map((row) => row.map(csvField).join(","))
    .join("\r\n");

export const initialState = () => ({
  workspaceId: createId(),
  participants: [],
  winners: [],
  settings: { removal: "participant", instant: false },
  nextDrawNumber: 1,
  phase: "idle",
  draw: null,
  undo: null,
  dirty: false,
  savedId: null,
  sessionName: "",
  notice: "",
});
export function raffleReducer(state, action) {
  if (
    state.phase === "drawing" &&
    !["FRAME", "FINISH", "ERROR"].includes(action.type)
  )
    return state;
  switch (action.type) {
    case "PARTICIPANTS":
      return {
        ...state,
        participants: action.participants,
        undo: null,
        dirty: true,
        notice: state.undo
          ? "Entries changed. The previous draw can no longer be undone."
          : "",
      };
    case "SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.settings },
        dirty: true,
      };
    case "START": {
      if (!state.participants.some((item) => item.id === action.winner.id))
        return state;
      return {
        ...state,
        phase: "drawing",
        draw: {
          winner: { ...action.winner },
          policy: state.settings.removal,
          frame: 0,
        },
        notice: "",
      };
    }
    case "FRAME":
      return state.phase === "drawing"
        ? { ...state, draw: { ...state.draw, frame: action.frame } }
        : state;
    case "FINISH": {
      if (state.phase !== "drawing") return state;
      const { winner, policy } = state.draw;
      const participants = state.participants.flatMap((item) =>
        item.id !== winner.id || policy === "keep"
          ? [item]
          : policy === "ticket" && item.tickets > 1
            ? [{ ...item, tickets: item.tickets - 1 }]
            : [],
      );
      const result = {
        id: action.id,
        participantId: winner.id,
        name: winner.name,
        number: state.nextDrawNumber,
        drawnAt: action.drawnAt,
        policy,
      };
      return {
        ...state,
        participants,
        winners: [...state.winners, result],
        phase: "idle",
        draw: null,
        nextDrawNumber: state.nextDrawNumber + 1,
        undo: {
          participants: state.participants,
          resultId: result.id,
          number: result.number,
        },
        dirty: true,
      };
    }
    case "UNDO":
      return state.undo
        ? {
            ...state,
            participants: state.undo.participants,
            winners: state.winners.filter(
              (item) => item.id !== state.undo.resultId,
            ),
            nextDrawNumber: state.undo.number,
            undo: null,
            dirty: true,
            notice: "Last draw undone. Its tickets are back in the pool.",
          }
        : state;
    case "CLEAR_HISTORY":
      return {
        ...state,
        winners: [],
        undo: null,
        dirty: true,
        notice: "Winner history cleared. The eligible pool is unchanged.",
      };
    case "SAVED":
      return {
        ...state,
        savedId: action.id,
        sessionName: action.name,
        dirty: false,
        notice: "Session saved on this device.",
      };
    case "RENAMED":
      return {
        ...state,
        sessionName:
          state.savedId === action.id ? action.name : state.sessionName,
        notice: "Saved session renamed.",
      };
    case "DELETED":
      return {
        ...state,
        savedId: state.savedId === action.id ? null : state.savedId,
        sessionName: state.savedId === action.id ? "" : state.sessionName,
        dirty: state.savedId === action.id || state.dirty,
        notice: "Saved session deleted.",
      };
    case "LOAD":
      return {
        ...initialState(),
        ...action.session.data,
        savedId: action.session.id,
        sessionName: action.session.name,
        notice: "Saved session loaded.",
      };
    case "NEW":
      return initialState();
    case "NOTICE":
      return { ...state, notice: action.message };
    case "ERROR":
      return { ...state, phase: "idle", draw: null, notice: action.message };
    default:
      return state;
  }
}
export function sessionData(state) {
  return {
    participants: state.participants,
    winners: state.winners,
    settings: state.settings,
    nextDrawNumber: state.nextDrawNumber,
  };
}
