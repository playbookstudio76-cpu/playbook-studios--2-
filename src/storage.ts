import { UserProfile, Product, Order, CartItem, Category, UserRole } from './types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from './mockData';
import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  getDoc
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// Storage keys
const KEYS = {
  CURRENT_USER: 'pb_current_user',
  USERS: 'pb_users_db',
  PRODUCTS: 'pb_products_db',
  ORDERS: 'pb_orders_db',
  CATEGORIES: 'pb_categories_db',
  CARTS: 'pb_carts_db', // keyed by userId
};

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean === 'playbookstudio79@gmail.com' || clean === 'sohansahustudy@gmail.com';
}

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
  } else {
    // Purge any lingering demo orders from cache
    try {
      const existingOrders = JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]');
      const filteredOrders = existingOrders.filter((o: any) => o.userId !== 'demo-user-123' && o.customerEmail !== 'a.wright@example.com');
      if (existingOrders.length !== filteredOrders.length) {
        localStorage.setItem(KEYS.ORDERS, JSON.stringify(filteredOrders));
      }
    } catch (e) {
      console.warn(e);
    }
  }

  // Active Purge of demo customer profiles if retrieved from local state cache
  if (localStorage.getItem(KEYS.USERS)) {
    try {
      const existingUsers = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      const filteredUsers = existingUsers.filter((u: any) => u.id !== 'demo-user-123' && u.email !== 'a.wright@example.com');
      if (existingUsers.length !== filteredUsers.length) {
        localStorage.setItem(KEYS.USERS, JSON.stringify(filteredUsers));
      }
    } catch (e) {
      console.warn(e);
    }
  }

  // Active Purge of active session if logged in as Alexander Wright
  if (localStorage.getItem(KEYS.CURRENT_USER)) {
    try {
      const curUser = JSON.parse(localStorage.getItem(KEYS.CURRENT_USER) || '{}');
      if (curUser.id === 'demo-user-123' || curUser.email === 'a.wright@example.com') {
        localStorage.removeItem(KEYS.CURRENT_USER);
        window.location.reload();
      }
    } catch (e) {
      console.warn(e);
    }
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
  let unsubProducts: () => void = () => {};
  let unsubCategories: () => void = () => {};
  let unsubOrders: () => void = () => {};
  let unsubUsers: () => void = () => {};

  try {
    // 1. Sync Products (allowed for everyone)
    unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(items));
      onUpdate();
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    // 2. Sync Categories (allowed for everyone)
    unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const items: Category[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Category);
      });
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(items));
      onUpdate();
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });

    // 3. Reactively sync authenticated user content (orders/profile)
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Unsubscribe existing listeners
      unsubOrders();
      unsubUsers();
      unsubOrders = () => {};
      unsubUsers = () => {};

      if (firebaseUser) {
        let userProfile: UserProfile | null = null;
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            userProfile = userDoc.data() as UserProfile;
          }
        } catch (err) {
          console.warn('Silent issue fetching user profile on auth transition:', err);
        }

        // Fallback or setup user schema
        if (!userProfile) {
          const localUser = getCurrentUser();
          if (localUser && localUser.id === firebaseUser.uid) {
            userProfile = localUser;
          } else {
            const is_admin = isAdminEmail(firebaseUser.email);
            userProfile = {
              id: firebaseUser.uid,
              firstName: is_admin ? 'Playbook' : 'Store',
              lastName: is_admin ? 'Admin' : 'Member',
              email: firebaseUser.email || '',
              phone: '',
              role: is_admin ? 'admin' : 'customer',
              createdAt: new Date().toISOString()
            };
          }
        }

        if (userProfile.role === 'admin') {
          // Administrators listen to whole orders & whole users database
          unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
            const items: Order[] = [];
            snapshot.forEach(docSnap => {
              items.push({ id: docSnap.id, ...docSnap.data() } as Order);
            });
            localStorage.setItem(KEYS.ORDERS, JSON.stringify(items));
            onUpdate();
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'orders');
          });

          unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const items: UserProfile[] = [];
            snapshot.forEach(docSnap => {
              items.push({ id: docSnap.id, ...docSnap.data() } as UserProfile);
            });
            localStorage.setItem(KEYS.USERS, JSON.stringify(items));
            onUpdate();
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'users');
          });
        } else {
          // Customers only listen to their own customer orders to satisfy Firestore security rules
          const personalOrdersQuery = query(collection(db, 'orders'), where('userId', '==', firebaseUser.uid));
          unsubOrders = onSnapshot(personalOrdersQuery, (snapshot) => {
            const items: Order[] = [];
            snapshot.forEach(docSnap => {
              items.push({ id: docSnap.id, ...docSnap.data() } as Order);
            });
            localStorage.setItem(KEYS.ORDERS, JSON.stringify(items));
            onUpdate();
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'orders');
          });

          // Customers monitor their own profile doc
          unsubUsers = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
            if (docSnap.exists()) {
              const profile = docSnap.data() as UserProfile;
              saveCurrentUserSnapshot(profile);
              onUpdate();
            }
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          });
        }
      } else {
        // Guest user: clear secure order lists so data is sandboxed
        localStorage.setItem(KEYS.ORDERS, JSON.stringify([]));
        onUpdate();
      }
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubOrders();
      unsubUsers();
      unsubAuth();
    };

  } catch (err) {
    console.warn('Real-time sync subscription not authorized or loaded offline:', err);
    return () => {};
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

export async function signupUser(firstName: string, lastName: string, email: string, phone: string, passwordSecret: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  
  if (!cleanEmail || !passwordSecret) {
    return { success: false, error: 'Email and password are required.' };
  }

  try {
    // 1. Create User in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, passwordSecret);
    const firebaseUser = userCredential.user;

    const role: UserRole = isAdminEmail(cleanEmail) ? 'admin' : 'customer';
    
    const newUser: UserProfile = {
      id: firebaseUser.uid, // Use Firebase UID for direct Firestore association
      firstName,
      lastName,
      email: cleanEmail,
      phone,
      role,
      createdAt: new Date().toISOString(),
      addresses: []
    };

    // 2. Persist in local lists
    const users = getAllUsers();
    const existingIdx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (existingIdx !== -1) {
      users[existingIdx] = newUser;
    } else {
      users.push(newUser);
    }
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(newUser));

    // 3. Sync to Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

    return { success: true, user: newUser };
  } catch (err: any) {
    console.error('Firebase Signup Error Detail:', err);
    let errorMsg = 'Signup failed.';
    if (err.code === 'auth/email-already-in-use') {
      errorMsg = 'An account with this email already exists.';
    } else if (err.code === 'auth/weak-password') {
      errorMsg = 'The password is too weak. Must be at least 6 characters.';
    } else if (err.code === 'auth/invalid-email') {
      errorMsg = 'The email address is invalid.';
    } else if (err.code === 'auth/operation-not-allowed') {
      errorMsg = "Email/Password sign-in is disabled in Firebase console. Go to Authentication > Sign-in method, edit 'Email/Password', enable it, and save.";
    } else {
      errorMsg = err.message || errorMsg;
    }
    return { success: false, error: errorMsg };
  }
}

