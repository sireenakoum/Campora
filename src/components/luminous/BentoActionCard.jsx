export default function BentoActionCard({
  icon: Icon,
  title,
  copy,
  cta,
  badge,
  tone = 'primary',
  onClick,
}) {
  return (
    <button type="button" className={`bento-card tone-${tone}`} onClick={onClick}>
      <Icon className="bento-ghost" size={150} strokeWidth={1} />
      {badge ? <span className="bento-badge">{badge}</span> : null}
      <span className="bento-chip">
        <Icon size={28} strokeWidth={1.6} />
      </span>
      <h3 className="bento-title">{title}</h3>
      <p className="bento-copy">{copy}</p>
      <span className="bento-cta">
        {cta}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </span>
    </button>
  );
}