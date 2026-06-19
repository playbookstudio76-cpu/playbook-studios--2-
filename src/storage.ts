import { 
  UserProfile, 
  Product, 
  Order, 
  CartItem, 
  Category, 
  UserRole,
  Coupon,
  FloatingBanner,
  AnnouncementBar,
  SocialConfig,
  WhatsAppConfig,
  TeamMember,
  NewsletterEmail,
  UserWallet,
  WalletTransaction,
  StoreConfig,
  WalletAndProfitSettings,
  ShippingTier,
  DeliveryZone,
  CustomPage
} from './types';
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
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

// Storage keys
const KEYS = {
  CURRENT_USER: 'pb_current_user',
  USERS: 'pb_users_db',
  PRODUCTS: 'pb_products_db',
  ORDERS: 'pb_orders_db',
  CATEGORIES: 'pb_categories_db',
  CARTS: 'pb_carts_db', // keyed by userId
  COUPONS: 'pb_coupons_db',
  BANNERS: 'pb_banners_db',
  ANNOUNCEMENTS: 'pb_announcements_db',
  TEAM_MEMBERS: 'pb_team_members_db',
  NEWSLETTER_EMAILS: 'pb_newsletter_emails_db',
  WALLETS: 'pb_wallets_db',
  SOCIAL_LINKS: 'pb_social_links_db',
  WHATSAPP_CONFIG: 'pb_whatsapp_config_db',
  STORE_CONFIG: 'pb_store_config_db',
  WALLET_SETTINGS: 'pb_wallet_settings_db',
  SHIPPING_TIERS: 'pb_shipping_tiers_db',
  DELIVERY_ZONES: 'pb_delivery_zones_db',
  PAGES: 'pb_pages_db',
};

