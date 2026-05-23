export function EmptyState({ msg }) {
  return (
    <div className="empty">
      <div className="empty-icon">📭</div>
      <div style={{ fontSize: 14 }}>{msg}</div>
    </div>
  );
}
