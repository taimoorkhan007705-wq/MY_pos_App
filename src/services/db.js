import { openDB } from 'idb';
import { 
  fetchProducts as apiFetchProducts,
  syncProducts as apiSyncProducts,
  fetchOrders as apiFetchOrders,
  createOrder as apiCreateOrder
} from './api';

const DB_NAME = 'pos-system-db';
const DB_VERSION = 1;

// ==================== DATABASE INITIALIZATION ====================

export const initDB = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Products store
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id' });
        productStore.createIndex('category', 'category', { unique: false });
      }

      // Orders store
      if (!db.objectStoreNames.contains('orders')) {
        const orderStore = db.createObjectStore('orders', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        orderStore.createIndex('orderId', 'orderId', { unique: true });
        orderStore.createIndex('status', 'status', { unique: false });
        orderStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Current order store
      if (!db.objectStoreNames.contains('currentOrder')) {
        db.createObjectStore('currentOrder', { keyPath: 'id' });
      }
    }
  });

  return db;
};

// ==================== PRODUCTS ====================

export const saveProducts = async (products) => {
  const db = await initDB();
  const tx = db.transaction('products', 'readwrite');
  
  for (const product of products) {
    await tx.store.put(product);
  }
  
  await tx.done;
  return products;
};

export const getAllProducts = async () => {
  const db = await initDB();
  return await db.getAll('products');
};

// ==================== ORDER ID GENERATION ====================

const generateOrderId = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const orderIdExists = async (orderId) => {
  const db = await initDB();
  const tx = db.transaction('orders', 'readonly');
  const index = tx.store.index('orderId');
  const existing = await index.get(orderId);
  return !!existing;
};

export const generateUniqueOrderId = async () => {
  let orderId;
  let exists = true;
  
  while (exists) {
    orderId = generateOrderId();
    exists = await orderIdExists(orderId);
  }
  
  return orderId;
};

// ==================== CURRENT ORDER (CART) ====================

export const getCurrentOrder = async () => {
  const db = await initDB();
  const order = await db.get('currentOrder', 'active');
  
  return order || { 
    id: 'active',
    items: [], 
    total: 0 
  };
};

export const addItemToOrder = async (product, quantity = 1) => {
  const currentOrder = await getCurrentOrder();
  
  const existingItem = currentOrder.items.find(item => item.id === product.id);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    currentOrder.items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image: product.image
    });
  }
  
  currentOrder.total = currentOrder.items.reduce(
    (sum, item) => sum + (item.price * item.quantity), 
    0
  );
  
  const db = await initDB();
  await db.put('currentOrder', currentOrder);
  
  return currentOrder;
};

export const updateItemQuantity = async (productId, quantity) => {
  const currentOrder = await getCurrentOrder();
  
  if (quantity <= 0) {
    currentOrder.items = currentOrder.items.filter(item => item.id !== productId);
  } else {
    const item = currentOrder.items.find(item => item.id === productId);
    if (item) {
      item.quantity = quantity;
    }
  }
  
  currentOrder.total = currentOrder.items.reduce(
    (sum, item) => sum + (item.price * item.quantity), 
    0
  );
  
  const db = await initDB();
  await db.put('currentOrder', currentOrder);
  
  return currentOrder;
};

export const clearCurrentOrder = async () => {
  const db = await initDB();
  await db.put('currentOrder', { 
    id: 'active', 
    items: [], 
    total: 0 
  });
};

// ==================== ORDERS ====================

export const saveOrder = async (orderData) => {
  const currentOrder = await getCurrentOrder();
  
  if (currentOrder.items.length === 0) {
    throw new Error('Cart is empty');
  }
  
  const orderId = await generateUniqueOrderId();
  
  const order = {
    orderId,
    items: currentOrder.items,
    total: currentOrder.total,
    ...orderData,
    status: 'pending',
    synced: false,
    timestamp: Date.now(),
    createdAt: new Date().toISOString()
  };
  
  const db = await initDB();
  const id = await db.add('orders', order);
  
  await clearCurrentOrder();
  
  console.log('✅ Order saved:', orderId);
  return { ...order, id };
};

export const getAllOrders = async () => {
  const db = await initDB();
  const orders = await db.getAll('orders');
  return orders.sort((a, b) => b.timestamp - a.timestamp);
};

