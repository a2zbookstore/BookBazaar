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
- June 15, 2025. Fixed order status update 401 authentication error - removed duplicate PUT /api/orders/:id/status route that was using Replit authentication and causing conflicts, kept only the admin session authenticated route for proper order management functionality. Order updates now working perfectly with admin authentication.
- June 15, 2025. Implemented comprehensive return and refund management system - added complete database schema for return requests and refund transactions with 15-day return policy, created customer-facing return request page allowing users to submit returns with valid reasons, built admin interface for managing return approvals/rejections and processing refunds, integrated with existing authentication systems (both customer and admin sessions), added navigation links in main layout and admin panel for easy access to return functionality.
- June 15, 2025. Updated return policy display across all book pages - changed from 30-day to 15-day return policy, added prominent return policy sections on individual book detail pages with green highlighting and direct links to return request form, enhanced book browsing cards with "15-day returns" badges for immediate customer visibility.
- June 15, 2025. Fixed critical payment and order completion issues - resolved Razorpay payment verification by fixing crypto import and signature validation, made orders table userId nullable to support guest checkout, fixed order completion by properly fetching cart items from database/session for both authenticated and guest users, payment verification now works correctly with proper amount deduction and order creation.
- June 15, 2025. Enhanced admin panel with complete invoice functionality - added invoice generation, download, and print capabilities for all orders in admin panel, implemented both quick action buttons on order list and detailed invoice options in order management dialog, integrated professional invoice template with A2Z BOOKSHOP branding, customer details, order items, and tracking information.
- June 15, 2025. Implemented real-time pending orders counter in admin dashboard - added clickable pending orders card showing live count of pending orders with 30-second auto-refresh, Process Orders button for immediate action, navigation to orders page with automatic pending filter, visual indicators with yellow color coding for urgency, complete order management workflow from dashboard to processing.
- June 15, 2025. Created complete website download package - generated production-ready archive (a2z-bookshop-complete-final.tar.gz, 13.55 MB) containing entire A2Z BOOKSHOP codebase with all features, excluded development files, included installation instructions, ready for deployment on custom domain a2zbookshop.com or any platform.
- June 15, 2025. Implemented intelligent Excel book import system - created BookImporter.ts with automatic ISBN-based cover image fetching from Google Books API and Open Library, automatic author and publisher information extraction, successfully imported 7 books from user's Excel file (131 total entries) with complete metadata including titles, authors, ISBNs, publication details, and downloaded cover images.
- June 15, 2025. Enhanced book detail pages with comprehensive condition and binding display - added prominent condition and binding badges in the overview section, detailed condition and binding information in the book specifications grid, both book catalog cards and individual book pages now clearly show book condition (New, Like New, Very Good, Good, Fair) and binding type (Hardcover, Softcover, No Binding) for better customer information.
- June 15, 2025. Implemented comprehensive email notification system with Zoho Mail SMTP integration - created professional order confirmation emails sent to customers and admin copy to orders@a2zbookshop.com, automated status update emails when admin changes order status, complete HTML email templates with A2Z BOOKSHOP branding and mobile-responsive design, integrated into order completion and status update workflows with error handling to prevent order failures if email sending fails.
- June 16, 2025. Enhanced inventory management with additional book metadata fields - added Edition field for book versions (e.g., "1st Edition"), changed weight unit from kg to lbs, updated dimensions to use inches format, added bestseller checkbox option alongside featured book toggle, updated database schema and admin interface to support comprehensive book cataloging with improved units for international bookstore operations.
- June 16, 2025. Implemented comprehensive mobile optimization for Android and iOS compatibility - added mobile navigation with hamburger menu and cart icon, mobile-responsive search bar, touch-friendly form inputs with 44px minimum height to prevent iOS zoom, responsive book grid layouts (1 column on mobile, 2 on tablet, 3 on desktop), mobile-optimized carousel sections, enhanced checkout form with flexible phone country selector, mobile-specific CSS classes for better touch interactions, proper viewport meta tags for mobile web app capabilities, and consistent mobile button styling across all pages for optimal mobile user experience.
- June 16, 2025. Implemented complete wishlist heart animation feature with red heart filling - created WishlistHeart component with smooth scaling animations and particle effects, added wishlist API routes for add/remove/check functionality, integrated heart icons into all book cards with proper positioning in top-right corner, built comprehensive WishlistPage with remove functionality, added wishlist navigation links to both desktop and mobile menus with real-time counter badges, hearts turn red when clicked and stay red until removed, clicking same heart again removes from wishlist, header shows live wishlist count that updates instantly when books are added/removed.
- June 16, 2025. Enhanced carousel sections with hover-to-pause functionality - added hover event handlers to both bestseller and featured book carousels on homepage, carousel movement automatically pauses when mouse hovers over any book in the moving sections, resumes auto-scroll when mouse leaves the carousel area, provides better user experience for browsing moving book collections without interruption from automatic animations.
- June 16, 2025. Fixed critical mobile compatibility issues - updated viewport meta tags to prevent horizontal scrolling, added comprehensive mobile CSS fixes for proper header layout, container spacing, and responsive design, fixed overflow issues causing horizontal scroll on mobile devices, ensured all grid layouts collapse to single column on mobile, improved touch targets and button spacing, added mobile-specific padding and margin adjustments for better mobile browsing experience across Android and iOS devices.
- June 16, 2025. Enhanced homepage "About" section with authentic book imagery - replaced generic images with beautiful book-related photos including vintage book stacks, open book with reading glasses, and colorful bookstore shelves, creating more authentic atmosphere that better represents A2Z BOOKSHOP's literary focus and bookstore environment.
- June 16, 2025. Replaced all website imagery with professional book-only photography - updated hero section background images, About section photos, and category display images throughout homepage to use carefully selected book photography from Unsplash showing only books, bookshelves, and literary objects without any human figures, creating proper bookstore atmosphere while ensuring no people are visible anywhere on the website.
- June 16, 2025. Implemented frozen/sticky header functionality - added scroll detection with dynamic shadow effects, backdrop blur, and smooth height transitions when scrolling down, header remains fixed at top with enhanced visual styling including semi-transparent background and responsive height changes for better user navigation experience.
- June 16, 2025. Enhanced header search bar with expanded horizontal width - increased search bar from max-w-2xl to max-w-4xl for better usability, adjusted navigation spacing and button margins for improved layout balance, maintained responsive design across all screen sizes.
- June 16, 2025. Created comprehensive footer policy pages - built detailed Shipping Info, Return Policy, FAQ, and Privacy Policy pages with authentic bookstore content, added proper routing and navigation links, included professional layouts with cards, collapsible sections, and detailed information covering all aspects of online bookstore operations from shipping rates to GDPR compliance.
- June 16, 2025. Fixed store settings authentication and dynamic contact information display - resolved 401 errors in admin panel store settings by updating API routes to use admin session authentication, created public /api/store-info endpoint for guest access, updated contact page to display dynamic store information (address, phone, email) from admin panel instead of hardcoded values.
- June 17, 2025. Enhanced location-based currency display system - added prominent currency indicator in header showing user's local currency (₹ INR for India, € EUR for Europe, etc.), improved country-to-currency mapping for 50+ countries, added "Your Currency" badges on converted prices, implemented mobile-responsive currency display in navigation menu, all prices now automatically convert from USD to user's local currency based on detected location with real-time exchange rates.
- June 17, 2025. Implemented interactive country selector for manual location override - created comprehensive dropdown with 20+ popular countries (US 🇺🇸, India 🇮🇳, UK 🇬🇧, Germany 🇩🇪, etc.), users can now manually select any country to instantly update currency, shipping rates, and localized pricing, includes flag emojis and currency symbols, mobile-responsive design, persistent localStorage selection, integrates with existing currency conversion and shipping rate systems for complete international shopping experience.
- June 17, 2025. Added comprehensive cancellation policy page to footer - created detailed cancellation policy with time-based windows (free cancellation within 2 hours, 5% fee for 2-24 hours, case-by-case after 24 hours), integrated order status eligibility system, payment method-specific refund timelines, multiple customer service contact options, and professional layout with visual indicators for different cancellation scenarios, accessible via footer Customer Service section.
- June 18, 2025. Enhanced SMTP configuration with comprehensive email service setup - improved Zoho Mail SMTP connection with optimized timeouts, connection verification, debug logging, added admin panel SMTP test functionality with real-time verification, enhanced email templates for order confirmations and status updates, implemented professional HTML email design with A2Z BOOKSHOP branding, automatic error handling and graceful fallback for reliable email delivery.
- June 18, 2025. Configured production SMTP with user's Zoho Mail credentials - updated email service to use orders@a2zbookshop.com via smtp.zoho.com:587 (TLS), implemented App Password authentication with graceful error handling, SMTP authentication requires domain verification in Zoho Mail, orders and status updates continue to work even if email fails, added comprehensive troubleshooting guidance in admin panel for SMTP configuration issues, system prioritizes order completion over email delivery.
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```