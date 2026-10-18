export function Loading({ label = 'Loading…' }) {
  return (
    <p className="status" role="status">
      {label}
    </p>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="alert alert-error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-small" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="empty">{children}</p>;
}
