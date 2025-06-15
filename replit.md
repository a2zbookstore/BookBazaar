# A2Z BOOKSHOP - Online Bookstore Application

## Overview

A2Z BOOKSHOP is a full-stack web application for an online bookstore built with React, Express.js, and PostgreSQL. The application provides a complete e-commerce experience for buying books, with both customer-facing features and admin management capabilities. It uses modern web technologies including TypeScript, shadcn/ui components, and Drizzle ORM for database operations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom color scheme matching AbeBooks aesthetic
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express session with PostgreSQL store
- **API Design**: RESTful API endpoints with proper error handling
- **Middleware**: Custom logging, JSON parsing, and authentication middleware

### Database Architecture
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Data Modeling**: Relational design with proper foreign key constraints

## Key Components

### Database Schema
- **Users**: Replit Auth integration with roles (customer/admin)
- **Books**: Complete book catalog with metadata, pricing, and inventory
- **Categories**: Hierarchical book categorization
- **Cart Items**: User shopping cart management
- **Orders**: Complete order processing with status tracking
- **Order Items**: Detailed order line items
- **Contact Messages**: Customer support messaging system
- **Sessions**: Secure session storage for authentication

### Authentication System
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with 1-week TTL
- **Role-based Access**: Admin and customer role separation
- **Security**: HTTP-only cookies with secure flags in production

### E-commerce Features
- **Product Catalog**: Searchable book listings with filtering and pagination
- **Shopping Cart**: Real-time cart management with quantity updates
- **Order Management**: Complete checkout process with status tracking
- **Inventory Control**: Stock management with low-stock alerts
- **Admin Dashboard**: Comprehensive admin interface for store management

### UI/UX Design
- **Design System**: Custom implementation of shadcn/ui with AbeBooks color scheme
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: ARIA labels and keyboard navigation support
- **User Experience**: Toast notifications, loading states, and error handling

## Data Flow

1. **User Authentication**: Replit Auth handles user login/logout with session persistence
2. **Data Fetching**: React Query manages API calls with caching and synchronization
3. **State Management**: Server state cached by React Query, UI state managed by React hooks
4. **Database Operations**: Drizzle ORM provides type-safe database queries
5. **Real-time Updates**: Optimistic updates with automatic cache invalidation

## External Dependencies

### Frontend Dependencies
- React ecosystem (React, React DOM, React Query)
- UI components (Radix UI primitives, shadcn/ui)
- Utilities (clsx, date-fns, zod for validation)
- Icons (Lucide React)
- Charts (Recharts for admin analytics)

### Backend Dependencies
- Express.js ecosystem (express, session management)
- Database (Drizzle ORM, Neon PostgreSQL driver)
- Authentication (OpenID Client, Passport.js)
- Utilities (memoizee for caching)

### Development Dependencies
- TypeScript for type safety
- Vite for fast development and optimized builds
- ESBuild for server-side bundling
- TSX for TypeScript execution

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20
- **Database**: PostgreSQL 16 via Replit
- **Hot Reload**: Vite dev server with HMR
- **Process Management**: tsx for TypeScript execution

### Production Build
- **Frontend**: Vite build with optimized bundles
- **Backend**: ESBuild bundling for Node.js deployment
- **Static Assets**: Served from dist/public directory
- **Environment**: Production mode with security optimizations

### Replit Configuration
- **Modules**: nodejs-20, web, postgresql-16
- **Port Mapping**: Internal port 5000 mapped to external port 80
- **Auto-scaling**: Configured for autoscale deployment target
- **Build Process**: npm run build for production deployment

## Changelog

```
Changelog:
- June 14, 2025. Initial setup
- June 14, 2025. Completed separate admin authentication system with database table, login/logout endpoints, session management, and web-based account management interface
- June 15, 2025. Implemented complete customer registration and login system with email authentication, password hashing, session management, and updated navigation
- June 15, 2025. Added comprehensive guest checkout system - users can browse, add to cart, and complete orders without registration, with optional account creation during checkout
- June 15, 2025. Fixed cart access requirements - removed login barriers for cart functionality, implemented server-side session cart storage for all users, and added cart transfer functionality when guests log in
- June 15, 2025. Integrated dynamic shipping rates throughout application - cart and checkout now use actual shipping rates from admin-configured shipping module instead of hardcoded values, removed guest authentication barrier from checkout page
- June 15, 2025. Fixed payment amount display issues - corrected PayPal and Razorpay payment calculations to show actual cart totals instead of ₹1, added USD to INR currency conversion for Razorpay payments
- June 15, 2025. Enhanced search functionality and redesigned homepage - fixed case-sensitive search issues with proper SQL LIKE queries for title/author/ISBN/description searches, completely redesigned homepage with beautiful book-related imagery, integrated search bar in hero section, added moving carousel sections for bestsellers and featured books with auto-scroll animations
- June 15, 2025. Implemented advanced search with auto-suggestions - created SearchInput component with dropdown suggestions, added backend API endpoint for search suggestions, fixed bestsellers loading issue by correcting API response structure, customized store branding with red "2" in A2Z BOOKSHOP throughout website
- June 15, 2025. Enhanced book cards with location-based shipping - implemented dynamic shipping cost and delivery time display based on user's country location, integrated with admin-configured shipping rate module, automatic location detection with fallback to "Rest of World" rates for unconfigured countries, real-time currency conversion for shipping costs
- June 15, 2025. Implemented comprehensive checkout form validation - added email format validation with regex patterns, phone number validation with country code selector supporting 150+ countries, country dropdown with auto-suggestions and search functionality, made postal code mandatory, name validation allowing only letters/spaces/hyphens/apostrophes, real-time error messages with field highlighting
- June 15, 2025. Enhanced phone country code selector with advanced interaction - hover to open dropdown showing all countries, keyboard search without typing in field (press letters to filter), arrow key navigation, enter to select, escape to close, visual highlighting of selected items, displays both country code and full country name
- June 15, 2025. Fixed cart and checkout shipping cost integration - both pages now directly fetch shipping rates from admin panel shipping module instead of fallback calculations, India shipping rate correctly displays $35.00 as configured, eliminated incorrect shipping cost calculations throughout checkout flow
- June 15, 2025. Fixed admin panel orders module access issue - modified /api/orders, /api/orders/:id, and /api/orders/:id/status routes to support admin session authentication instead of requiring Replit authentication, updated OrdersPage component to use useAdminAuth hook instead of useAuth, admin can now access orders management without "Access Denied" errors
- June 15, 2025. Enhanced orders management with custom shipping carriers - fixed Select component empty value error, added "Other" option in shipping carrier dropdown with dynamic custom carrier input field, improved form state initialization to handle existing custom carriers, resolved order update functionality issues by implementing manual session authentication via direct cookie extraction and session store querying to bypass middleware session persistence issues
- June 15, 2025. Fixed order status update 401 authentication error - removed duplicate PUT /api/orders/:id/status route that was using Replit authentication and causing conflicts, kept only the admin session authenticated route for proper order management functionality
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```