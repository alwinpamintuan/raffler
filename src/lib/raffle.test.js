import {
  chooseWinner,
  initialState,
  MAX_TICKETS,
  mergeParticipants,
  parseCSV,
  participantAtTicket,
  previewImport,
  raffleReducer,
  randomInteger,
  resultsCSV,
  sessionData,
  validateTickets,
} from "./raffle";
import {
  readSessions,
  STORAGE_KEY,
  validateSession,
  writeSessions,
} from "./sessions";

const pool = [
  { id: "a", name: "Ana", tickets: 3 },
  { id: "b", name: "Bea", tickets: 1 },
];
const cryptoWith = (...values) => ({
  getRandomValues: jest.fn((buffer) => {
    buffer[0] = values.shift();
    return buffer;
  }),
});
const finish = (state) =>
  raffleReducer(state, {
    type: "FINISH",
    id: `draw-${state.nextDrawNumber}`,
    drawnAt: "2026-10-04T08:00:00.000Z",
  });
const start = (state) =>
  raffleReducer(state, { type: "START", winner: state.participants[0] });

describe("Imports and tickets", () => {
  test("trims, ignores empty lines and merges names case-insensitively preserving first spelling", () => {
    const result = previewImport(" Ana \r\n\r\nANA\n Bea \n", "text", "unique");
    expect(
      result.participants.map(({ name, tickets }) => ({ name, tickets })),
    ).toEqual([
      { name: "Ana", tickets: 1 },
      { name: "Bea", tickets: 1 },
    ]);
    expect(result.duplicates).toBe(1);
  });
  test("repeated lines become extra tickets in ticket mode", () => {
    expect(previewImport("Ana\nANA\nAna\nBea", "text", "tickets").tickets).toBe(
      4,
    );
    expect(
      previewImport("Ana\nANA\nAna\nBea", "text", "tickets").participants[0]
        .tickets,
    ).toBe(3);
  });
  test("CSV handles escaped quotes, commas, BOM, multiline fields and CRLF", () => {
    const result = previewImport(
      '\uFEFFname,tickets\r\n"Santos, Ana",3\r\n"Bea ""B""",2\r\n"Long\nName",1',
      "csv",
      "tickets",
    );
    expect(result.participants.map((item) => item.name)).toEqual([
      "Santos, Ana",
      'Bea "B"',
      "Long\nName",
    ]);
    expect(result.tickets).toBe(6);
  });
  test("unique mode discards imported ticket weights and duplicate rows", () => {
    expect(
      previewImport("name,tickets\nAna,3\nANA,2", "csv", "unique").tickets,
    ).toBe(1);
    expect(
      previewImport("name,tickets\nAna,3\nANA,2", "csv", "tickets").tickets,
    ).toBe(5);
  });
  test.each(["0", "-1", "1.2", "foo", "", "1e3", String(MAX_TICKETS + 1)])(
    "rejects invalid count %s",
    (value) => expect(() => validateTickets(value)).toThrow(),
  );
  test.each([
    "name,tickets\nAna,0",
    "person,tickets\nAna,1",
    "name,tickets\nAna,1,2",
    "name,tickets\n,1",
    "name,tickets\nAna,",
    'name,tickets\n"Ana,1',
  ])("rejects malformed CSV: %s", (csv) =>
    expect(() => previewImport(csv, "csv", "unique")).toThrow(),
  );
  test("rejects trailing text outside quoted field", () =>
    expect(() => parseCSV('"Ana"oops')).toThrow());
  test("merges into existing pool without mutating it and respects raffle limit", () => {
    expect(
      mergeParticipants(
        pool,
        [{ id: "c", name: "ANA", tickets: 2 }],
        "tickets",
      )[0],
    ).toEqual({ id: "a", name: "Ana", tickets: 5 });
    expect(
      mergeParticipants(
        pool,
        [{ id: "c", name: "ANA", tickets: 2 }],
        "unique",
      )[0].tickets,
    ).toBe(3);
    expect(pool[0].tickets).toBe(3);
    expect(() =>
      mergeParticipants(
        pool,
        [{ id: "c", name: "Carlo", tickets: MAX_TICKETS }],
        "tickets",
      ),
    ).toThrow();
  });
});

describe("Fair ticket selection", () => {
  test.each([
    [0, "Ana"],
    [2, "Ana"],
    [3, "Bea"],
  ])("ticket %i selects %s", (ticket, name) =>
    expect(participantAtTicket(pool, ticket).name).toBe(name),
  );
  test("rejects biased uint32 tail before taking remainder", () => {
    const source = cryptoWith(0xffffffff, 0xfffffffe, 4);
    expect(randomInteger(3, source)).toBe(2);
    expect(source.getRandomValues).toHaveBeenCalledTimes(2);
  });
  test("weighted winner uses ticket boundaries", () =>
    expect(chooseWinner(pool, cryptoWith(3)).name).toBe("Bea"));
  test("one ticket works and empty or out-of-range tickets fail", () => {
    expect(randomInteger(1, cryptoWith(0xffffffff))).toBe(0);
    expect(() => chooseWinner([])).toThrow();
    expect(() => participantAtTicket(pool, 4)).toThrow();
    expect(() => randomInteger(4, {})).toThrow(/Secure/);
  });
});

