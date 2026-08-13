export default function SegmentedControl({ options, value, onChange, size }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={active ? 'segmented-segment active' : 'segmented-segment'}
            onClick={() => onChange(option.value)}
            style={size ? { height: size } : undefined}
          >
            {Icon ? <Icon size={16} /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}