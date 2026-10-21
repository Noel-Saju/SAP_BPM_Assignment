import { describe, expect, it, beforeEach } from "vitest";
import { addHistoryEntry, clearHistory, readHistory } from "./historyStorage";

beforeEach(() => {
  clearHistory();
});

describe("historyStorage", () => {
  it("stores a new history entry once and keeps the newest entry first", async () => {
    const entryA = {
      id: "1",
      query: "Customer submits request by email",
      response: {
        summary: "Summary A",
        inefficiencies: ["One issue"],
        suggestions: [
          {
            title: "Improve triage",
            description: "Handle earlier",
            complexity: "medium" as const,
            priority: "high" as const,
          },
        ],
      },
      createdAt: "2024-01-01T00:00:00.000Z",
    };

    const entryB = {
      ...entryA,
      id: "2",
      query: "Customer submits request by email",
      createdAt: "2024-01-02T00:00:00.000Z",
    };

    await addHistoryEntry(entryA);
    await addHistoryEntry(entryB);

    const history = await readHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe("2");
  });

  it("keeps the latest 20 entries in order", async () => {
    for (let index = 0; index < 25; index += 1) {
      await addHistoryEntry({
        id: `entry-${index}`,
        query: `Query ${index}`,
        response: {
          summary: `Summary ${index}`,
          inefficiencies: [`Issue ${index}`],
          suggestions: [
            {
              title: `Suggestion ${index}`,
              description: `Do ${index}`,
              complexity: "low" as const,
              priority: "medium" as const,
            },
          ],
        },
        createdAt: new Date(2024, 0, index + 1).toISOString(),
      });
    }

    const history = await readHistory();
    expect(history).toHaveLength(20);
    expect(history[0].query).toBe("Query 24");
  });
});
