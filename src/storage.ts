import { UserProfile, Product, Order, CartItem, Category, UserRole } from './types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from './mockData';
import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

// Storage keys
const KEYS = {
  CURRENT_USER: 'pb_current_user',
  USERS: 'pb_users_db',
  PRODUCTS: 'pb_products_db',
  ORDERS: 'pb_orders_db',
  CATEGORIES: 'pb_categories_db',
  CARTS: 'pb_carts_db', // keyed by userId
};

// Error handling types and enumerations as requested by the Firebase Skill constraints
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error event captured: ', JSON.stringify(errInfo));
  // Non-blocking warning so the app continues working perfectly offline-first
}

// Help initialize data if it does not exist in local cache
export function initLocalStorageDB() {
  if (!localStorage.getItem(KEYS.PRODUCTS)) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem(KEYS.CATEGORIES)) {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  }
  if (!localStorage.getItem(KEYS.ORDERS)) {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify([]));
  }
  // Initialize default users database with only the default administrator
  if (!localStorage.getItem(KEYS.USERS)) {
    const defaultUsersList: UserProfile[] = [
      {
        id: 'user_admin',
        firstName: 'Playbook',
        lastName: 'Admin',
        email: 'playbookstudio79@gmail.com',
        phone: '+1 (800) 555-0199',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(KEYS.USERS, JSON.stringify(defaultUsersList));
  }
}

// Ensure database is initialized
initLocalStorageDB();

// REAL-TIME FIRESTORE DATA SYNCHRONIZATION BACKEND
export function startFirebaseSync(onUpdate: () => void) {
  try {
    // 1. Sync Products
    onSnapshot(collection(db, 'products'), (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      if (items.length > 0) {
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(items));
        onUpdate();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    // 2. Sync Categories
    onSnapshot(collection(db, 'categories'), (snapshot) => {
      const items: Category[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Category);
      });
      if (items.length > 0) {
        localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(items));
        onUpdate();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });

    // 3. Sync Orders
    onSnapshot(collection(db, 'orders'), (snapshot) => {
      const items: Order[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      if (snapshot.size > 0 || items.length > 0) {
        localStorage.setItem(KEYS.ORDERS, JSON.stringify(items));
        onUpdate();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });

    // 4. Sync Users
    onSnapshot(collection(db, 'users'), (snapshot) => {
      const items: UserProfile[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      });
      if (items.length > 0) {
        localStorage.setItem(KEYS.USERS, JSON.stringify(items));
        onUpdate();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
  } catch (err) {
    console.warn('Real-time sync subscription not authorized or loaded offline:', err);
  }
}

// ---------------- AUTH SERVICES ----------------

export function getCurrentUser(): UserProfile | null {
  const user = localStorage.getItem(KEYS.CURRENT_USER);
  return user ? JSON.parse(user) : null;
}

export function saveCurrentUserSnapshot(user: UserProfile) {
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  
  // also persist in the general users list DB
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index !== -1) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));

  // Sync with Firestore
  setDoc(doc(db, 'users', user.id), user).catch(err => {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
  });
}

export function signupUser(firstName: string, lastName: string, email: string, phone: string, passwordSecret: string): { success: boolean; user?: UserProfile; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  
  if (!cleanEmail || !passwordSecret) {
    return { success: false, error: 'Email and password are required.' };
  }

  const users = getAllUsers();
  if (users.find(u => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const role: UserRole = cleanEmail === 'playbookstudio79@gmail.com' ? 'admin' : 'customer';
  
  const newUser: UserProfile = {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    firstName,
    lastName,
    email: cleanEmail,
    phone,
    role,
    createdAt: new Date().toISOString(),
    addresses: []
  };

  users.push(newUser);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(newUser));

  // Sync to Firestore
  setDoc(doc(db, 'users', newUser.id), newUser).catch(err => {
    handleFirestoreError(err, OperationType.WRITE, `users/${newUser.id}`);
  });

  return { success: true, user: newUser };
}

export function loginUser(email: string, passwordSecret: string): { success: boolean; user?: UserProfile; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  
  if (!cleanEmail || !passwordSecret) {
    return { success: false, error: 'Email and password are required.' };
  }

  const users = getAllUsers();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    // If logging email is the special admin, auto-create it if somehow missing from DB
    if (cleanEmail === 'playbookstudio79@gmail.com') {
      const newAdmin: UserProfile = {
        id: 'user_admin',
        firstName: 'Playbook',
        lastName: 'Admin',
        email: 'playbookstudio79@gmail.com',
        phone: '+1 (555) 7979',
        role: 'admin',
        createdAt: new Date().toISOString(),
        addresses: []
      };
      users.push(newAdmin);
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(newAdmin));

      // Push to Firestore as well
      setDoc(doc(db, 'users', 'user_admin'), newAdmin).catch((e) => {
        handleFirestoreError(e, OperationType.WRITE, 'users/user_admin');
      });

      return { success: true, user: newAdmin };
    }
    return { success: false, error: 'Invalid email or password.' };
  }

  // Session persistence
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  return { success: true, user };
}

export function logoutUser() {
  localStorage.removeItem(KEYS.CURRENT_USER);
}

export function getAllUsers(): UserProfile[] {
  const list = localStorage.getItem(KEYS.USERS);
  return list ? JSON.parse(list) : [];
}


// ---------------- PRODUCTS SERVICES ----------------

export function getAllProducts(): Product[] {
  const list = localStorage.getItem(KEYS.PRODUCTS);
  return list ? JSON.parse(list) : [];
}

export function getProductById(id: string): Product | null {
  const products = getAllProducts();
  return products.find(p => p.id === id) || null;
}

export function addProduct(productData: Omit<Product, 'id' | 'createdAt'>): Product {
  const products = getAllProducts();
  const newProduct: Product = {
    ...productData,
    id: 'pb-' + Math.floor(100 + Math.random() * 900),
    createdAt: new Date().toISOString()
  };
  products.unshift(newProduct);
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));

  // Sync to Firestore
  setDoc(doc(db, 'products', newProduct.id), newProduct).catch(err => {
    handleFirestoreError(err, OperationType.WRITE, `products/${newProduct.id}`);
  });

  return newProduct;
}

