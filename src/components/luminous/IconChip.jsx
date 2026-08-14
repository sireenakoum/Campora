export default function IconChip({ icon: Icon, tone = 'primary', size = 20, lg = false }) {
  return (
    <span className={`icon-chip tone-${tone} ${lg ? 'icon-chip-lg' : ''}`}>
      <Icon size={size} strokeWidth={1.6} />
    </span>
  );
}