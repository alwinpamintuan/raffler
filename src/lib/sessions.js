import { MAX_TICKETS, REMOVAL_POLICIES, nameKey, ticketTotal } from "./raffle";
export const STORAGE_KEY = "raffler.sessions.v1";
const fail = () => {
  throw new Error(
    "Saved session data could not be read. Your current raffle is still available.",
  );
};
export function validateSession(session) {
  if (
    !session ||
    typeof session.id !== "string" ||
    !session.id ||
    typeof session.name !== "string" ||
    !session.name.trim() ||
    !Number.isFinite(Date.parse(session.updatedAt))
  )
    fail();
  const data = session.data;
  if (
    !data ||
    !Array.isArray(data.participants) ||
    !Array.isArray(data.winners) ||
    !REMOVAL_POLICIES.includes(data.settings?.removal) ||
    typeof data.settings.instant !== "boolean" ||
    !Number.isSafeInteger(data.nextDrawNumber) ||
    data.nextDrawNumber < 1
  )
    fail();
  const ids = new Set(),
    names = new Set(),
    winnerIds = new Set(),
    numbers = new Set();
  for (const item of data.participants) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !item.id ||
      ids.has(item.id) ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      names.has(nameKey(item.name)) ||
      !Number.isSafeInteger(item.tickets) ||
      item.tickets < 1
    )
      fail();
    ids.add(item.id);
    names.add(nameKey(item.name));
  }
  if (ticketTotal(data.participants) > MAX_TICKETS) fail();
  for (const winner of data.winners) {
    if (
      !winner ||
      typeof winner.id !== "string" ||
      !winner.id ||
      winnerIds.has(winner.id) ||
      typeof winner.participantId !== "string" ||
      !winner.participantId ||
      typeof winner.name !== "string" ||
      !winner.name.trim() ||
      !Number.isSafeInteger(winner.number) ||
      winner.number < 1 ||
      numbers.has(winner.number) ||
      winner.number >= data.nextDrawNumber ||
      !REMOVAL_POLICIES.includes(winner.policy) ||
      !Number.isFinite(Date.parse(winner.drawnAt))
    )
      fail();
    winnerIds.add(winner.id);
    numbers.add(winner.number);
  }
  return {
    id: session.id,
    name: session.name,
    updatedAt: session.updatedAt,
    data: {
      participants: data.participants.map(({ id, name, tickets }) => ({
        id,
        name: name.trim(),
        tickets,
      })),
      winners: data.winners.map(
        ({ id, participantId, name, number, drawnAt, policy }) => ({
          id,
          participantId,
          name,
          number,
          drawnAt,
          policy,
        }),
      ),
      settings: {
        removal: data.settings.removal,
        instant: data.settings.instant,
      },
      nextDrawNumber: data.nextDrawNumber,
    },
  };
}
export function readSessions(storage = window.localStorage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return [];
  let envelope;
  try {
    envelope = JSON.parse(raw);
  } catch {
    fail();
  }
  if (envelope?.version !== 1 || !Array.isArray(envelope.sessions)) fail();
  const sessions = envelope.sessions.map(validateSession);
  if (new Set(sessions.map((item) => item.id)).size !== sessions.length) fail();
  return sessions;
}
export function writeSessions(sessions, storage = window.localStorage) {
  sessions.forEach(validateSession);
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, sessions }));
}
