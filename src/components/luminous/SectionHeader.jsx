export default function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="section-head">
      <div className="section-head-text">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="section-action">{action}</div> : null}
    </div>
  );
}