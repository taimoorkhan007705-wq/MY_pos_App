import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllProducts,
  getCurrentOrder,
  addItemToOrder,
  updateItemQuantity,
  saveOrder,
  clearCurrentOrder
} from '../../services/db';
import { createOrder as apiCreateOrder } from '../../services/api';
import { categories } from '../../data/products';
import { useNetwork } from '../../context/NetworkContext';
import { enqueueOrder, syncQueuedOrders } from '../../services/offlineQueue';
import { exponentialBackoff } from '../../services/retry';
import { 
  MdShoppingCart, 
  MdAdd, 
  MdRemove, 
  MdPerson,
  MdAdminPanelSettings
} from 'react-icons/md';

function UserPOS() {
  const [products, setProducts] = useState([]);
  const [currentOrder, setCurrentOrder] = useState({ items: [], total: 0 });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const navigate = useNavigate();
  const network = useNetwork();

  useEffect(() => {
    loadData();
  }, []);





  const loadData = async () => {
    const allProducts = await getAllProducts();
    setProducts(allProducts);
    
    const order = await getCurrentOrder();
    setCurrentOrder(order);
  };

  const handleAddProduct = async (product) => {
    try {
      const updatedOrder = await addItemToOrder(product, 1);
      setCurrentOrder(updatedOrder);

      const btn = document.querySelector(`[data-product-id="${product.id}"]`);
      if (btn) {
        btn.classList.add('added');
        setTimeout(() => btn.classList.remove('added'), 300);
      }
    } catch (error) {
      console.error('Failed to add:', error);
    }
  };

  const handleUpdateQuantity = async (productId, quantity) => {
    try {
      const updatedOrder = await updateItemQuantity(productId, quantity);
      setCurrentOrder(updatedOrder);
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (currentOrder.items.length === 0) {
      alert('❌ Cart is empty!');
      return;
    }

    if (!customerName.trim()) {
      alert('❌ Please enter customer name');
      return;
    }

    try {
      setLoading(true);
      
      // Save locally with 4-digit ID
      const localOrder = await saveOrder({ 
        customerName: customerName.trim() 
      });
      
      const orderData = {
        orderId: localOrder.orderId,
        customerName: customerName.trim(),
        items: currentOrder.items,
        total: currentOrder.total
      };

      // If online, try to sync immediately
      if (network.isOnline) {
        try {
          console.log(`📤 Syncing order ${localOrder.orderId} to ${network.serverUrl}`);
          
          await exponentialBackoff(
            async () => {
              // Try /api/sync/batch first, fallback to /sync/batch
              let response;
              try {
                response = await fetch(`${network.serverUrl}/api/sync/batch`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify([orderData])
                });
              } catch (err) {
                // Fallback to /sync/batch if /api/sync/batch doesn't exist
                response = await fetch(`${network.serverUrl}/sync/batch`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify([orderData])
                });
              }
              
              if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
              }
              
              return response.json();
            },
            { maxAttempts: 3, baseDelay: 1000 }
          );
          
          console.log(`✅ Order ${localOrder.orderId} synced to server`);
        } catch (error) {
          console.warn(`⚠️ Sync failed: ${error.message}. Queuing for later sync.`);
          // Queue for later sync
          await enqueueOrder(orderData);
        }
      } else {
        // Offline: queue the order
        console.log(`📭 Offline - queuing order ${localOrder.orderId}`);
        await enqueueOrder(orderData);
      }
      
      // Show success with order ID
      setOrderSuccess({
        orderId: localOrder.orderId,
        total: currentOrder.total
      });
      
      setCustomerName('');
      const order = await getCurrentOrder();
      setCurrentOrder(order);
      
    } catch (error) {
      alert('❌ Failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearOrder = async () => {
    if (!window.confirm('Clear cart?')) return;
    
    try {
      await clearCurrentOrder();
      const order = await getCurrentOrder();
      setCurrentOrder(order);
    } catch (error) {
      console.error('Failed to clear:', error);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesCategory && p.available;
  });

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="logo">
          <div style={{ fontSize: '2rem' }}>🏪</div>
          <div className="logo-text">
            <h1>POS System</h1>
            <p className="tagline">Place Your Order</p>
          </div>
        </div>

        <div className="header-actions">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'var(--bg)',
            borderRadius: '20px',
            fontWeight: 600
          }}>
            <MdShoppingCart size={20} />
            <span>{currentOrder.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <div className="pos-screen">
          {/* Products */}
          <div className="products-section">
            <div className="section-header">
              <h2>Menu</h2>
            </div>

            {/* Categories */}
            <div className="categories-tabs">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span style={{ fontSize: '1.25rem' }}>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="products-grid">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  className="product-card"
                  onClick={() => handleAddProduct(product)}
                  data-product-id={product.id}
                >
                  <div className="product-icon">{product.image}</div>
                  <div className="product-name">{product.name}</div>
                  <div className="product-price">Rs. {product.price}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="cart-section">
            <div className="section-header">
              <h2>Cart</h2>
              {currentOrder.items.length > 0 && (
                <button 
                  onClick={handleClearOrder}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--danger)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Customer Name */}
            <div className="customer-input">
              <div style={{ position: 'relative' }}>
                <MdPerson 
                  size={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '0.75rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: 'var(--text-light)'
                  }} 
                />
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Cart Items */}
            <div className="cart-items">
              {currentOrder.items.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--text-light)',
                  padding: '2rem'
                }}>
                  <MdShoppingCart size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p>Cart is empty</p>
                  <p style={{ fontSize: '0.875rem' }}>Add items to get started</p>
                </div>
              ) : (
                currentOrder.items.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-icon">{item.image}</div>
                    <div className="item-details">
                      <div className="item-name">{item.name}</div>
                      <div className="item-price">Rs. {item.price}</div>
                    </div>

                    <div className="item-controls">
                      <button
                        className="qty-btn"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <MdRemove />
                      </button>
                      <span style={{ fontWeight: 700, minWidth: '30px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        className="qty-btn"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <MdAdd />
                      </button>
                    </div>

                    <div className="item-total">
                      Rs. {item.price * item.quantity}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary */}
            {currentOrder.items.length > 0 && (
              <>
                <div className="cart-summary">
                  <div className="summary-row total">
                    <span>Total:</span>
                    <span>Rs. {currentOrder.total}</span>
                  </div>
                </div>

                <button
                  className="place-order-btn"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : '✓ Place Order'}
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {orderSuccess && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setOrderSuccess(null)}
        >
          <div 
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              maxWidth: '400px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ marginBottom: '1rem' }}>Order Placed!</h2>
            <div style={{
              padding: '1rem',
              background: 'var(--bg)',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                Order ID
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                #{orderSuccess.orderId}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '0.5rem' }}>
                Total: Rs. {orderSuccess.total}
              </div>
            </div>
            <button
              onClick={() => setOrderSuccess(null)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserPOS;