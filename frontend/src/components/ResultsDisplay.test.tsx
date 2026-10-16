import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ResultsDisplay from "./ResultsDisplay";

const result = {
  summary: "Orders are checked manually before dispatch.",
  inefficiencies: ["The same details are copied between systems."],
  suggestions: [
    {
      title: "Automate order checks",
      description: "Validate required fields as orders are entered.",
      complexity: "medium" as const,
      priority: "high" as const,
    },
  ],
};

describe("ResultsDisplay", () => {
  it("renders analysis sections and exposes suggestion priority and complexity", () => {
    const onPriorityChange = vi.fn();
    render(<ResultsDisplay data={result} onPriorityChange={onPriorityChange} />);

    expect(screen.getByRole("heading", { name: "Process summary" })).toBeInTheDocument();
    expect(screen.getByText(result.summary)).toBeInTheDocument();
    expect(screen.getByText(result.inefficiencies[0])).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Automate order checks" })).toBeInTheDocument();
    expect(screen.getByText("high priority")).toBeInTheDocument();
    expect(screen.getByText("medium complexity")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Adjust priority for Automate order checks" }), {
      target: { value: "medium" },
    });
    expect(onPriorityChange).toHaveBeenCalledWith(0, "medium");
  });
});
