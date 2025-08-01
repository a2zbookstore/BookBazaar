# A2Z BOOKSHOP - Online Bookstore Application

## Overview
A2Z BOOKSHOP is a full-stack web application designed for an online bookstore, offering a complete e-commerce experience for buying books. It includes both customer-facing features and comprehensive admin management capabilities. The project's vision is to provide a seamless and intuitive platform for book enthusiasts, leveraging modern web technologies to ensure a robust, scalable, and user-friendly online shopping environment.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: React Query
- **UI Library**: shadcn/ui components (built on Radix UI)
- **Styling**: Tailwind CSS with a custom color scheme inspired by AbeBooks
- **Build Tool**: Vite
- **UI/UX Decisions**: Custom shadcn/ui implementation, responsive mobile-first design, ARIA labels, keyboard navigation, toast notifications, loading states, error handling, aesthetic imagery (book-only photography), sticky header with dynamic effects, and consistent navigation button styling.

### Backend
- **Framework**: Express.js with TypeScript
- **Authentication**: Custom email/phone-based system with Replit Auth for specific admin access, session management (Express session with PostgreSQL store).
- **API Design**: RESTful APIs with error handling.
- **Middleware**: Custom logging, JSON parsing, and authentication.

### Database
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema Management**: Drizzle Kit for migrations.
- **Data Modeling**: Relational design for Users, Books, Categories, Cart Items, Orders, Order Items, Contact Messages, and Sessions.

### Key Features
- **Authentication**: Dual email/phone authentication, role-based access (customer/admin), secure session management, forgot password functionality.
- **E-commerce**: Searchable book catalog with filtering and pagination, real-time shopping cart management, complete checkout process (including guest checkout), order management, inventory control with low-stock alerts, admin dashboard.
- **Internationalization**: Location-based currency display and conversion (USD to local currency for 50+ countries), dynamic shipping cost module with IP geolocation and manual country selection, multi-currency payment processing.
- **Promotions**: "Gift with Purchase" feature with categorized gifts and automatic removal when books are absent from cart.
- **Customer Service**: Contact messaging system, comprehensive return and refund management (30-day policy), order tracking for both authenticated and guest users, email notifications (order confirmation, status updates, welcome emails).
- **Admin Capabilities**: Comprehensive book import system (with Google Books/Open Library integration), invoice generation, real-time pending orders counter, customer management, store settings.
- **Media Handling**: Permanent Cloudinary image storage with automatic optimization and default cover generation for missing images.

## External Dependencies

### Frontend
- React ecosystem (React, React DOM, React Query)
- UI components (Radix UI primitives, shadcn/ui)
- Utilities (clsx, date-fns, zod for validation)
- Icons (Lucide React)
- Charts (Recharts - for admin analytics)

### Backend
- Express.js ecosystem (express, session management)
- Database (Drizzle ORM, Neon PostgreSQL driver)
- Authentication (OpenID Client, Passport.js - for Replit Auth)
- Utilities (memoizee for caching)
- Email Service: Brevo (formerly Sendinblue) SMTP for all email notifications.
- Geolocation APIs: ipapi.co, ipinfo.io
- Payment Gateways: PayPal, Razorpay (for international payments)
- Image Storage: Cloudinary

### Development
- TypeScript
- Vite
- ESBuild
- TSX