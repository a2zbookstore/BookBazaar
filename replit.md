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
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```