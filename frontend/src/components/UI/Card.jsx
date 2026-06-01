export default function Card({ children, className = '', onClick }) {
  return (
    <div
      className={`card ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {children}
    </div>
  );
}
