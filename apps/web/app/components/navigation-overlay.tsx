export function NavigationOverlay() {
  return (
    <div
      className="
        fixed inset-0 z-100 flex items-center justify-center bg-base-100/50
      "
    >
      <span
        role="status"
        aria-label="Loading"
        className="loading loading-lg loading-spinner"
      />
    </div>
  );
}
