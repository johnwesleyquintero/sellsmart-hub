import { fireEvent, render, screen } from "@/lib/test-utils";
import { AccessibleButton } from "./accessible-button";

describe("AccessibleButton", () => {
  it("renders with correct text", () => {
    render(<AccessibleButton>Click me</AccessibleButton>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<AccessibleButton onClick={handleClick}>Click me</AccessibleButton>);
    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalled();
  });

  it("shows loading state correctly", () => {
    render(
      <AccessibleButton loading loadingText="Loading...">
        Click me
      </AccessibleButton>,
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Click me")).not.toBeInTheDocument();
  });

  it("applies aria attributes correctly", () => {
    render(
      <AccessibleButton
        loading
        ariaLabel="Test button"
        ariaDescribedBy="test-desc"
      >
        Click me
      </AccessibleButton>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Test button");
    expect(button).toHaveAttribute("aria-describedby", "test-desc");
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
