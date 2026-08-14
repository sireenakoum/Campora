import IconChip from './IconChip';

export default function StatTile({ icon, title, desc, tone = 'primary' }) {
  return (
    <div className="stat-tile">
      <IconChip icon={icon} tone={tone} />
      <div className="stat-tile-title">{title}</div>
      <div className="stat-tile-desc">{desc}</div>
    </div>
  );
}