export async function loginUser(email: string, passwordSecret: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  
  if (!cleanEmail || !passwordSecret) {
    return { success: false, error: 'Email and password are required.' };
  }

  try {
    // 1. Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, passwordSecret);
    const firebaseUser = userCredential.user;

    // 2. Retrieve profile from local users or fallback
    const users = getAllUsers();
    let user = users.find(u => u.id === firebaseUser.uid || u.email.toLowerCase() === cleanEmail);

    if (!user) {
      const role: UserRole = isAdminEmail(cleanEmail) ? 'admin' : 'customer';
      user = {
        id: firebaseUser.uid,
        firstName: isAdminEmail(cleanEmail) ? 'Playbook' : 'Store',
        lastName: isAdminEmail(cleanEmail) ? 'Admin' : 'Member',
        email: cleanEmail,
        phone: '',
        role,
        createdAt: new Date().toISOString(),
        addresses: []
      };
      
      // Save in Firestore and localStorage
      await setDoc(doc(db, 'users', firebaseUser.uid), user);
      users.push(user);
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    } else {
      if (isAdminEmail(cleanEmail) && user.role !== 'admin') {
        user.role = 'admin';
        await setDoc(doc(db, 'users', firebaseUser.uid), user);
      }
      if (user.id !== firebaseUser.uid) {
        user.id = firebaseUser.uid;
        await setDoc(doc(db, 'users', firebaseUser.uid), user);
        localStorage.setItem(KEYS.USERS, JSON.stringify(users.map(u => u.email.toLowerCase() === cleanEmail ? user! : u)));
      }
    }

    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    return { success: true, user };
  } catch (err: any) {
    console.error('Firebase Login Error Detail:', err);
    
    // Auto-create administrative user if it's the default admin and doesn't exist yet on a fresh Firebase
    if (isAdminEmail(cleanEmail) && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
      try {
        const signupRes = await signupUser('Playbook', 'Admin', cleanEmail, '+1 (555) 7979', passwordSecret);
        if (signupRes.success) {
          return { success: true, user: signupRes.user };
        }
      } catch (signupErr) {
        console.error('Admin auto-creation failed:', signupErr);
      }
    }

    let errorMsg = 'Invalid email or password.';
    if (err.code === 'auth/invalid-email') {
      errorMsg = 'The email address is invalid.';
    } else if (err.code === 'auth/operation-not-allowed') {
      errorMsg = "Email/Password sign-in is disabled in Firebase console. Go to Authentication > Sign-in method, edit 'Email/Password', enable it, and save.";
    } else {
      errorMsg = err.message || errorMsg;
    }
    return { success: false, error: errorMsg };
  }
}