export function cleanFirestoreData<T extends any>(val: T): T {
  if (val === undefined) {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(item => cleanFirestoreData(item)) as any;
  }
  if (val !== null && typeof val === 'object') {
    const cleaned = { ...val } as any;
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined) {
        delete cleaned[key];
      } else if (typeof cleaned[key] === 'object' || Array.isArray(cleaned[key])) {
        cleaned[key] = cleanFirestoreData(cleaned[key]);
      }
    });
    return cleaned;
  }
  return val;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean === 'playbookstudio76@gmail.com' || clean === 'sohansahustudy@gmail.com';
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
        email: 'playbookstudio76@gmail.com',
        phone: '+1 (800) 555-0199',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(KEYS.USERS, JSON.stringify(defaultUsersList));
  }

  if (!localStorage.getItem(KEYS.SHIPPING_TIERS)) {
    const defaultShippingTiers = [
      { id: 'tier_1', minQty: 1, maxQty: 1, price: 79 },
      { id: 'tier_2', minQty: 2, maxQty: 2, price: 86 },
      { id: 'tier_3', minQty: 3, maxQty: null, price: 105 }
    ];
    localStorage.setItem(KEYS.SHIPPING_TIERS, JSON.stringify(defaultShippingTiers));
  }

  if (!localStorage.getItem(KEYS.DELIVERY_ZONES)) {
    const defaultDeliveryZones = [
      { id: 'zone_1', name: 'Default Local', type: 'Local', pincodePrefixes: ['560', '600'], minDays: 5, maxDays: 8 },
      { id: 'zone_2', name: 'Default Regional', type: 'Regional', pincodePrefixes: ['110', '400'], minDays: 5, maxDays: 10 },
      { id: 'zone_3', name: 'Default Remote', type: 'Remote', pincodePrefixes: ['700', '800'], minDays: 7, maxDays: 15 }
    ];
    localStorage.setItem(KEYS.DELIVERY_ZONES, JSON.stringify(defaultDeliveryZones));
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
  let unsubAnnouncements: () => void = () => {};
  let unsubBanners: () => void = () => {};
  let unsubCoupons: () => void = () => {};
  let unsubTeamMembers: () => void = () => {};
  let unsubNewsletterEmails: () => void = () => {};
  let unsubSettings: () => void = () => {};
  let unsubPages: () => void = () => {};

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

    // 2b. Sync Announcements (allowed for everyone)
    unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      const items: AnnouncementBar[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as AnnouncementBar);
      });
      if (items.length > 0) {
        localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(items));
        onUpdate();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'announcements');
    });

    // 2c. Sync Banners (allowed for everyone)
    unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      const items: FloatingBanner[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as FloatingBanner);
      });
      if (items.length > 0) {
        localStorage.setItem(KEYS.BANNERS, JSON.stringify(items));
        onUpdate();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'banners');
    });

    // 2d. Sync Coupons (allowed for everyone)
    unsubCoupons = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      const items: Coupon[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Coupon);
      });
      if (items.length > 0) {
        localStorage.setItem(KEYS.COUPONS, JSON.stringify(items));
        onUpdate();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'coupons');
    });

    // 2e. Sync Team Members (allowed for everyone)
    unsubTeamMembers = onSnapshot(collection(db, 'team_members'), (snapshot) => {
      const items: TeamMember[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as TeamMember);
      });
      if (items.length > 0) {
        localStorage.setItem(KEYS.TEAM_MEMBERS, JSON.stringify(items));
        onUpdate();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'team_members');
    });

    // Sync Pages (allowed for everyone)
    unsubPages = onSnapshot(collection(db, 'pages'), (snapshot) => {
      const items: CustomPage[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as CustomPage);
      });
      if (items.length > 0) {
        localStorage.setItem(KEYS.PAGES, JSON.stringify(items));
        onUpdate();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'pages');
    });

    // 2f. Sync Settings (allowed for everyone, specifically social_links and whatsapp_config)
    unsubSettings = onSnapshot(collection(db, 'settings'), (snapshot) => {
      snapshot.forEach(docSnap => {
        const id = docSnap.id;
        const data = docSnap.data();
        if (id === 'social_links') {
          localStorage.setItem(KEYS.SOCIAL_LINKS, JSON.stringify({ id, ...data }));
        } else if (id === 'whatsapp_config') {
          localStorage.setItem(KEYS.WHATSAPP_CONFIG, JSON.stringify({ id, ...data }));
        } else if (id === 'store_config') {
          localStorage.setItem(KEYS.STORE_CONFIG, JSON.stringify({ id, ...data }));
        } else if (id === 'shipping_tiers') {
          localStorage.setItem(KEYS.SHIPPING_TIERS, JSON.stringify(data.tiers || []));
        } else if (id === 'delivery_zones') {
          localStorage.setItem(KEYS.DELIVERY_ZONES, JSON.stringify(data.zones || []));
        }
      });
      onUpdate();
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings');
    });

    // 3. Reactively sync authenticated user content (orders/profile)
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Unsubscribe existing listeners
      unsubOrders();
      unsubUsers();
      unsubNewsletterEmails();
      
      unsubOrders = () => {};
      unsubUsers = () => {};
      unsubNewsletterEmails = () => {};

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

        if (userProfile && userProfile.role === 'admin' && !isAdminEmail(userProfile.email)) {
          userProfile.role = 'customer';
        }

        if (userProfile && userProfile.role === 'admin') {
          // Administrators listen to whole orders & whole users database & whole newsletter_emails database
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

          unsubNewsletterEmails = onSnapshot(collection(db, 'newsletter_emails'), (snapshot) => {
            const items: NewsletterEmail[] = [];
            snapshot.forEach(docSnap => {
              items.push({ id: docSnap.id, ...docSnap.data() } as NewsletterEmail);
            });
            localStorage.setItem(KEYS.NEWSLETTER_EMAILS, JSON.stringify(items));
            onUpdate();
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'newsletter_emails');
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
      unsubAnnouncements();
      unsubBanners();
      unsubCoupons();
      unsubTeamMembers();
      unsubNewsletterEmails();
      unsubSettings();
      unsubPages();
    };

  } catch (err) {
    console.warn('Real-time sync subscription not authorized or loaded offline:', err);
    return () => {};
  }
}

// ---------------- AUTH SERVICES ----------------

