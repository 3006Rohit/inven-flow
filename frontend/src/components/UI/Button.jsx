export default function Button({
  children,
  variant = 'primary',
  size = '',
  className = '',
  loading = false,
  ...props
}) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  }[variant] || 'btn-primary';

  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: 14,
            height: 14,
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </button>
  );
}
