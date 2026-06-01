import { useState, useEffect } from 'react';
import Button from '../UI/Button';

const INITIAL = {
  name: '',
  sku: '',
  price: '',
  quantity_in_stock: '',
};

export default function ProductForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial || INITIAL);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.sku.trim()) errs.sku = 'SKU is required';
    if (!form.price || Number(form.price) <= 0) errs.price = 'Price must be greater than 0';
    if (form.quantity_in_stock === '' || Number(form.quantity_in_stock) < 0)
      errs.quantity_in_stock = 'Stock must be 0 or more';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSubmit({
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      price: parseFloat(form.price),
      quantity_in_stock: parseInt(form.quantity_in_stock, 10),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">
            Product Name <span className="required">*</span>
          </label>
          <input
            id="product-name"
            name="name"
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="e.g. Wireless Mouse"
            value={form.name}
            onChange={handleChange}
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">
            SKU <span className="required">*</span>
          </label>
          <input
            id="product-sku"
            name="sku"
            className={`form-input ${errors.sku ? 'error' : ''}`}
            placeholder="e.g. SKU-WM-001"
            value={form.sku}
            onChange={handleChange}
            style={{ textTransform: 'uppercase' }}
          />
          {errors.sku && <span className="form-error">{errors.sku}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">
              Price ($) <span className="required">*</span>
            </label>
            <input
              id="product-price"
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              className={`form-input ${errors.price ? 'error' : ''}`}
              placeholder="29.99"
              value={form.price}
              onChange={handleChange}
            />
            {errors.price && <span className="form-error">{errors.price}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Stock Qty <span className="required">*</span>
            </label>
            <input
              id="product-qty"
              name="quantity_in_stock"
              type="number"
              min="0"
              className={`form-input ${errors.quantity_in_stock ? 'error' : ''}`}
              placeholder="100"
              value={form.quantity_in_stock}
              onChange={handleChange}
            />
            {errors.quantity_in_stock && (
              <span className="form-error">{errors.quantity_in_stock}</span>
            )}
          </div>
        </div>
      </div>

      <div className="modal-footer" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={loading}>
          {initial ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}
