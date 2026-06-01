import { useState, useEffect } from 'react';
import Button from '../UI/Button';
import customerService from '../../services/customerService';
import productService from '../../services/productService';
import LoadingSpinner from '../UI/LoadingSpinner';

export default function OrderForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ customer_id: '', product_id: '', quantity: 1 });
  const [errors, setErrors] = useState({});
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    Promise.all([
      customerService.getAll({ limit: 500 }),
      productService.getAll({ limit: 500 }),
    ])
      .then(([custRes, prodRes]) => {
        setCustomers(custRes.data.items || []);
        setProducts(prodRes.data.items || []);
      })
      .finally(() => setFetching(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'quantity' ? Number(value) : value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    if (name === 'product_id') {
      const prod = products.find((p) => p.id === value);
      setSelectedProduct(prod || null);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.customer_id) errs.customer_id = 'Select a customer';
    if (!form.product_id) errs.product_id = 'Select a product';
    if (!form.quantity || form.quantity < 1) errs.quantity = 'Quantity must be at least 1';
    if (selectedProduct && form.quantity > selectedProduct.quantity_in_stock)
      errs.quantity = `Only ${selectedProduct.quantity_in_stock} units available`;
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(form);
  };

  if (fetching) return <LoadingSpinner />;

  const estimatedTotal = selectedProduct
    ? (selectedProduct.price * form.quantity).toFixed(2)
    : null;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">
            Customer <span className="required">*</span>
          </label>
          <select
            id="order-customer"
            name="customer_id"
            className={`form-select ${errors.customer_id ? 'error' : ''}`}
            value={form.customer_id}
            onChange={handleChange}
          >
            <option value="">— Select customer —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} ({c.email})
              </option>
            ))}
          </select>
          {errors.customer_id && <span className="form-error">{errors.customer_id}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Product <span className="required">*</span>
          </label>
          <select
            id="order-product"
            name="product_id"
            className={`form-select ${errors.product_id ? 'error' : ''}`}
            value={form.product_id}
            onChange={handleChange}
          >
            <option value="">— Select product —</option>
            {products.map((p) => (
              <option
                key={p.id}
                value={p.id}
                disabled={p.quantity_in_stock === 0}
              >
                {p.name} ({p.sku}) — ${p.price} — {p.quantity_in_stock} in stock
              </option>
            ))}
          </select>
          {errors.product_id && <span className="form-error">{errors.product_id}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Quantity <span className="required">*</span>
          </label>
          <input
            id="order-quantity"
            name="quantity"
            type="number"
            min="1"
            max={selectedProduct?.quantity_in_stock || 9999}
            className={`form-input ${errors.quantity ? 'error' : ''}`}
            value={form.quantity}
            onChange={handleChange}
          />
          {errors.quantity && <span className="form-error">{errors.quantity}</span>}
        </div>

        {estimatedTotal && (
          <div
            style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              color: '#a5b4fc',
            }}
          >
            <span style={{ color: '#64748b' }}>Estimated Total: </span>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#818cf8' }}>
              ${estimatedTotal}
            </span>
            <span style={{ color: '#475569', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
              (calculated by server)
            </span>
          </div>
        )}
      </div>

      <div className="modal-footer" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={loading}>
          Place Order
        </Button>
      </div>
    </form>
  );
}
