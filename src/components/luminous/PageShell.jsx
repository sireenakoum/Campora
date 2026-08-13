export default function PageShell({ children, className = '' }) {
  return (
    <div className={`page-shell ${className}`.trim()}>{children}</div>
  );
}