export function getCurrentUser(): UserProfile | null {
  const userStr = localStorage.getItem(KEYS.CURRENT_USER);
  if (!userStr) return null;
  const user = JSON.parse(userStr) as UserProfile;
  if (user && user.role === 'admin' && !isAdminEmail(user.email)) {
    user.role = 'customer';
  }
  return user;
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
  setDoc(doc(db, 'users', user.id), cleanFirestoreData(user)).catch(err => {
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
    await setDoc(doc(db, 'users', firebaseUser.uid), cleanFirestoreData(newUser));

    // Also trigger wallet creation with default values
    getUserWallet(firebaseUser.uid);

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
      await setDoc(doc(db, 'users', firebaseUser.uid), cleanFirestoreData(user));
      users.push(user);
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    } else {
      if (isAdminEmail(cleanEmail) && user.role !== 'admin') {
        user.role = 'admin';
        await setDoc(doc(db, 'users', firebaseUser.uid), cleanFirestoreData(user));
      }
      if (user.id !== firebaseUser.uid) {
        user.id = firebaseUser.uid;
        await setDoc(doc(db, 'users', firebaseUser.uid), cleanFirestoreData(user));
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

export async function loginWithGoogle(): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    
    const cleanEmail = firebaseUser.email?.trim().toLowerCase() || '';
    if (!cleanEmail) {
      return { success: false, error: 'Google sign-in did not return a valid email address.' };
    }
    
    const users = getAllUsers();
    let user = users.find(u => u.id === firebaseUser.uid || u.email.toLowerCase() === cleanEmail);
    
    const displayName = firebaseUser.displayName || '';
    const nameParts = displayName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Google';
    const lastName = nameParts.slice(1).join(' ') || 'User';
    
    if (!user) {
      const role: UserRole = isAdminEmail(cleanEmail) ? 'admin' : 'customer';
      user = {
        id: firebaseUser.uid,
        firstName,
        lastName,
        email: cleanEmail,
        phone: firebaseUser.phoneNumber || '',
        role,
        createdAt: new Date().toISOString(),
        addresses: [],
        profilePicture: firebaseUser.photoURL || ''
      };
      
      // Save in Firestore and localStorage
      await setDoc(doc(db, 'users', firebaseUser.uid), cleanFirestoreData(user));
      users.push(user);
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      
      // Also trigger wallet creation with default dynamic values
      getUserWallet(firebaseUser.uid);
    } else {
      let changed = false;
      if (isAdminEmail(cleanEmail) && user.role !== 'admin') {
        user.role = 'admin';
        changed = true;
      }
      if (user.id !== firebaseUser.uid) {
        user.id = firebaseUser.uid;
        changed = true;
      }
      if (!user.profilePicture && firebaseUser.photoURL) {
        user.profilePicture = firebaseUser.photoURL;
        changed = true;
      }
      if (changed) {
        await setDoc(doc(db, 'users', firebaseUser.uid), cleanFirestoreData(user));
        localStorage.setItem(KEYS.USERS, JSON.stringify(users.map(u => u.email.toLowerCase() === cleanEmail ? user! : u)));
      }
    }
    
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    return { success: true, user };
  } catch (err: any) {
    console.error('Google Sign-In Error Detail:', err);
    let errorMsg = 'Google authentication failed.';
    if (err.code === 'auth/popup-closed-by-user') {
      errorMsg = 'Sign-in popup was closed before completion.';
    } else {
      errorMsg = err.message || errorMsg;
    }
    return { success: false, error: errorMsg };
  }
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
    await setDoc(doc(db, 'products', newProduct.id), cleanFirestoreData(newProduct));
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
    await setDoc(doc(db, 'products', id), cleanFirestoreData(updatedNode));
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

export async function addCategory(name: string, imageUrl?: string): Promise<Category> {
  const cats = getAllCategories();
  const idValue = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const newCat: Category = {
    id: idValue || "cat-" + Math.random().toString(36).substr(2, 9),
    name,
    imageUrl,
    createdAt: new Date().toISOString()
  };
  cats.push(newCat);
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(cats));

  // Sync and await Firestore write
  try {
    await setDoc(doc(db, 'categories', newCat.id), cleanFirestoreData(newCat));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `categories/${newCat.id}`);
    throw err;
  }

  return newCat;
}

export async function deleteCategory(id: string): Promise<void> {
  const cats = getAllCategories().filter(c => c.id !== id);
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(cats));
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
  }
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
  total: number,
  walletApplied: number = 0,
  couponCodeApplied: string = ''
): Order {
  const orders = getAllOrders();
  
  // Verify first-order status before adding the current one
  const userOrdersPrior = orders.filter(o => o.userId === userId);
  const isFirstOrder = userOrdersPrior.length === 0;

  // Generate sequential order number starting with 0001
  const nextNum = orders.length + 1;
  const orderNumber = `PB-${nextNum.toString().padStart(4, '0')}`;
  
  const newOrder: Order & { walletApplied?: number; couponCodeApplied?: string } = {
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

  if (walletApplied > 0) {
    newOrder.walletApplied = walletApplied;
    // Deduct from wallet
    updateUserWallet(userId, -walletApplied, `Applied to Order ${orderNumber}`);
  }

  if (couponCodeApplied) {
    newOrder.couponCodeApplied = couponCodeApplied;
  }

  // If first order and cashback enabled, reward user back to wallet
  const settings = getWalletAndProfitSettings();
  if (isFirstOrder && userId && settings.cashbackEnabled) {
    updateUserWallet(userId, settings.cashbackPerOrder, `🎁 Playbook First-Order Cashback Reward`);
  }

  // Register user email to Merch Mail list as a prior customer of playbook
  if (customerEmail) {
    addNewsletterEmail(customerEmail, true);
  }

  orders.unshift(newOrder);
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));

  // Deduct Inventory values accordingly
  const products = getAllProducts();
  items.forEach(item => {
    const parentProd = products.find(p => p.id === item.productId);
    if (parentProd) {
      parentProd.stock = Math.max(0, parentProd.stock - item.quantity);
      
      // Update inventory on Firestore too
      setDoc(doc(db, 'products', parentProd.id), cleanFirestoreData(parentProd)).catch(e => {
        handleFirestoreError(e, OperationType.WRITE, `products/${parentProd.id}`);
      });
    }
  });
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));

  // Clear cart
  saveCartForUser(userId, []);

  // Sync to Firestore
  setDoc(doc(db, 'orders', newOrder.id), cleanFirestoreData(newOrder)).catch(err => {
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
  setDoc(doc(db, 'orders', orderId), cleanFirestoreData(orders[idx])).catch(err => {
    handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
  });

  return true;
}

// WhatsApp redirect trigger link generator dynamically pulling phone from managed settings
export function getWhatsAppCheckoutUrl(order: Order): string {
  const config = getWhatsAppConfig();
  let rawNum = config.phoneNumber.replace(/[^0-9]/g, '');
  if (rawNum.length === 10) {
    rawNum = '91' + rawNum;
  }
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

  return `https://wa.me/${rawNum}?text=${text}`;
}

// ---------------- ANNOUNCEMENT BARS SERVICE ----------------

export function getAllAnnouncements(): AnnouncementBar[] {
  const data = localStorage.getItem(KEYS.ANNOUNCEMENTS);
  if (!data) {
    const defaults: AnnouncementBar[] = [];
    localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(defaults));
    return defaults;
  }
  let parsed = JSON.parse(data);
  if (Array.isArray(parsed)) {
    // Proactively clear the old mock announcement if present
    parsed = parsed.filter(b => b.id !== 'ann_default');
  }
  return parsed;
}

