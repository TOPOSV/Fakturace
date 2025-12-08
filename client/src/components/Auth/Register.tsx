import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    company_name: '',
    ico: '',
    dic: '',
    address: '',
    city: '',
    zip: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Hesla se neshodují');
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registrace se nezdařila');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Registrace</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Heslo *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Potvrdit heslo *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Název firmy *</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>IČO</label>
              <input
                type="text"
                name="ico"
                value={formData.ico}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>DIČ</label>
              <input
                type="text"
                name="dic"
                value={formData.dic}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Adresa</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Město</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>PSČ</label>
              <input
                type="text"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Telefon</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="btn-primary">Registrovat se</button>
        </form>
        <p className="auth-link">
          Již máte účet? <a href="/login">Přihlásit se</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
