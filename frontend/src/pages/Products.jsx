import { useState, useEffect, useCallback } from 'react';
import productService from '../services/productService';
import { useToast } from '../hooks/useToast';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import Modal from '../components/UI/Modal';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ProductForm from '../components/Forms/ProductForm';

export default function Products() {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    productService
      .getAll({ search: search || undefined, limit: 200 })
      .then((res) => {
        setProducts(res.data.items || []);
        setTotal(res.data.total || 0);
      })
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [search, addToast]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const openCreate = () => { setEditProduct(null); setModalOpen(true); };
  const openEdit = (p) => { setEditProduct(p); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditProduct(null); };

  const handleSubmit = (data) => {
    setSaving(true);
    const req = editProduct
      ? productService.update(editProduct.id, data)
      : productService.create(data);

    req
      .then(() => {
        addToast(
          editProduct ? 'Product updated successfully' : 'Product created successfully',
          'success'
        );
        closeModal();
        fetchProducts();
      })
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    productService
      .delete(deleteTarget.id)
      .then(() => {
        addToast('Product deleted', 'success');
        setDeleteTarget(null);
        fetchProducts();
      })
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setDeleting(false));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Products</h2>
          <p>{total} product{total !== 1 ? 's' : ''} in inventory</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          + Add Product
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              id="product-search"
              className="form-input"
              placeholder="Search by name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📦</span>
            <h3>{search ? 'No results found' : 'No products yet'}</h3>
            <p>{search ? 'Try a different search term.' : 'Add your first product to get started.'}</p>
            {!search && (
              <Button variant="primary" onClick={openCreate}>
                + Add Product
              </Button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{p.name}</td>
                    <td>
                      <code style={{
                        background: 'rgba(99,102,241,0.12)',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.8rem',
                        color: '#818cf8',
                      }}>{p.sku}</code>
                    </td>
                    <td style={{ color: '#34d399', fontWeight: 600 }}>
                      ${Number(p.price).toFixed(2)}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ color: p.quantity_in_stock <= 10 ? '#fb923c' : '#94a3b8' }}>
                        {p.quantity_in_stock}
                      </span>
                    </td>
                    <td>
                      <Badge
                        status={p.quantity_in_stock === 0 ? 'cancelled' : p.quantity_in_stock <= 10 ? 'low-stock' : 'in-stock'}
                        label={p.quantity_in_stock === 0 ? 'Out of Stock' : p.quantity_in_stock <= 10 ? 'Low Stock' : 'In Stock'}
                      />
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(p.updated_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(p)}
                          title="Edit product"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteTarget(p)}
                          title="Delete product"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editProduct ? `Edit: ${editProduct.name}` : 'Add New Product'}
      >
        <ProductForm
          initial={
            editProduct
              ? {
                  name: editProduct.name,
                  sku: editProduct.sku,
                  price: editProduct.price,
                  quantity_in_stock: editProduct.quantity_in_stock,
                }
              : null
          }
          onSubmit={handleSubmit}
          onCancel={closeModal}
          loading={saving}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Product"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete Product
            </Button>
          </>
        }
      >
        <span className="confirm-icon">🗑️</span>
        <p className="confirm-text">
          Are you sure you want to delete{' '}
          <span className="confirm-name">"{deleteTarget?.name}"</span>?{' '}
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