describe("Draw lifecycle", () => {
  const setup = (removal) => ({
    ...initialState(),
    participants: pool,
    settings: { removal, instant: false },
  });
  test.each([
    ["participant", 0],
    ["ticket", 2],
    ["keep", 3],
  ])("%s removal leaves %i tickets for winning name", (policy, remaining) => {
    const state = finish(start(setup(policy)));
    expect(
      state.participants.find((item) => item.id === "a")?.tickets || 0,
    ).toBe(remaining);
    expect(state.winners[0]).toMatchObject({ name: "Ana", number: 1, policy });
    expect(state.phase).toBe("idle");
    expect(pool[0].tickets).toBe(3);
  });
  test("locks edits and settings during animation and ignores double start/finish", () => {
    const state = start(setup("participant"));
    expect(
      raffleReducer(state, { type: "PARTICIPANTS", participants: [] }),
    ).toBe(state);
    expect(
      raffleReducer(state, { type: "SETTINGS", settings: { removal: "keep" } }),
    ).toBe(state);
    expect(start(state)).toBe(state);
    const done = finish(state);
    expect(finish(done)).toBe(done);
  });
  test("undo restores the exact pool and numbering, then permits another draw", () => {
    const done = finish(start(setup("ticket")));
    const undone = raffleReducer(done, { type: "UNDO" });
    expect(undone.participants).toEqual(pool);
    expect(undone.winners).toHaveLength(0);
    expect(undone.nextDrawNumber).toBe(1);
    expect(finish(start(undone)).winners[0].number).toBe(1);
  });
  test("editing invalidates undo with a notice; clearing history preserves the pool", () => {
    const done = finish(start(setup("ticket")));
    const edited = raffleReducer(done, {
      type: "PARTICIPANTS",
      participants: [...done.participants],
    });
    expect(edited.undo).toBeNull();
    expect(edited.notice).toMatch(/no longer/);
    const cleared = raffleReducer(done, { type: "CLEAR_HISTORY" });
    expect(cleared.participants).toBe(done.participants);
    expect(cleared.winners).toHaveLength(0);
    expect(cleared.undo).toBeNull();
  });
  test("final participant remains in winner history when pool exhausts", () => {
    const state = finish(
      start({ ...setup("participant"), participants: [pool[0]] }),
    );
    expect(state.participants).toEqual([]);
    expect(state.winners[0].name).toBe("Ana");
  });
  test("repeated ticket draws eventually remove participant and advance numbers", () => {
    let state = { ...setup("ticket"), participants: [pool[0]] };
    for (let i = 0; i < 3; i++) state = finish(start(state));
    expect(state.participants).toEqual([]);
    expect(state.winners.map((w) => w.number)).toEqual([1, 2, 3]);
  });
  test("export quotes names, preserves timestamps, and neutralizes formulas", () => {
    const csv = resultsCSV([
      {
        number: 1,
        name: '=HYPERLINK("x")',
        drawnAt: "2026-10-04T00:00:00Z",
        policy: "ticket",
      },
    ]);
    expect(csv).toContain('"\'=HYPERLINK(""x"")"');
    expect(csv).toContain("2026-10-04T00:00:00Z");
  });
});

describe("Saved sessions", () => {
  const session = () => ({
    id: "saved",
    name: "Friday",
    updatedAt: "2026-10-04T08:00:00Z",
    data: sessionData(finish(start({ ...initialState(), participants: pool }))),
  });
  beforeEach(() => localStorage.clear());
  test("manual serialization round trips pool, settings and results", () => {
    const saved = session();
    writeSessions([saved]);
    expect(readSessions()).toEqual([saved]);
    const loaded = raffleReducer(initialState(), {
      type: "LOAD",
      session: readSessions()[0],
    });
    expect(loaded.dirty).toBe(false);
    expect(loaded.undo).toBeNull();
    expect(loaded.savedId).toBe("saved");
    expect(initialState().participants).toHaveLength(0);
  });
  test.each([
    "{",
    '{"version":2,"sessions":[]}',
    '{"version":1,"sessions":[{}]}',
  ])("rejects malformed or unknown data", (raw) => {
    localStorage.setItem(STORAGE_KEY, raw);
    expect(() => readSessions()).toThrow();
  });
  test("rejects invalid participant weights and winner records", () => {
    const invalid = session();
    invalid.data.participants[0] = {
      ...invalid.data.participants[0],
      tickets: 0,
    };
    expect(() => validateSession(invalid)).toThrow();
    const badWinner = session();
    badWinner.data.winners[0].number = -1;
    expect(() => validateSession(badWinner)).toThrow();
  });
  test("ignores unrecognized transient state when reading saved data", () => {
    const extra = session();
    extra.data.phase = "drawing";
    extra.data.dirty = true;
    expect(validateSession(extra).data.phase).toBeUndefined();
  });
  test("blocked storage is surfaced rather than treated as success", () => {
    expect(() =>
      writeSessions([session()], {
        setItem: () => {
          throw new Error("Quota");
        },
      }),
    ).toThrow("Quota");
    expect(() =>
      readSessions({
        getItem: () => {
          throw new Error("Blocked");
        },
      }),
    ).toThrow("Blocked");
  });
});
