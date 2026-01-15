
import React, { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus } from '../services/db';
import { fetchOrders, updateOrderStatus as updateOrderStatusAPI } from '../services/api';

function OrdersScreen({ onUpdate }) {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from server first
      const serverOrders = await fetchOrders();
      
      if (serverOrders && serverOrders.length > 0) {
        // Use server orders
        setOrders(serverOrders);
        console.log('✅ Loaded from server:', serverOrders.length, 'orders');
      } else {
        // Fallback to local orders
        const localOrders = await getAllOrders();
        setOrders(localOrders);
        console.log('📱 Loaded from local:', localOrders.length, 'orders');
      }
    } catch (error) {
      console.error('Load orders error:', error);
      // Always fallback to local
      const localOrders = await getAllOrders();
      setOrders(localOrders);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setIsSyncing(true);
      
      // Update local database first
      await updateOrderStatus(orderId, newStatus);
      console.log('✅ Local status updated');
      
      // Try to update on server
      if (navigator.onLine) {
        const synced = await updateOrderStatusAPI(orderId, newStatus);
        
        if (synced) {
          console.log('✅ Server status updated');
        } else {
          console.log('⚠️ Server update failed, will sync later');
        }
      } else {
        console.log('📵 Offline - Status updated locally only');
      }
      
      // Reload orders
      await loadOrders();
      if (onUpdate) onUpdate();
      
    } catch (error) {
      console.error('Failed:', error);
      alert('❌ Update failed: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefresh = async () => {
    await loadOrders();
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Pending', color: 'warning' },
      preparing: { label: 'Preparing', color: 'info' },
      ready: { label: 'Ready', color: 'success' },
      completed: { label: 'Completed', color: 'success' },
      cancelled: { label: 'Cancelled', color: 'danger' }
    };
    
    const badge = badges[status] || badges.pending;
    return <span className={`status-badge ${badge.color}`}>{badge.label}</span>;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-PK', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalSales: orders.reduce((sum, order) => sum + (order.total || 0), 0)
  };

  return (
    <div className="orders-screen">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👨‍🍳</div>
          <div className="stat-info">
            <h3>{stats.preparing}</h3>
            <p>Preparing</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>

        <div className="stat-card highlight">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Rs. {stats.totalSales.toLocaleString()}</h3>
            <p>Total Sales</p>
          </div>
        </div>
      </div>

      {/* Header with Refresh */}
      <div className="orders-header">
        <h2>Orders Management</h2>
        <button 
          className="refresh-btn" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="orders-filters">
        <button
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All ({stats.total})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('pending')}
        >
          Pending ({stats.pending})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'preparing' ? 'active' : ''}`}
          onClick={() => setFilterStatus('preparing')}
        >
          Preparing ({stats.preparing})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'ready' ? 'active' : ''}`}
          onClick={() => setFilterStatus('ready')}
        >
          Ready
        </button>
        <button
          className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
          onClick={() => setFilterStatus('completed')}
        >
          Completed ({stats.completed})
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      )}

      {/* Orders List */}
      {!isLoading && (
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No orders found</h3>
              <p>
                {filterStatus === 'all' 
                  ? 'Start taking orders from POS screen' 
                  : `No ${filterStatus} orders at the moment`}
              </p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id || order._id} className="order-card">
                <div 
                  className="order-header" 
                  onClick={() => setExpandedOrder(
                    expandedOrder === (order.id || order._id) ? null : (order.id || order._id)
                  )}
                >
                  <div className="order-info">
                    <h3>Order #{order.id || order._id}</h3>
                    <p>👤 {order.customerName}</p>
                    <p>🕒 {formatDate(order.timestamp || order.createdAt)}</p>
                    {!navigator.onLine && (
                      <span className="offline-badge">📵 Offline</span>
                    )}
                  </div>

                  <div className="order-summary">
                    {getStatusBadge(order.status)}
                    <p className="order-total">Rs. {order.total}</p>
                  </div>
                </div>

                {expandedOrder === (order.id || order._id) && (
                  <div className="order-details">
                    <div className="order-items">
                      <h4>Items:</h4>
                      {order.items.map((item, index) => (
                        <div key={index} className="order-item">
                          <span>{item.image}</span>
                          <span>{item.name}</span>
                          <span>x{item.quantity}</span>
                          <span>Rs. {item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="order-actions">
                      {order.status === 'pending' && (
                        <button
                          className="action-btn preparing"
                          onClick={() => handleStatusUpdate(order.id || order._id, 'preparing')}
                          disabled={isSyncing}
                        >
                          {isSyncing ? '⏳ Updating...' : '👨‍🍳 Start Preparing'}
                        </button>
                      )}

                      {order.status === 'preparing' && (
                        <button
                          className="action-btn ready"
                          onClick={() => handleStatusUpdate(order.id || order._id, 'ready')}
                          disabled={isSyncing}
                        >
                          {isSyncing ? '⏳ Updating...' : '✅ Mark Ready'}
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <button
                          className="action-btn completed"
                          onClick={() => handleStatusUpdate(order.id || order._id, 'completed')}
                          disabled={isSyncing}
                        >
                          {isSyncing ? '⏳ Updating...' : '🎉 Complete'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default OrdersScreen;