import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { analyseProcess } from "./api/client";

vi.mock("./api/client", () => ({ analyseProcess: vi.fn() }));

const analysis = {
  summary: "Orders are entered by hand.",
  inefficiencies: ["Duplicate data entry."],
  suggestions: [
    {
      title: "Connect the systems",
      description: "Sync order details automatically.",
      complexity: "medium" as const,
      priority: "high" as const,
    },
  ],
};

const analyseProcessMock = vi.mocked(analyseProcess);

describe("App", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits the process and displays structured analysis", async () => {
    const user = userEvent.setup();
    analyseProcessMock.mockResolvedValue(analysis);
    render(<App />);

    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("heading", { name: /find a better way to work/i })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/your process, as it works today/i), "Orders are entered by hand.");
    await user.click(screen.getByRole("button", { name: /analyse process/i }));

    const summarySection = screen.getByRole("region", { name: /process summary/i });
    expect(await within(summarySection).findByText(analysis.summary)).toBeInTheDocument();
    expect(screen.getByText("high priority")).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Adjust priority for Connect the systems" }),
      "medium"
    );
    expect(screen.getByText("medium priority")).toBeInTheDocument();
  });

  it("allows the user to cancel a pending request", async () => {
    let receivedSignal: AbortSignal | undefined;
    analyseProcessMock.mockImplementation((_description, signal) => {
      receivedSignal = signal;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      });
    });
    render(<App />);

    fireEvent.change(screen.getByLabelText(/your process, as it works today/i), {
      target: { value: "Orders are entered by hand." },
    });
    fireEvent.click(screen.getByRole("button", { name: /analyse process/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancel analysis" }));

    await waitFor(() => expect(receivedSignal?.aborted).toBe(true));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