export function updateProduct(id: string, updatedData: Partial<Product>): boolean {
  const products = getAllProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return false;

  const updatedNode = { ...products[idx], ...updatedData };
  products[idx] = updatedNode;
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));

  // Sync to Firestore
  setDoc(doc(db, 'products', id), updatedNode).catch(err => {
    handleFirestoreError(err, OperationType.WRITE, `products/${id}`);
  });

  return true;
}

export function deleteProduct(id: string): boolean {
  const products = getAllProducts();
  const filtered = products.filter(p => p.id !== id);
  if (products.length === filtered.length) return false;

  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(filtered));

  // Sync delete to Firestore
  deleteDoc(doc(db, 'products', id)).catch(err => {
    handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
  });

  return true;
}


// ---------------- CATEGORY SERVICES ----------------

export function getAllCategories(): Category[] {
  const list = localStorage.getItem(KEYS.CATEGORIES);
  return list ? JSON.parse(list) : [];
}

export function addCategory(name: string): Category {
  const cats = getAllCategories();
  const newCat: Category = {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    createdAt: new Date().toISOString()
  };
  cats.push(newCat);
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(cats));

  // Sync to Firestore
  setDoc(doc(db, 'categories', newCat.id), newCat).catch(err => {
    handleFirestoreError(err, OperationType.WRITE, `categories/${newCat.id}`);
  });

  return newCat;
}


// ---------------- CART SERVICES ----------------

export function getCartForUser(userId: string): CartItem[] {
  const allCartsStr = localStorage.getItem(KEYS.CARTS);
  if (!allCartsStr) return [];
  const allCarts = JSON.parse(allCartsStr);
  return allCarts[userId] || [];
}

export function saveCartForUser(userId: string, items: CartItem[]) {
  const allCartsStr = localStorage.getItem(KEYS.CARTS) || '{}';
  const allCarts = JSON.parse(allCartsStr);
  allCarts[userId] = items;
  localStorage.setItem(KEYS.CARTS, JSON.stringify(allCarts));
}


// ---------------- ORDERS SERVICES ----------------

export function getAllOrders(): Order[] {
  const list = localStorage.getItem(KEYS.ORDERS);
  return list ? JSON.parse(list) : [];
}

export function getOrdersForUser(userId: string): Order[] {
  const orders = getAllOrders();
  return orders
    .filter(o => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createOrder(
  userId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  customerAddress: string,
  items: CartItem[],
  subtotal: number,
  shipping: number,
  total: number
): Order {
  const orders = getAllOrders();
  
  // Generate high-end unique order number
  const uniqueNumCode = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `PB-${uniqueNumCode}`;
  
  const newOrder: Order = {
    id: 'ord_' + Math.random().toString(36).substr(2, 9),
    orderNumber,
    userId,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    items,
    subtotal,
    shipping,
    total,
    status: 'Pending Payment',
    createdAt: new Date().toISOString()
  };

  orders.unshift(newOrder);
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));

  // Deduct Inventory values accordingly
  const products = getAllProducts();
  items.forEach(item => {
    const parentProd = products.find(p => p.id === item.productId);
    if (parentProd) {
      parentProd.stock = Math.max(0, parentProd.stock - item.quantity);
      
      // Update inventory on Firestore too
      setDoc(doc(db, 'products', parentProd.id), parentProd).catch(e => {
        handleFirestoreError(e, OperationType.WRITE, `products/${parentProd.id}`);
      });
    }
  });
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));

  // Clear cart
  saveCartForUser(userId, []);

  // Sync to Firestore
  setDoc(doc(db, 'orders', newOrder.id), newOrder).catch(err => {
    handleFirestoreError(err, OperationType.WRITE, `orders/${newOrder.id}`);
  });

  return newOrder;
}

export function updateOrderStatus(orderId: string, status: Order['status']): boolean {
  const orders = getAllOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return false;

  orders[idx].status = status;
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));

  // Sync to Firestore
  setDoc(doc(db, 'orders', orderId), orders[idx]).catch(err => {
    handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
  });

  return true;
}

// WhatsApp redirect trigger link generator
export function getWhatsAppCheckoutUrl(order: Order): string {
  const itemsText = order.items
    .map(item => `• ${item.name} (${item.color} | Size ${item.size}) x${item.quantity}`)
    .join('%0A');

  const text = `*PLAYBOOK STUDIOS - ORDER PLACED*%0A%0A` +
    `*Order ID:* ${order.orderNumber}%0A` +
    `*Customer:* ${order.customerName}%0A` +
    `*Phone:* ${order.customerPhone}%0A` +
    `*Total Amount:* ₹${order.total.toLocaleString()} INR%0A%0A` +
    `*Products:*%0A${itemsText}%0A%0A` +
    `Please confirm my order and share details for payment. Thank you!`;

  return `https://wa.me/919861239776?text=${text}`;
}
