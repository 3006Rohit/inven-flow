import { useState } from 'react';
import Button from '../UI/Button';

const INITIAL = { full_name: '', email: '', phone_number: '' };

export default function CustomerForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }
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
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone_number: form.phone_number.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">
            Full Name <span className="required">*</span>
          </label>
          <input
            id="customer-name"
            name="full_name"
            className={`form-input ${errors.full_name ? 'error' : ''}`}
            placeholder="Jane Doe"
            value={form.full_name}
            onChange={handleChange}
          />
          {errors.full_name && <span className="form-error">{errors.full_name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Email Address <span className="required">*</span>
          </label>
          <input
            id="customer-email"
            name="email"
            type="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="jane@example.com"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            id="customer-phone"
            name="phone_number"
            type="tel"
            className="form-input"
            placeholder="+1-555-0101"
            value={form.phone_number}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="modal-footer" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={loading}>
          Add Customer
        </Button>
      </div>
    </form>
  );
}
