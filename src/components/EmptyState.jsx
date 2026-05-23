export function EmptyState({ msg }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF" }}>
      <div style={{ fontSize: 40 }}>📭</div>
      <div style={{ marginTop: 8 }}>{msg}</div>
    </div>
  );
}
