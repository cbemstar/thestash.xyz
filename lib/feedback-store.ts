import { promises as fs } from "fs";
import path from "path";

export type FeedbackStatus = "idea" | "planned" | "in_progress" | "shipped";

export type FeedbackItem = {
  id: string;
  title: string;
  description: string;
  status: FeedbackStatus;
  votes: number;
  createdAt: string;
};

type FeedbackFile = {
  items: FeedbackItem[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "feedback.json");

async function ensureFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }

  try {
    await fs.access(DATA_FILE);
  } catch {
    const initial: FeedbackFile = { items: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readFile(): Promise<FeedbackFile> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as FeedbackFile;
    if (!Array.isArray(parsed.items)) {
      return { items: [] };
    }
    return parsed;
  } catch {
    return { items: [] };
  }
}

async function writeFile(data: FeedbackFile): Promise<void> {
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function getAllFeedback(): Promise<FeedbackItem[]> {
  const data = await readFile();
  return data.items
    .slice()
    .sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

export async function addFeedback(input: {
  title: string;
  description: string;
}): Promise<FeedbackItem> {
  const now = new Date().toISOString();
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const item: FeedbackItem = {
    id,
    title: input.title.trim(),
    description: input.description.trim(),
    status: "idea",
    votes: 0,
    createdAt: now,
  };

  const data = await readFile();
  data.items.push(item);
  await writeFile(data);
  return item;
}

export async function voteOnFeedback(id: string, delta: 1 | -1): Promise<FeedbackItem | null> {
  const data = await readFile();
  const index = data.items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = data.items[index];
  const nextVotes = Math.max(0, current.votes + delta);
  const updated: FeedbackItem = { ...current, votes: nextVotes };
  data.items[index] = updated;
  await writeFile(data);
  return updated;
}

export async function updateFeedback(
  id: string,
  updates: { status?: FeedbackStatus; votes?: number }
): Promise<FeedbackItem | null> {
  const data = await readFile();
  const index = data.items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = data.items[index];
  const updated: FeedbackItem = {
    ...current,
    ...(updates.status !== undefined && { status: updates.status }),
    ...(updates.votes !== undefined && { votes: Math.max(0, Math.floor(updates.votes)) }),
  };
  data.items[index] = updated;
  await writeFile(data);
  return updated;
}

export async function deleteFeedback(id: string): Promise<boolean> {
  const data = await readFile();
  const index = data.items.findIndex((item) => item.id === id);
  if (index === -1) return false;
  data.items.splice(index, 1);
  await writeFile(data);
  return true;
}