export async function saveAnnouncement(bar: AnnouncementBar): Promise<void> {
  const bars = getAllAnnouncements();
  const idx = bars.findIndex(b => b.id === bar.id);
  if (idx !== -1) {
    bars[idx] = bar;
  } else {
    bars.unshift(bar);
  }
  localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(bars));
  try {
    await setDoc(doc(db, 'announcements', bar.id), cleanFirestoreData(bar));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `announcements/${bar.id}`);
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const bars = getAllAnnouncements().filter(b => b.id !== id);
  localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(bars));
  try {
    await deleteDoc(doc(db, 'announcements', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`);
  }
}

// ---------------- FLOATING BANNERS SERVICE ----------------

export function getAllBanners(): FloatingBanner[] {
  const data = localStorage.getItem(KEYS.BANNERS);
  if (!data) {
    const defaults: FloatingBanner[] = [];
    localStorage.setItem(KEYS.BANNERS, JSON.stringify(defaults));
    return defaults;
  }
  let parsed = JSON.parse(data);
  if (Array.isArray(parsed)) {
    // Proactively clear the old mock banner if present
    parsed = parsed.filter(b => b.id !== 'ban_default');
  }
  return parsed;
}

export async function saveBanner(banner: FloatingBanner): Promise<void> {
  const banners = getAllBanners();
  const idx = banners.findIndex(b => b.id === banner.id);
  if (idx !== -1) {
    banners[idx] = banner;
  } else {
    banners.unshift(banner);
  }
  localStorage.setItem(KEYS.BANNERS, JSON.stringify(banners));
  try {
    await setDoc(doc(db, 'banners', banner.id), cleanFirestoreData(banner));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `banners/${banner.id}`);
  }
}

export async function deleteBanner(id: string): Promise<void> {
  const banners = getAllBanners().filter(b => b.id !== id);
  localStorage.setItem(KEYS.BANNERS, JSON.stringify(banners));
  try {
    await deleteDoc(doc(db, 'banners', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `banners/${id}`);
  }
}

// ---------------- SOCIAL MEDIA CONFIG SERVICE ----------------

export function getSocialConfig(): SocialConfig {
  const data = localStorage.getItem(KEYS.SOCIAL_LINKS);
  if (!data) {
    const defaultConfig: SocialConfig = {
      id: 'social_links',
      instagram: '',
      twitter: '',
      youtube: '',
      facebook: '',
      pinterest: '',
      instagramImages: []
    };
    localStorage.setItem(KEYS.SOCIAL_LINKS, JSON.stringify(defaultConfig));
    return defaultConfig;
  }
  const parsed = JSON.parse(data);
  // Clear preset mock lookbook links or images if they match old playbook template defaults
  if (parsed.instagram === 'https://instagram.com/playbookstudios' || parsed.instagramImages?.some((img: string) => img.includes('photo-1515886657613'))) {
    parsed.instagram = '';
    parsed.twitter = '';
    parsed.youtube = '';
    parsed.facebook = '';
    parsed.pinterest = '';
    parsed.instagramImages = [];
    localStorage.setItem(KEYS.SOCIAL_LINKS, JSON.stringify(parsed));
  }
  return parsed;
}

export async function saveSocialConfig(config: SocialConfig): Promise<void> {
  localStorage.setItem(KEYS.SOCIAL_LINKS, JSON.stringify(config));
  try {
    await setDoc(doc(db, 'settings', 'social_links'), cleanFirestoreData(config));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/social_links');
  }
}

// ---------------- WHATSAPP CONFIG SERVICE ----------------

export function getWhatsAppConfig(): WhatsAppConfig {
  const data = localStorage.getItem(KEYS.WHATSAPP_CONFIG);
  if (!data) {
    const defaultConfig: WhatsAppConfig = {
      id: 'whatsapp_config',
      phoneNumber: '919861239776',
      isEnabled: true,
      prefilledMessageText: "Hey! I am interested in ordering: "
    };
    localStorage.setItem(KEYS.WHATSAPP_CONFIG, JSON.stringify(defaultConfig));
    return defaultConfig;
  }
  const parsed = JSON.parse(data);
  if (!parsed.phoneNumber) {
    parsed.phoneNumber = '919861239776';
    parsed.isEnabled = true;
    localStorage.setItem(KEYS.WHATSAPP_CONFIG, JSON.stringify(parsed));
  }
  return parsed;
}

export async function saveWhatsAppConfig(config: WhatsAppConfig): Promise<void> {
  localStorage.setItem(KEYS.WHATSAPP_CONFIG, JSON.stringify(config));
  try {
    await setDoc(doc(db, 'settings', 'whatsapp_config'), cleanFirestoreData(config));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/whatsapp_config');
  }
}

// ---------------- COUPONS MANAGEMENT SERVICE ----------------

export function getAllCoupons(): Coupon[] {
  const data = localStorage.getItem(KEYS.COUPONS);
  if (!data) {
    const defaults: Coupon[] = [
      {
        id: "cp_percent_15",
        code: "PB15",
        discountType: "percent",
        discountValue: 15,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "cp_fixed_300",
        code: "PBK300",
        discountType: "fixed",
        discountValue: 300,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(KEYS.COUPONS, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(data);
}

export async function saveCoupon(coupon: Coupon): Promise<void> {
  const coupons = getAllCoupons();
  const idx = coupons.findIndex(c => c.id === coupon.id);
  if (idx !== -1) {
    coupons[idx] = coupon;
  } else {
    coupons.unshift(coupon);
  }
  localStorage.setItem(KEYS.COUPONS, JSON.stringify(coupons));
  try {
    await setDoc(doc(db, 'coupons', coupon.id), cleanFirestoreData(coupon));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `coupons/${coupon.id}`);
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  const coupons = getAllCoupons().filter(c => c.id !== id);
  localStorage.setItem(KEYS.COUPONS, JSON.stringify(coupons));
  try {
    await deleteDoc(doc(db, 'coupons', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `coupons/${id}`);
  }
}

// ---------------- TEAM MEMBERS MANAGEMENT SERVICE ----------------

export function getAllTeamMembers(): TeamMember[] {
  const data = localStorage.getItem(KEYS.TEAM_MEMBERS);
  if (!data) {
    const defaults: TeamMember[] = [
      {
        id: "tm_admin_sohan",
        name: "Sohan Sahu",
        email: "sohansahustudy@gmail.com",
        role: "admin",
        permissions: ["products", "orders", "coupons", "banners", "team", "wallet"],
        createdAt: new Date().toISOString()
      },
      {
        id: "tm_editor_alex",
        name: "Alex Designer",
        email: "editor@playbook.com",
        role: "editor",
        permissions: ["products", "coupons", "banners"],
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(KEYS.TEAM_MEMBERS, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(data);
}

export async function saveTeamMember(member: TeamMember): Promise<void> {
  const members = getAllTeamMembers();
  const idx = members.findIndex(m => m.id === member.id);
  if (idx !== -1) {
    members[idx] = member;
  } else {
    members.unshift(member);
  }
  localStorage.setItem(KEYS.TEAM_MEMBERS, JSON.stringify(members));
  try {
    await setDoc(doc(db, 'team_members', member.id), cleanFirestoreData(member));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `team_members/${member.id}`);
  }
}

export async function deleteTeamMember(id: string): Promise<void> {
  const members = getAllTeamMembers().filter(m => m.id !== id);
  localStorage.setItem(KEYS.TEAM_MEMBERS, JSON.stringify(members));
  try {
    await deleteDoc(doc(db, 'team_members', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `team_members/${id}`);
  }
}

// ---------------- NEWSLETTER / MERCH MAIL SERVICE ----------------

export function getAllNewsletterEmails(): NewsletterEmail[] {
  const data = localStorage.getItem(KEYS.NEWSLETTER_EMAILS);
  if (!data) {
    const defaults: NewsletterEmail[] = [
      {
        id: "nm_1",
        email: "prior_customer1@playbook.com",
        isPriorCustomer: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "nm_2",
        email: "streetwear_fan@gmail.com",
        isPriorCustomer: false,
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(KEYS.NEWSLETTER_EMAILS, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(data);
}

export async function addNewsletterEmail(email: string, isPriorCustomer: boolean = false): Promise<NewsletterEmail> {
  const list = getAllNewsletterEmails();
  const clean = email.trim().toLowerCase();
  
  const existing = list.find(nm => nm.email === clean);
  if (existing) {
    if (isPriorCustomer && !existing.isPriorCustomer) {
      existing.isPriorCustomer = true;
      localStorage.setItem(KEYS.NEWSLETTER_EMAILS, JSON.stringify(list));
      try {
        await setDoc(doc(db, 'newsletter_emails', existing.id), cleanFirestoreData(existing));
      } catch (e) {
        console.warn(e);
      }
    }
    return existing;
  }

  const newItem: NewsletterEmail = {
    id: "nm_" + Math.random().toString(36).substr(2, 9),
    email: clean,
    isPriorCustomer,
    createdAt: new Date().toISOString()
  };

  list.push(newItem);
  localStorage.setItem(KEYS.NEWSLETTER_EMAILS, JSON.stringify(list));
  try {
    await setDoc(doc(db, 'newsletter_emails', newItem.id), cleanFirestoreData(newItem));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `newsletter_emails/${newItem.id}`);
  }
  return newItem;
}

export async function deleteNewsletterEmail(id: string): Promise<void> {
  const list = getAllNewsletterEmails().filter(m => m.id !== id);
  localStorage.setItem(KEYS.NEWSLETTER_EMAILS, JSON.stringify(list));
  try {
    await deleteDoc(doc(db, 'newsletter_emails', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `newsletter_emails/${id}`);
  }
}

// ---------------- CUSTOMER WALLETS SERVICE ----------------

export function getUserWallet(userId: string): UserWallet {
  if (!userId) {
    return {
      id: 'guest',
      balance: 0,
      transactions: []
    };
  }
  const data = localStorage.getItem(KEYS.WALLETS);
  const walletsMap: Record<string, UserWallet> = data ? JSON.parse(data) : {};
  
  if (!walletsMap[userId]) {
    const settings = getWalletAndProfitSettings();
    const bonus = settings.walletEnabled ? settings.signupBonus : 0;
    const transactions = bonus > 0 ? [
      {
        id: "tx_signup_bonus",
        amount: bonus,
        description: "🎁 Welcome Signup Bonus",
        createdAt: new Date().toISOString()
      }
    ] : [];

    const newWallet: UserWallet = {
      id: userId,
      balance: bonus,
      transactions
    };
    walletsMap[userId] = newWallet;
    localStorage.setItem(KEYS.WALLETS, JSON.stringify(walletsMap));
    
    setDoc(doc(db, 'wallets', userId), cleanFirestoreData(newWallet)).catch(e => {
      handleFirestoreError(e, OperationType.WRITE, `wallets/${userId}`);
    });
    
    return newWallet;
  }
  
  return walletsMap[userId];
}

export function getAllWallets(): UserWallet[] {
  const data = localStorage.getItem(KEYS.WALLETS);
  if (!data) return [];
  const map: Record<string, UserWallet> = JSON.parse(data);
  return Object.values(map);
}

export function saveWalletRaw(wallet: UserWallet) {
  const data = localStorage.getItem(KEYS.WALLETS);
  const walletsMap: Record<string, UserWallet> = data ? JSON.parse(data) : {};
  walletsMap[wallet.id] = wallet;
  localStorage.setItem(KEYS.WALLETS, JSON.stringify(walletsMap));
  setDoc(doc(db, 'wallets', wallet.id), cleanFirestoreData(wallet)).catch(e => {
    handleFirestoreError(e, OperationType.WRITE, `wallets/${wallet.id}`);
  });
}

export function updateUserWallet(userId: string, changeAmount: number, description: string): UserWallet {
  const data = localStorage.getItem(KEYS.WALLETS);
  const walletsMap: Record<string, UserWallet> = data ? JSON.parse(data) : {};
  
  const currentWallet = getUserWallet(userId);
  const updatedWallet: UserWallet = {
    ...currentWallet,
    balance: Math.max(0, currentWallet.balance + changeAmount),
    transactions: [
      {
        id: "tx_" + Math.random().toString(36).substr(2, 9),
        amount: changeAmount,
        description,
        createdAt: new Date().toISOString()
      },
      ...currentWallet.transactions
    ]
  };
  
  walletsMap[userId] = updatedWallet;
  localStorage.setItem(KEYS.WALLETS, JSON.stringify(walletsMap));
  
  setDoc(doc(db, 'wallets', userId), cleanFirestoreData(updatedWallet)).catch(err => {
    handleFirestoreError(err, OperationType.WRITE, `wallets/${userId}`);
  });
  
  return updatedWallet;
}

// ---------------- STORE STYLE/LAYOUT CONFIGURATION SERVICE ----------------

export function getStoreConfig(): StoreConfig {
  const data = localStorage.getItem(KEYS.STORE_CONFIG);
  if (!data) {
    const defaultConfig: StoreConfig = {
      id: 'store_config',
      heroImageUrl: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=1520&auto=format&fit=crop',
      authImageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop'
    };
    localStorage.setItem(KEYS.STORE_CONFIG, JSON.stringify(defaultConfig));
    return defaultConfig;
  }
  return JSON.parse(data);
}

export async function saveStoreConfig(config: StoreConfig): Promise<void> {
  localStorage.setItem(KEYS.STORE_CONFIG, JSON.stringify(config));
  try {
    await setDoc(doc(db, 'settings', 'store_config'), cleanFirestoreData(config));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/store_config');
  }
}

// ---------------- WALLET & PROFIT CONFIGURATION SERVICE ----------------

export function getWalletAndProfitSettings(): WalletAndProfitSettings {
  const data = localStorage.getItem(KEYS.WALLET_SETTINGS);
  if (!data) {
    const defaultSettings: WalletAndProfitSettings = {
      id: 'wallet_profit_settings',
      walletEnabled: true,
      signupBonus: 300,
      signupBonusExpiryDays: 14,
      cashbackEnabled: true,
      cashbackPerOrder: 100,
      cashbackExpiryDays: 7,
      minOrderValueToUseWallet: 100,
      maxWalletUsagePercentage: 25,
      maxCombinedDiscountPercentage: 15,
      minimumProfitPerOrder: 150,
      defaultCostPercentageOfSellingPrice: 60,
      referralSystemEnabled: true,
      referrerReward: 100,
      refereeBonus: 100,
      referralBonusExpiryDays: 30,
      birthdayBonusEnabled: true,
      birthdayBonusAmount: 200,
      birthdayBonusExpiryDays: 14,
    };
    localStorage.setItem(KEYS.WALLET_SETTINGS, JSON.stringify(defaultSettings));
    return defaultSettings;
  }
  return JSON.parse(data);
}

export async function saveWalletAndProfitSettings(settings: WalletAndProfitSettings): Promise<void> {
  localStorage.setItem(KEYS.WALLET_SETTINGS, JSON.stringify(settings));
  try {
    await setDoc(doc(db, 'settings', 'wallet_profit_settings'), cleanFirestoreData(settings));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/wallet_profit_settings');
  }
}

// ---------------- SHIPPING & DELIVERY ZONES CONFIGURATION SERVICES ----------------

export function getShippingTiers(): ShippingTier[] {
  const data = localStorage.getItem(KEYS.SHIPPING_TIERS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function saveShippingTiers(tiers: ShippingTier[]): Promise<void> {
  localStorage.setItem(KEYS.SHIPPING_TIERS, JSON.stringify(tiers));
  try {
    await setDoc(doc(db, 'settings', 'shipping_tiers'), { tiers: cleanFirestoreData(tiers) });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/shipping_tiers');
  }
}

export function getDeliveryZones(): DeliveryZone[] {
  const data = localStorage.getItem(KEYS.DELIVERY_ZONES);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function saveDeliveryZones(zones: DeliveryZone[]): Promise<void> {
  localStorage.setItem(KEYS.DELIVERY_ZONES, JSON.stringify(zones));
  try {
    await setDoc(doc(db, 'settings', 'delivery_zones'), { zones: cleanFirestoreData(zones) });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/delivery_zones');
  }
}

const DEFAULT_PAGES: CustomPage[] = [
  {
    id: 'sustainability',
    slug: 'sustainability',
    title: 'Sustainability Commitment',
    content: '### Our Eco-System Ethics\n\nAt Playbook Studios, our commitment to architectural design is balanced by our dedication to ethical micro-production. We craft every piece in limited batches to eliminate deadstock waste.\n\n- **100% Organic Fibers**: Every garment uses certified organic cotton and recycled technical blends.\n- **Carbon Neutral Logistics**: We support certified carbon offset programs for all parcel shipments.\n- **Circular Design**: We design garments that last, resisting seasonal rapid-consumption trends.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'shipping-returns',
    slug: 'shipping-returns',
    title: 'Shipping & Returns Policy',
    content: '### Premium Handled Commerce\n\nWe offer worldwide premium trackable shipping. Standard processing takes 2-4 business days. Returns can be initiated within 14 days of delivery for store wallet credit.\n\n- **Free Shipping**: Available for orders containing 3+ elements or matching tiers.\n- **Easy Returns**: Simply message our support on WhatsApp to process size-refinement or store credit swaps.\n- **Secure Delivery**: Standard transit times are 3-7 terminal business days.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'privacy-policy',
    slug: 'privacy-policy',
    title: 'Privacy & Security Directives',
    content: '### Data Sovereignty\n\nYour privacy is material to us. We secure your credentials via encrypted cloud protocols and never sell user navigation or purchase data to third-party ad brokers.\n\n- **Zero External Tracking**: No third-party behavioral cookies or advertising trackers.\n- **Secure Ledger**: Wallet transactions and balances are isolated in protected Firestore instances.\n- **Communication Preference**: Opt-out of newsletters instantly with one single action.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'terms-and-conditions',
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions',
    content: '### Studio Engagement Rules\n\nBy accessing Playbook Studios, you agree to our premium streetwear archive acquisition guidelines. All collections are limited runs and subject to dynamic stock availability.\n\n1. **Limited Acquisitions**: To discourage reselling, individual orders may be restricted to maximum 5 items of a single SKU.\n2. **Verified Accounts**: Promo wallet credits are non-transferable and expire under predefined campaigns.\n3. **Content IP**: All architectural blueprints, imagery, and design templates are exclusive properties of Playbook Studios.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'about-us',
    slug: 'about-us',
    title: 'About Playbook Studios',
    content: '### Geometric Order & Contemporary Craft\n\nPlaybook Studios is a design lab crafting refined, minimalist architectural streetwear. We explore the lines between geometric order, industrial design, and contemporary culture.\n\nFounded in 2026, our designs are defined by high-contrast tones, structured silhouettes, and material selections. Every collection functions as an archive entry, released in limited-run installments.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'contact',
    slug: 'contact',
    title: 'Contact Us',
    content: '### Support & Inquiry Channels\n\nGet in touch with our representative channel. Reach us via email at playbookstudio76@gmail.com, or message us directly through our live WhatsApp portal.\n\n- **Representative Email**: playbookstudio76@gmail.com\n- **WhatsApp Support Desk**: Available Mon - Fri, 10 AM to 6 PM IST\n- **Press / Wholesale**: wholesale@playbookstudios.com',
    updatedAt: new Date().toISOString()
  }
];

export function getCustomPages(): CustomPage[] {
  const data = localStorage.getItem(KEYS.PAGES);
  if (!data) {
    // Populate with defaults
    localStorage.setItem(KEYS.PAGES, JSON.stringify(DEFAULT_PAGES));
    DEFAULT_PAGES.forEach(pg => {
      setDoc(doc(db, 'pages', pg.id), cleanFirestoreData(pg)).catch(e => {
        console.warn('Silent seeding page warning:', pg.id, e);
      });
    });
    return DEFAULT_PAGES;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(e);
    return DEFAULT_PAGES;
  }
}

export async function saveCustomPage(page: CustomPage): Promise<void> {
  const pages = getCustomPages();
  const index = pages.findIndex(p => p.id === page.id);
  const updated = [...pages];
  page.updatedAt = new Date().toISOString();
  if (index !== -1) {
    updated[index] = page;
  } else {
    updated.push(page);
  }
  localStorage.setItem(KEYS.PAGES, JSON.stringify(updated));
  try {
    await setDoc(doc(db, 'pages', page.id), cleanFirestoreData(page));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `pages/${page.id}`);
  }
}



