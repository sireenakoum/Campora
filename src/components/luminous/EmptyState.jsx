export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={44} strokeWidth={1.4} />
      </div>
      {title ? <h3>{title}</h3> : null}
      {text ? <p>{text}</p> : null}
      {action || null}
    </div>
  );
}