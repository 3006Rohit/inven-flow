import { useState, useEffect, useCallback } from 'react';
import orderService from '../services/orderService';
import { useToast } from '../hooks/useToast';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import Modal from '../components/UI/Modal';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import OrderForm from '../components/Forms/OrderForm';

const STATUS_FILTERS = ['', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    orderService
      .getAll({ status: statusFilter || undefined, limit: 200 })
      .then((res) => {
        setOrders(res.data.items || []);
        setTotal(res.data.total || 0);
      })
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [statusFilter, addToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCreate = (data) => {
    setSaving(true);
    orderService.create(data)
      .then(() => {
        addToast('Order placed successfully!', 'success');
        setModalOpen(false);
        fetchOrders();
      })
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setSaving(false));
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    setCancelling(true);
    orderService.delete(cancelTarget.id)
      .then(() => {
        addToast('Order cancelled and stock restored', 'success');
        setCancelTarget(null);
        fetchOrders();
      })
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setCancelling(false));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Orders</h2>
          <p>{total} order{total !== 1 ? 's' : ''} total</p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          + New Order
        </Button>
      </div>

      <Card>
        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🛒</span>
            <h3>{statusFilter ? `No ${statusFilter} orders` : 'No orders yet'}</h3>
            <p>
              {statusFilter
                ? `There are no orders with status "${statusFilter}".`
                : 'Create your first order to start selling.'}
            </p>
            {!statusFilter && (
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                + New Order
              </Button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <code
                        style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          cursor: 'pointer',
                        }}
                        onClick={() => setDetailOrder(o)}
                        title="View details"
                      >
                        #{o.id.slice(0, 8)}…
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem' }}>
                        {o.customer_name || '—'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {o.customer_email || ''}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#c7d2fe', fontSize: '0.875rem' }}>
                        {o.product_name || '—'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#818cf8' }}>
                        {o.product_sku || ''}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#94a3b8' }}>{o.quantity}</td>
                    <td style={{ fontWeight: 700, color: '#34d399' }}>
                      ${Number(o.total_amount).toFixed(2)}
                    </td>
                    <td><Badge status={o.order_status} /></td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setDetailOrder(o)}
                          title="View details"
                        >
                          👁️
                        </button>
                        {o.order_status !== 'cancelled' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setCancelTarget(o)}
                            title="Cancel order"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Order Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Order"
      >
        <OrderForm
          onSubmit={handleCreate}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        title="Order Details"
        footer={
          <Button variant="secondary" onClick={() => setDetailOrder(null)}>Close</Button>
        }
      >
        {detailOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              ['Order ID', detailOrder.id],
              ['Customer', `${detailOrder.customer_name} (${detailOrder.customer_email})`],
              ['Product', `${detailOrder.product_name} — ${detailOrder.product_sku}`],
              ['Quantity', detailOrder.quantity],
              ['Total Amount', `$${Number(detailOrder.total_amount).toFixed(2)}`],
              ['Status', null],
              ['Created', new Date(detailOrder.created_at).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{label}</span>
                {label === 'Status' ? (
                  <Badge status={detailOrder.order_status} />
                ) : (
                  <span style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>
                    {value}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Cancel Confirm Modal */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Order"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>Keep Order</Button>
            <Button variant="danger" loading={cancelling} onClick={handleCancel}>
              Cancel Order
            </Button>
          </>
        }
      >
        <span className="confirm-icon">🛒</span>
        <p className="confirm-text">
          Cancel order{' '}
          <span className="confirm-name">#{cancelTarget?.id?.slice(0, 8)}</span>?{' '}
          The product stock will be restored automatically.
        </p>
      </Modal>
    </div>
  );
}