export function logoutUser() {
  localStorage.removeItem(KEYS.CURRENT_USER);
  signOut(auth).catch(err => {
    console.warn('Firebase logout issue:', err);
  });
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

export async function addProduct(productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const products = getAllProducts();
  const newProduct: Product = {
    ...productData,
    id: 'pb-' + Math.floor(100 + Math.random() * 900),
    createdAt: new Date().toISOString()
  };
  products.unshift(newProduct);
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));

  // Sync and await Firestore write
  try {
    await setDoc(doc(db, 'products', newProduct.id), newProduct);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `products/${newProduct.id}`);
    throw err;
  }

  return newProduct;
}

export async function updateProduct(id: string, updatedData: Partial<Product>): Promise<boolean> {
  const products = getAllProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return false;

  const updatedNode = { ...products[idx], ...updatedData };
  products[idx] = updatedNode;
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));

  // Sync and await Firestore write
  try {
    await setDoc(doc(db, 'products', id), updatedNode);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `products/${id}`);
    throw err;
  }

  return true;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = getAllProducts();
  const filtered = products.filter(p => p.id !== id);
  if (products.length === filtered.length) return false;

  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(filtered));

  // Sync and await Firestore delete
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    throw err;
  }

  return true;
}


// ---------------- CATEGORY SERVICES ----------------

export function getAllCategories(): Category[] {
  const list = localStorage.getItem(KEYS.CATEGORIES);
  return list ? JSON.parse(list) : [];
}

export async function addCategory(name: string): Promise<Category> {
  const cats = getAllCategories();
  const newCat: Category = {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    createdAt: new Date().toISOString()
  };
  cats.push(newCat);
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(cats));

  // Sync and await Firestore write
  try {
    await setDoc(doc(db, 'categories', newCat.id), newCat);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `categories/${newCat.id}`);
    throw err;
  }

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
