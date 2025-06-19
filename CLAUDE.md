# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev`: Start development server with Turbopack
- `npm run build`: Build the application for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint to check code quality

## Architecture Overview

This is a Musinsa-style e-commerce application built with Next.js 15, featuring a complete shopping mall with product browsing and detail views.

### Project Structure
```
src/
├── app/
│   ├── layout.tsx                 # Root layout with Header + CategoryNav
│   ├── page.tsx                   # Main shop page with product grid
│   └── product/[id]/page.tsx      # Product detail page
├── components/
│   ├── ui/                        # Reusable UI components (Button, Badge, SearchBar)
│   ├── shop/                      # Shopping-specific components (ProductCard, ProductGrid, CategoryNav)
│   └── layout/                    # Layout components (Header, MainLayout)
├── store/                         # Zustand stores
│   ├── useProductStore.ts         # Product data, filtering, search
│   ├── useCartStore.ts            # Shopping cart with persistence
│   └── useUserStore.ts            # User preferences, wishlist, recently viewed
├── types/                         # TypeScript definitions
├── data/                          # Mock data (products, categories, brands)
└── lib/                          # Utilities (cn, formatPrice, etc.)
```

### Key Features
- **Product Catalog**: Grid view with filtering, sorting, and search
- **Product Details**: Image gallery, size/color selection, add to cart
- **Shopping Cart**: Persistent cart with Zustand + localStorage
- **User Features**: Wishlist, recently viewed products
- **Responsive Design**: Mobile-first with Tailwind CSS

### State Management (Zustand)
- **ProductStore**: Manages product data, filters, search, and sorting
- **CartStore**: Handles cart items with persistence using zustand/middleware
- **UserStore**: User preferences, wishlist, and recently viewed items

### Technology Stack
- **Next.js 15**: App Router with TypeScript
- **React 19**: Latest React with strict mode
- **Zustand**: Lightweight state management with persistence
- **Tailwind CSS v4**: Utility-first styling with custom plugins
- **React Toastify**: Toast notifications

### Component Guidelines
- **UI Components**: Generic, reusable components in `components/ui/`
- **Shop Components**: Business logic components in `components/shop/`
- **Styling**: Use Tailwind classes with `cn()` utility for conditional styling
- **State**: Access stores via hooks, update state through store actions

### Development Notes
- All components use TypeScript with strict typing
- Product images use Next.js Image component with proper sizing
- Mock data includes Korean product names and brands
- Responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop