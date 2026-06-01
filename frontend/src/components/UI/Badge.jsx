const STATUS_CLASSES = {
  pending:   'badge-pending',
  confirmed: 'badge-confirmed',
  shipped:   'badge-shipped',
  delivered: 'badge-delivered',
  cancelled: 'badge-cancelled',
  'low-stock': 'badge-low-stock',
  'in-stock':  'badge-in-stock',
};

export default function Badge({ status, label }) {
  const cls = STATUS_CLASSES[status?.toLowerCase()] || 'badge-confirmed';
  return (
    <span className={`badge ${cls}`}>
      {label || status}
    </span>
  );
}
