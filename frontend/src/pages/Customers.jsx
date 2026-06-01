import { useState, useEffect, useCallback } from 'react';
import customerService from '../services/customerService';
import { useToast } from '../hooks/useToast';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import CustomerForm from '../components/Forms/CustomerForm';

export default function Customers() {
  const { addToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomers = useCallback(() => {
    setLoading(true);
    customerService
      .getAll({ search: search || undefined, limit: 200 })
      .then((res) => {
        setCustomers(res.data.items || []);
        setTotal(res.data.total || 0);
      })
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [search, addToast]);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleCreate = (data) => {
    setSaving(true);
    customerService.create(data)
      .then(() => {
        addToast('Customer added successfully', 'success');
        setModalOpen(false);
        fetchCustomers();
      })
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    customerService.delete(deleteTarget.id)
      .then(() => {
        addToast('Customer deleted', 'success');
        setDeleteTarget(null);
        fetchCustomers();
      })
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setDeleting(false));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Customers</h2>
          <p>{total} customer{total !== 1 ? 's' : ''} registered</p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          + Add Customer
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              id="customer-search"
              className="form-input"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">👥</span>
            <h3>{search ? 'No results found' : 'No customers yet'}</h3>
            <p>{search ? 'Try a different search term.' : 'Add your first customer to start creating orders.'}</p>
            {!search && (
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                + Add Customer
              </Button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{c.full_name}</td>
                    <td style={{ color: '#818cf8' }}>{c.email}</td>
                    <td style={{ color: '#64748b' }}>{c.phone_number || '—'}</td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(c)}
                        title="Delete customer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Customer"
      >
        <CustomerForm
          onSubmit={handleCreate}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Customer"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete Customer
            </Button>
          </>
        }
      >
        <span className="confirm-icon">👤</span>
        <p className="confirm-text">
          Are you sure you want to delete{' '}
          <span className="confirm-name">"{deleteTarget?.full_name}"</span>?
          This will fail if the customer has existing orders.
        </p>
      </Modal>
    </div>
  );
}
