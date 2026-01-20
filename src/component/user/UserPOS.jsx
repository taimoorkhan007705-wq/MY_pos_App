import React, { useState, useEffect } from 'react';
import { products as localData } from '../../data/products';
import { 
  getAllProducts, addItemToOrder, getCurrentOrder, 
  updateItemQuantity, saveOrder, saveProducts 
} from '../../services/db';
import { createOrder as apiCreateOrder, fetchProducts } from '../../services/api';
import WiFiQRModal from '../shared/WiFiQRModal';

const UserPOS = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [customerName, setCustomerName] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [showCart, setShowCart] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Get current network IP for WiFi QR code
  const getNetworkUrl = () => {
    // Try to get the hotspot IP from window location
    const currentUrl = window.location.origin;
    // Default to the hotspot IP: 192.168.137.1 on port 3002
    return currentUrl.includes('localhost') ? 'http://192.168.137.1:3002' : currentUrl;
  };

  useEffect(() => {
    const init = async () => {
      try {
        // Try to fetch products from backend
        console.log('📦 Fetching products from backend...');
        const backendProducts = await fetchProducts();
        
        if (backendProducts && backendProducts.length > 0) {
          // Save fetched products to local DB
          await saveProducts(backendProducts);
          setProducts(backendProducts);
          console.log('✅ Loaded', backendProducts.length, 'products from backend');
        } else {
          // Fallback to local data if backend returns empty
          await saveProducts(localData);
          const data = await getAllProducts();
          setProducts(data);
          console.log('ℹ️ Using local products data');
        }
      } catch (error) {
        // Fallback to local data if backend is unavailable
        console.warn('⚠️ Backend unavailable, using local products:', error.message);
        await saveProducts(localData);
        const data = await getAllProducts();
        setProducts(data);
      }
      
      setCart(await getCurrentOrder());
    };
    init();
  }, []);

  const handleAdd = async (p) => {
    setCart(await addItemToOrder(p));
    setShowCart(true);
  };

  const handleQty = async (id, q) => setCart(await updateItemQuantity(id, q));

  const handleConfirm = async () => {
    if (cart.items.length === 0) {
      alert('Cart is empty');
      return;
    }

    if (!customerName.trim()) {
      alert('Please enter a Customer Name');
      return;
    }

    try {
      // Save locally (IndexedDB) and get generated orderId
      const localOrder = await saveOrder({ customerName: customerName.trim() });

      // Try to sync to backend API (laptop)
      try {
        await apiCreateOrder({
          orderId: localOrder.orderId,
          customerName: localOrder.customerName || customerName.trim(),
          items: localOrder.items,
          total: localOrder.total
        });
        console.log('✅ Order synced to server');
      } catch (err) {
        console.error('⚠️ Order saved locally only, server error:', err);
        // We keep local data; syncWithServer can push later when online
      }

      setCart({ items: [], total: 0 });
      setCustomerName('');
      setShowCart(false);
      alert(`Order Confirmed Successfully!\nOrder ID: ${localOrder.orderId}`);
    } catch (err) {
      alert('❌ Failed to place order: ' + err.message);
    }
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];

  return (
    <div className={`pos-container ${showCart ? 'cart-open' : ''}`}>
      {!showCart && (
        <button className="white-cart-fab" onClick={() => setShowCart(true)}>
          <span className="fab-icon">🛒</span>
          {cart.items.length > 0 && <span className="fab-badge">{cart.items.length}</span>}
        </button>
      )}

      <main className="menu-side">
        <header className="menu-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <h1>VIBE<span>POS</span></h1>
            <button 
              onClick={() => setShowQRModal(true)}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>📱</span>
              WiFi QR
            </button>
          </div>
          <div className="tabs">
            {categories.map(c => (
              <button 
                key={c} 
                className={`${activeTab === c ? 'active' : ''} cat-btn-${c.toLowerCase()}`} 
                onClick={() => setActiveTab(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </header>

        <div className="product-grid">
          {products.filter(p => activeTab === 'All' || p.category === activeTab).map(p => (
            <div key={p.id} className="product-card">
              <div className="img-container">
                <img src={p.image} alt={p.name} loading="lazy" />
                <button className="quick-add" onClick={() => handleAdd(p)}>+</button>
              </div>
              <div className="product-details">
                <h4 className="professional-title">{p.name}</h4>
                <p className="professional-price">Rs {p.price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showCart && <div className="overlay" onClick={() => setShowCart(false)} />}

      <aside className="cart-sidebar">
        <div className="cart-header">
          <h3>Order Review</h3>
          <button className="close-btn" onClick={() => setShowCart(false)}>✕</button>
        </div>
        
        <div className="customer-section">
          <label>Customer Name</label>
          <input 
            className="name-input" 
            placeholder="Type name here..." 
            value={customerName} 
            onChange={e => setCustomerName(e.target.value)} 
          />
        </div>

        <div className="cart-items">
          {cart.items.length === 0 ? <p className="empty-msg">Empty Cart</p> : 
            cart.items.map(item => (
              <div key={item.id} className="cart-row">
                <div className="row-info"><p>{item.name}</p><small>Rs {item.price}</small></div>
                <div className="row-qty">
                  <button onClick={() => handleQty(item.id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleQty(item.id, item.quantity + 1)}>+</button>
                </div>
              </div>
            ))
          }
        </div>
        <div className="cart-footer">
          <div className="total-box"><span>Grand Total</span><b>Rs {cart.total.toLocaleString()}</b></div>
          <button className="confirm-btn" onClick={handleConfirm} disabled={cart.items.length === 0}>
            FINALIZE ORDER
          </button>
        </div>
      </aside>

      {/* WiFi QR Code Modal */}
      <WiFiQRModal 
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        wifiSSID="Connectify-Hotspot"
        wifiPassword="12345678"
        userPanelUrl={getNetworkUrl()}
      />
    </div>
  );
};

export default UserPOS;
