import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Admin.css';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState({
    id: '',
    name: '',
    description: '',
    duration_min: '',
    price: '',
    category: '',
    active: true
  });
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [workItems, setWorkItems] = useState([]);
  const [workForm, setWorkForm] = useState({ id: '', title: '', description: '', category: '', image_url: '', active: true, order: '' });
  const [workFile, setWorkFile] = useState(null);
  const [workPreview, setWorkPreview] = useState('');
  const [editingWorkId, setEditingWorkId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('appointments');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmState, setConfirmState] = useState({ visible: false, type: '', id: null, message: '' });
  const navigate = useNavigate();

  const initRef = useRef(false);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token && !initRef.current) {
      initRef.current = true;
      setIsAuthenticated(true);
      (async () => {
        await fetchAppointments();
        await sleep(200);
        await fetchMessages();
        await sleep(200);
        await fetchServices();
        await sleep(200);
        await fetchWork();
      })();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await axios.post('/api/admin/login', {
        username,
        password
      });
      
      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.token);
        setIsAuthenticated(true);
        toast.success('Login successful!');
        await fetchAppointments();
        await sleep(200);
        await fetchMessages();
        await sleep(200);
        await fetchServices();
        await sleep(200);
        await fetchWork();
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setAppointments([]);
    setUsername('');
    setPassword('');
    toast.info('Logged out successfully');
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Fetching appointments...');
      const response = await axios.get('/api/admin/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Appointments response:', response.data);
      
      if (response.data.success) {
        console.log(`Setting ${response.data.appointments.length} appointments`);
        setAppointments(response.data.appointments);
        await autoCompletePastAppointments(response.data.appointments);
      }
    } catch (error) {
      console.error('Fetch appointments error:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      } else {
        toast.error('Failed to fetch appointments');
      }
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      } else {
        toast.error('Failed to fetch messages');
      }
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/services', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setServices(response.data.services);
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      } else {
        toast.error('Failed to fetch services');
      }
    }
  };

  const fetchWork = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/work', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.data.success) {
        const list = Array.isArray(response.data.work) ? response.data.work : [];
        setWorkItems(list);
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      } else {
        setWorkItems([]);
      }
    }
  };

  const resetServiceForm = () => {
    setServiceForm({ id: '', name: '', description: '', duration_min: '', price: '', category: '', active: true });
    setEditingServiceId(null);
  };

  const resetWorkForm = () => {
    setWorkForm({ id: '', title: '', description: '', category: '', image_url: '', active: true, order: '' });
    setEditingWorkId(null);
    setWorkFile(null);
    setWorkPreview('');
  };

  const addService = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('/api/admin/services', serviceForm, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Service added');
        resetServiceForm();
        fetchServices();
      }
    } catch (error) {
      toast.error('Failed to add service');
    }
  };

  const addWork = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      let payload = { ...workForm };
      if (workFile) {
        const uploadRes = await axios.post('/api/admin/work/upload', { fileBase64: workPreview, filename: workFile.name }, { headers: { 'Authorization': `Bearer ${token}` } });
        if (uploadRes.data?.success) {
          payload.image_url = uploadRes.data.relative || uploadRes.data.url;
        }
      }
      const response = await axios.post('/api/admin/work', payload, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.data.success) {
        toast.success('Work item added');
        resetWorkForm();
        fetchWork();
      }
    } catch (error) {
      toast.error('Failed to add work item');
    }
  };

  const startEditService = (service) => {
    setEditingServiceId(service.id);
    setServiceForm({
      id: service.id,
      name: service.name,
      description: service.description,
      duration_min: service.duration,
      price: service.price,
      category: service.category,
      active: service.active === 'true'
    });
  };

  const startEditWork = (item) => {
    setEditingWorkId(item.id);
    setWorkForm({ id: item.id, title: item.title, description: item.description, category: item.category, image_url: item.image_url, active: item.active === 'true', order: item.order || '' });
    setWorkFile(null);
    setWorkPreview('');
  };

  const updateService = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(`/api/admin/services/${editingServiceId}`, serviceForm, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Service updated');
        resetServiceForm();
        fetchServices();
      }
    } catch (error) {
      toast.error('Failed to update service');
    }
  };

  const updateWork = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      let payload = { ...workForm };
      if (workFile) {
        const uploadRes = await axios.post('/api/admin/work/upload', { fileBase64: workPreview, filename: workFile.name }, { headers: { 'Authorization': `Bearer ${token}` } });
        if (uploadRes.data?.success) {
          payload.image_url = uploadRes.data.relative || uploadRes.data.url;
        }
      }
      const response = await axios.put(`/api/admin/work/${editingWorkId}`, payload, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.data.success) {
        toast.success('Work item updated');
        resetWorkForm();
        fetchWork();
      }
    } catch (error) {
      toast.error('Failed to update work item');
    }
  };

  const deleteService = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(`/api/admin/services/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Service deleted');
        fetchServices();
      }
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  const deleteWork = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(`/api/admin/work/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.data.success) {
        toast.success('Work item deleted');
        fetchWork();
      }
    } catch (error) {
      toast.error('Failed to delete work item');
    }
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      if (!id) {
        toast.error('Cannot update appointment without ID');
        return;
      }
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(`/api/admin/appointments/${id}/status`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Appointment status updated!');
        fetchAppointments();
      }
    } catch (error) {
      toast.error('Failed to update appointment status');
    }
  };

  const deleteAppointment = async (id) => {
    try {
      if (!id) {
        toast.error('Cannot delete appointment without ID');
        return;
      }
      console.log(`Deleting appointment with ID: ${id}`);
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(`/api/admin/appointments/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Delete response:', response.data);
      
      if (response.data.success) {
        toast.success('Appointment deleted successfully');
        console.log('Fetching appointments after delete...');
        await fetchAppointments();
        console.log('Appointments fetched after delete');
      }
    } catch (error) {
      console.error('Delete appointment error:', error);
      toast.error('Failed to delete appointment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#27ae60';
      case 'pending': return '#f39c12';
      case 'cancelled': return '#e74c3c';
      case 'completed': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const getLocalTodayISO = () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  const toISODate = (value) => {
    if (!value) return '';
    const s = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const d = m[1].padStart(2, '0');
      const mo = m[2].padStart(2, '0');
      const y = m[3];
      return `${y}-${mo}-${d}`;
    }
    try {
      const dt = new Date(s);
      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  const formatDate = (dateString) => {
    const iso = toISODate(dateString);
    const d = iso ? new Date(iso) : new Date(dateString);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isAppointmentPast = (apt) => {
    const isoDate = toISODate(apt.date);
    if (!isoDate) return false;
    const time = (apt.time || '00:00').slice(0,5);
    const dt = new Date(`${isoDate}T${time}`);
    const now = new Date();
    return dt < now;
  };

  const autoCompletePastAppointments = async (list) => {
    const token = localStorage.getItem('adminToken');
    const pending = (list || []).filter(a => (a.status === 'pending' || a.status === 'confirmed') && isAppointmentPast(a));
    if (pending.length === 0) return;
    const updatedIds = new Set();
    for (const a of pending) {
      try {
        await axios.put(`/api/admin/appointments/${a.id}/status`, { status: 'completed' }, { headers: { 'Authorization': `Bearer ${token}` } });
        updatedIds.add(a.id);
        await sleep(200);
      } catch (e) {
        // ignore individual failures
      }
    }
    if (updatedIds.size > 0) {
      setAppointments(prev => prev.map(a => updatedIds.has(a.id) ? { ...a, status: 'completed' } : a));
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesFilter = filter === 'all' || appointment.status === filter;
    const matchesSearch = searchTerm === '' || 
      appointment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.phone.includes(searchTerm);
    
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.date) - new Date(b.date);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <div className="login-header">
            <h1>Admin Login</h1>
            <p>Enter your credentials to access the admin panel</p>
          </div>
          
          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter username"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
              />
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <button 
            onClick={() => navigate('/')}
            className="back-to-home"
          >
            ← Back to Website
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div className="container">
          <div className="header-content">
            <h1>Admin Dashboard</h1>
            <div className="header-actions">
              <button 
                onClick={() => {
                  fetchAppointments();
                  fetchMessages();
                  fetchServices();
                  toast.success('Data refreshed successfully!');
                }}
                className="btn btn-secondary"
              >
                🔄 Refresh
              </button>
              <button 
                onClick={handleLogout}
                className="btn btn-danger"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="container">
          {activeTab === 'appointments' && (
            <div className="toolbar" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="btn" onClick={async () => {
                try {
                  const token = localStorage.getItem('adminToken');
                  const res = await axios.post('/api/admin/appointments/migrate-ids', {}, { headers: { 'Authorization': `Bearer ${token}` } });
                  if (res.data.success) {
                    toast.success(`IDs updated: ${res.data.updated}`);
                    await fetchAppointments();
                  }
                } catch (e) {
                  toast.error('Failed to migrate appointment IDs');
                }
              }}>Fix missing IDs</button>
            </div>
          )}
          {confirmState.visible && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Confirm Delete</h3>
                <p>{confirmState.message}</p>
                <div className="modal-actions">
                  <button className="btn btn-danger" onClick={() => {
                    const { type, id } = confirmState;
                    setConfirmState({ visible: false, type: '', id: null, message: '' });
                    if (!id || !type) return;
                    if (type === 'appointment') { deleteAppointment(id); }
                    else if (type === 'service') { deleteService(id); }
                    else if (type === 'work') { deleteWork(id); }
                  }}>Delete</button>
                  <button className="btn btn-secondary" onClick={() => setConfirmState({ visible: false, type: '', id: null, message: '' })}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              📅 Appointments ({appointments.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              💬 Messages ({messages.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
              ✂️ Services ({services.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'work' ? 'active' : ''}`}
              onClick={() => setActiveTab('work')}
            >
              🖼️ Our Work ({workItems.length})
            </button>
          </div>

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Appointments</h3>
                  <p className="stat-number">{appointments.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Confirmed</h3>
                  <p className="stat-number confirmed">
                    {appointments.filter(a => a.status === 'confirmed').length}
                  </p>
                </div>
                <div className="stat-card">
                  <h3>Pending</h3>
                  <p className="stat-number pending">
                    {appointments.filter(a => a.status === 'pending').length}
                  </p>
                </div>
                <div className="stat-card">
                  <h3>Today's Appointments</h3>
                  <p className="stat-number today">
                    {appointments.filter(a => toISODate(a.date) === getLocalTodayISO()).length}
                  </p>
                </div>
              </div>

              <div className="filters-section">
                <div className="filters-row">
                  <div className="filter-group">
                    <label htmlFor="filter">Filter by status:</label>
                    <select 
                      id="filter" 
                      value={filter} 
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All Appointments</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label htmlFor="sort">Sort by:</label>
                    <select 
                      id="sort" 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="date">Date</option>
                      <option value="name">Name</option>
                      <option value="status">Status</option>
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label htmlFor="search">Search:</label>
                    <input
                      type="text"
                      id="search"
                      placeholder="Search by name, email, or phone"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="appointments-table">
                {filteredAppointments.length === 0 ? (
                  <div className="no-appointments">
                    <p>No appointments found</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Client</th>
                          <th>Contact</th>
                          <th>Service</th>
                          <th>Barber</th>
                          <th>Status</th>
                          <th>Notes</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.map((appointment) => (
                          <tr key={appointment.id}>
                            <td>
                              <div className="date-time">
                                <div className="date">{formatDate(appointment.date)}</div>
                                <div className="time">{formatTime(appointment.time)}</div>
                              </div>
                            </td>
                            <td>
                              <div className="client-name">{appointment.name}</div>
                            </td>
                            <td>
                              <div className="contact-info">
                                <div className="email">{appointment.email}</div>
                                <div className="phone">{appointment.phone}</div>
                              </div>
                            </td>
                            <td>{appointment.service}</td>
                            <td>{appointment.barber}</td>
                            <td>
                              <span 
                                className="status-badge"
                                style={{ backgroundColor: getStatusColor(appointment.status) }}
                              >
                                {appointment.status}
                              </span>
                            </td>
                            <td>
                              <div className="notes">
                                {appointment.notes || 'No notes'}
                              </div>
                            </td>
                            <td>
                              <div className="actions">
                                <select
                                  value={appointment.status}
                                  onChange={(e) => updateAppointmentStatus(appointment.id, e.target.value)}
                                  disabled={!appointment.id}
                                  className="status-select"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="cancelled">Cancelled</option>
                                  <option value="completed">Completed</option>
                                </select>
                                <button
                                  onClick={() => setConfirmState({ visible: true, type: 'appointment', id: appointment.id, message: 'Delete this appointment?' })}
                                  disabled={!appointment.id}
                                  className="btn-delete"
                                  title="Delete appointment"
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
              </div>
            </>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="messages-section">
              <h2>Contact Messages</h2>
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages found</p>
                </div>
              ) : (
                <div className="messages-list">
                  {messages.map((message) => (
                    <div key={message.id} className="message-card">
                      <div className="message-header">
                        <h3>{message.name}</h3>
                        <span className="message-date">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="message-contact">
                        <p><strong>Email:</strong> {message.email}</p>
                        {message.phone && <p><strong>Phone:</strong> {message.phone}</p>}
                      </div>
                      <div className="message-content">
                        <p>{message.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="services-section">
              <h2>Services</h2>
              <form className="service-form" onSubmit={editingServiceId ? updateService : addService}>
                <div className="form-row">
                  <input type="text" placeholder="Name" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} required />
                  <input type="text" placeholder="Category" value={serviceForm.category} onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })} />
                </div>
                <div className="form-row">
                  <input type="number" placeholder="Duration (min)" value={serviceForm.duration_min} onChange={(e) => setServiceForm({ ...serviceForm, duration_min: e.target.value })} />
                  <input type="number" placeholder="Price" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} />
                </div>
                <div className="form-row">
                  <input type="text" placeholder="Description" value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} />
                  <label className="checkbox">
                    <input type="checkbox" checked={serviceForm.active} onChange={(e) => setServiceForm({ ...serviceForm, active: e.target.checked })} /> Active
                  </label>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">{editingServiceId ? 'Update Service' : 'Add Service'}</button>
                  {editingServiceId && (
                    <button type="button" onClick={resetServiceForm} className="btn btn-secondary">Cancel</button>
                  )}
                </div>
              </form>
              {services.length === 0 ? (
                <div className="no-services">
                  <p>No services found</p>
                </div>
              ) : (
                <div className="services-grid">
                  {services.map((service) => (
                    <div key={service.id} className="service-card">
                      <h3>{service.name}</h3>
                      <p className="service-description">{service.description}</p>
                      <div className="service-details">
                        <p><strong>Duration:</strong> {service.duration} min</p>
                        <p><strong>Price:</strong> €{service.price}</p>
                        <p><strong>Category:</strong> {service.category}</p>
                      </div>
                      <span className={`service-status ${service.active === 'true' ? 'active' : 'inactive'}`}>
                        {service.active === 'true' ? 'Active' : 'Inactive'}
                      </span>
                      <div className="service-actions">
                        <button className="btn btn-secondary" onClick={() => startEditService(service)}>Edit</button>
                        <button className="btn btn-danger" onClick={() => setConfirmState({ visible: true, type: 'service', id: service.id, message: 'Delete this service?' })}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'work' && (
            <div className="work-section">
              <h2>Our Work</h2>
              <form className="work-form" onSubmit={editingWorkId ? updateWork : addWork}>
                <div className="form-row">
                  <input type="text" placeholder="Title" value={workForm.title} onChange={(e) => setWorkForm({ ...workForm, title: e.target.value })} required />
                  <input type="text" placeholder="Category" value={workForm.category} onChange={(e) => setWorkForm({ ...workForm, category: e.target.value })} />
                </div>
                <div className="form-row">
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) { setWorkFile(null); setWorkPreview(''); return; }
                    setWorkFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => { setWorkPreview(reader.result); };
                    reader.readAsDataURL(file);
                  }} />
                  <input type="number" placeholder="Order" value={workForm.order} onChange={(e) => setWorkForm({ ...workForm, order: e.target.value })} />
                </div>
                <div className="form-row">
                  <input type="text" placeholder="Description" value={workForm.description} onChange={(e) => setWorkForm({ ...workForm, description: e.target.value })} />
                  <label className="checkbox">
                    <input type="checkbox" checked={workForm.active} onChange={(e) => setWorkForm({ ...workForm, active: e.target.checked })} /> Active
                  </label>
                </div>
                {workPreview && (
                  <div className="image-preview">
                    <img src={workPreview} alt="Preview" className="work-photo" />
                  </div>
                )}
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">{editingWorkId ? 'Update Work' : 'Add Work'}</button>
                  {editingWorkId && (
                    <button type="button" onClick={resetWorkForm} className="btn btn-secondary">Cancel</button>
                  )}
                </div>
              </form>
              {workItems.length === 0 ? (
                <div className="no-data">
                  <p>No work items found</p>
                </div>
              ) : (
                <div className="work-grid">
                  {workItems.map((item) => {
                    const raw = item.image_url || '';
                    let imgSrc = '';
                    if (!raw) {
                      imgSrc = '';
                    } else if (raw.startsWith('http://localhost:5000')) {
                      imgSrc = raw.replace('http://localhost:5000', '');
                    } else if (raw.startsWith('https://localhost:5000')) {
                      imgSrc = raw.replace('https://localhost:5000', '');
                    } else if (raw.startsWith('/uploads')) {
                      imgSrc = raw;
                    } else if (raw.startsWith('uploads')) {
                      imgSrc = `/${raw}`;
                    } else {
                      imgSrc = raw;
                    }
                    return (
                    <div key={item.id} className={`work-card ${item.active === 'true' ? 'active' : 'inactive'}`}>
                      <div className="work-image">
                        {imgSrc ? (
                          <img src={imgSrc} alt={item.title} className="work-photo" />
                        ) : (
                          <div className="work-placeholder">🖼️</div>
                        )}
                      </div>
                      <h3>{item.title}</h3>
                      <p className="work-description">{item.description}</p>
                      <div className="work-meta">
                        <span className="work-category">{item.category}</span>
                        <span className={`work-status ${item.active === 'true' ? 'active' : 'inactive'}`}>{item.active === 'true' ? 'Active' : 'Inactive'}</span>
                      </div>
                      <div className="work-actions">
                        <button className="btn btn-secondary" onClick={() => startEditWork(item)}>Edit</button>
                        <button className="btn btn-danger" onClick={() => setConfirmState({ visible: true, type: 'work', id: item.id, message: 'Delete this work item?' })}>Delete</button>
                      </div>
                    </div>
                  );})}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;