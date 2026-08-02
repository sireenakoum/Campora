export default function ErrorMessage({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div 
      className="error-banner" 
      style={{
        backgroundColor: '#ffebe9',
        color: '#d12420',
        padding: '0.75rem 1rem',
        borderRadius: '6px',
        border: '1px solid rgba(255,129,130,0.4)',
        margin: '1rem 0',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}
    >
      <span>⚠️ {message}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