export const getOrderById = async (id) => {
  const db = await initDB();
  return await db.get('orders', id);
};

export const updateOrderStatus = async (orderId, status) => {
  const db = await initDB();
  const order = await db.get('orders', orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  order.status = status;
  await db.put('orders', order);
  
  console.log('✅ Order status updated:', order.orderId, '→', status);
  return order;
};

export const deleteOrder = async (orderId) => {
  const db = await initDB();
  await db.delete('orders', orderId);
  console.log('✅ Order deleted:', orderId);
};

export const getUnsyncedOrders = async () => {
  const db = await initDB();
  const allOrders = await db.getAll('orders');
  return allOrders.filter(order => !order.synced);
};

export const markOrderAsSynced = async (orderId) => {
  const db = await initDB();
  const order = await db.get('orders', orderId);
  
  if (order) {
    order.synced = true;
    await db.put('orders', order);
  }
};

// ==================== SYNC FUNCTIONS ====================

export const syncWithServer = async () => {
  if (!navigator.onLine) {
    console.log('📵 Offline - sync skipped');
    return { success: false, message: 'Offline' };
  }

  try {
    console.log('🔄 Syncing with server...');
    
    // Sync products
    const localProducts = await getAllProducts();
    if (localProducts.length > 0) {
      await apiSyncProducts(localProducts);
      console.log('✅ Products synced');
    }
    
    // Sync unsynced orders
    const unsyncedOrders = await getUnsyncedOrders();
    
    for (const order of unsyncedOrders) {
      try {
        await apiCreateOrder(order);
        await markOrderAsSynced(order.id);
        console.log('✅ Order synced:', order.orderId);
      } catch (error) {
        console.error('❌ Failed to sync order:', order.orderId);
      }
    }
    
    console.log('✅ Sync completed');
    return { success: true, synced: unsyncedOrders.length };
    
  } catch (error) {
    console.error('❌ Sync error:', error);
    return { success: false, error: error.message };
  }
};

export const syncOrderToServer = async (order) => {
  if (!navigator.onLine) {
    return false;
  }

  try {
    await apiCreateOrder(order);
    await markOrderAsSynced(order.id);
    return true;
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return false;
  }
};

export const loadProductsFromServer = async () => {
  try {
    const products = await apiFetchProducts();
    await saveProducts(products);
    console.log('✅ Products loaded from server');
    return products;
  } catch (error) {
    console.error('❌ Load products error:', error);
    return [];
  }
};

export const loadOrdersFromServer = async () => {
  try {
    const orders = await apiFetchOrders();
    console.log('✅ Orders loaded from server');
    return orders;
  } catch (error) {
    console.error('❌ Load orders error:', error);
    return [];
  }
};

// ==================== IMPORT/EXPORT ====================

export const exportAllData = async () => {
  const db = await initDB();
  
  const products = await db.getAll('products');
  const orders = await db.getAll('orders');
  const currentOrder = await db.get('currentOrder', 'active');
  
  return {
    products,
    orders,
    currentOrder,
    exportedAt: Date.now()
  };
};

export const importAllData = async (data) => {
  const db = await initDB();
  
  // Import products
  if (data.products && data.products.length > 0) {
    const tx = db.transaction('products', 'readwrite');
    for (const product of data.products) {
      await tx.store.put(product);
    }
    await tx.done;
    console.log('✅ Products imported');
  }
  
  // Import orders
  if (data.orders && data.orders.length > 0) {
    const tx = db.transaction('orders', 'readwrite');
    for (const order of data.orders) {
      await tx.store.put(order);
    }
    await tx.done;
    console.log('✅ Orders imported');
  }
  
  // Import current order
  if (data.currentOrder) {
    await db.put('currentOrder', data.currentOrder);
    console.log('✅ Current order imported');
  }
  
  return true;
};

// ==================== DEFAULT EXPORT ====================

export default {
  initDB,
  saveProducts,
  getAllProducts,
  getCurrentOrder,
  addItemToOrder,
  updateItemQuantity,
  clearCurrentOrder,
  saveOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getUnsyncedOrders,
  markOrderAsSynced,
  syncWithServer,
  syncOrderToServer,
  loadProductsFromServer,
  loadOrdersFromServer,
  exportAllData,
  importAllData,
  generateUniqueOrderId
};