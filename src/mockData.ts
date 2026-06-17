import { Product, Category } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'outerwear', name: 'Outerwear', createdAt: new Date().toISOString() },
  { id: 'tops', name: 'Tops', createdAt: new Date().toISOString() },
  { id: 'bottoms', name: 'Bottoms', createdAt: new Date().toISOString() },
  { id: 'accessories', name: 'Accessories', createdAt: new Date().toISOString() }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'pb-001',
    name: 'OBSIDIAN BOMBER JACKET',
    description: 'Engineered for transitional climates, the Obsidian Bomber Jacket redefines a classic silhouette through a lens of refined minimalism. Constructed from a high-density, water-repellent technical shell, it features architectural seam lines and custom matte hardware. The fit is intentionally boxy yet structured.',
    category: 'outerwear',
    price: 450,
    discountPrice: 395,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['#0A0A0A', '#EAEAEA', '#5C6B73'], // Jet Black, Optic White, Stone Grey
    colorName: 'Jet Black',
    stock: 12,
    images: [
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop'
    ],
    featured: true,
    createdAt: '2026-05-10T10:00:00.000Z'
  },
  {
    id: 'pb-002',
    name: 'HEAVYWEIGHT HOODIE',
    description: 'A structural staple. Built from 450gsm organic cotton loopback, this hoodie maintains its rigid boxy form while remaining exceptionally soft. Featuring dropped shoulders, kangaroo-pocket removal for clean lines, and double-layered hood detailing.',
    category: 'tops',
    price: 185,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['#121212', '#333333', '#666666'], // Black / Core, Charcoal, Heather Gray
    colorName: 'Black / Core',
    stock: 42,
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=600&auto=format&fit=crop'
    ],
    featured: true,
    createdAt: '2026-05-11T11:00:00.000Z'
  },
  {
    id: 'pb-003',
    name: 'POPLIN OVERSHIRT',
    description: 'An architectural top layer designed with an oversized fit. Made from crisp Italian cotton poplin, with a structured pointing collar, concealed button placket, and exaggerated cuffs. Perfect for formal and street utility.',
    category: 'tops',
    price: 140,
    sizes: ['S', 'M', 'L'],
    colors: ['#FFFFFF', '#D2D7DF'], // Optic White, Slate Blue
    colorName: 'Optic White',
    stock: 28,
    images: [
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=600&auto=format&fit=crop'
    ],
    featured: true,
    createdAt: '2026-05-12T12:00:00.000Z'
  },
  {
    id: 'pb-004',
    name: 'ARCHITECT TROUSERS',
    description: 'Precision tailored for fluid movement. Crafted from medium-weight wool blend drapery, these high-rise trousers feature single front pleats, hidden side-seam zip adjusters, and a relaxed wide-leg profile that breaks perfectly over sneakers or boots.',
    category: 'bottoms',
    price: 210,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['#2F3E46', '#1A1C1C'], // Charcoal, Black
    colorName: 'Charcoal',
    stock: 18,
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=600&auto=format&fit=crop'
    ],
    featured: false,
    createdAt: '2026-05-13T13:00:00.000Z'
  },
  {
    id: 'pb-005',
    name: 'ESSENTIAL TEE',
    description: 'Our highest-frequency garment. Spun from long-staple Egyptian cotton with a medium weight of 240gsm. Features a perfect tight rib collar that won’t stretch over time, side slits, and a slightly cropped hem for optimal layering.',
    category: 'tops',
    price: 65,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['#7D82B8', '#FFFFFF', '#1A1C1C'], // Heather Grey, White, Dark Charcoal
    colorName: 'Heather Grey',
    stock: 65,
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop'
    ],
    featured: true,
    createdAt: '2026-05-14T14:00:00.000Z'
  },
  {
    id: 'pb-006',
    name: 'FLIGHT JACKET',
    description: 'A high-concept pilot jacket with utility sleeve-zip compartments and refined heavy industrial double zippers. Satin nylon face fabric treated with non-fluorinated DWR finish to keep you protected from mild weather while keeping a polished silhouette.',
    category: 'outerwear',
    price: 345,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['#121212', '#1B263B'], // Matte Black, Navy
    colorName: 'Matte Black',
    stock: 8,
    images: [
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=600&auto=format&fit=crop'
    ],
    featured: false,
    createdAt: '2026-05-15T15:00:00.000Z'
  },
  {
    id: 'pb-007',
    name: 'PLATFORM DERBY',
    description: 'Minimalist dress shoe constructed in exquisite full-grain calfskin leather. Mounted on a lightweight, structural custom-molded EVA platform outsole. Finished with blind eyelets and waxed cotton laces.',
    category: 'accessories',
    price: 420,
    sizes: ['M', 'L'], // shoe equivalent sizes
    colors: ['#000000'],
    colorName: 'Calfskin Black',
    stock: 4,
    images: [
      'https://images.unsplash.com/photo-1614252369475-531eba835eb1?q=80&w=600&auto=format&fit=crop'
    ],
    featured: true,
    createdAt: '2026-05-16T16:00:00.000Z'
  },
  {
    id: 'pb-008',
    name: 'TECHNICAL TRENCH COAT',
    description: 'Uncompromising protective design. Featuring a three-layer nylon membrane that is fully windproof and highly breathable. Raglan sleeve layout, storm-flap yoke design, magnetic closure cuffs, and double-breasted clean utility layout.',
    category: 'outerwear',
    price: 450,
    sizes: ['S', 'M', 'L'],
    colors: ['#DDA15E', '#111111'], // Camel, Black
    colorName: 'Architect Tan',
    stock: 5,
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop'
    ],
    featured: true,
    createdAt: '2026-05-17T17:00:00.000Z'
  },
  {
    id: 'pb-009',
    name: 'STRUCTURED CARGO PANT',
    description: 'Functional utility refined. Featuring internal layout low-profile 3D thigh compartments, articulation panels on the knees for comfort and active use, and adjustable hems to transition from wide straight leg to tapered cuffing.',
    category: 'bottoms',
    price: 180,
    sizes: ['S', 'M', 'L'],
    colors: ['#4F5D75', '#1D2A44'], // Gunmetal, Dark Navy
    colorName: 'Gunmetal Gray',
    stock: 15,
    images: [
      'https://images.unsplash.com/photo-1517423568366-8b83523034fd?q=80&w=600&auto=format&fit=crop'
    ],
    featured: true,
    createdAt: '2026-05-18T18:00:00.000Z'
  },
  {
    id: 'pb-010',
    name: 'UTILITY CROSSBODY',
    description: 'High-density ballistic nylon cross-body messenger bag with an adjustable premium security belt webbing strap, rapid magnetic Cobra-inspired buckle closure, and internal laptop/phone organizers.',
    category: 'accessories',
    price: 420,
    sizes: ['O/S'],
    colors: ['#121212'],
    colorName: 'Studio Charcoal',
    stock: 22,
    images: [
      'https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=600&auto=format&fit=crop'
    ],
    featured: false,
    createdAt: '2026-05-19T19:00:00.000Z'
  }
];
