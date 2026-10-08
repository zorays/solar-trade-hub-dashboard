# Solar Trade Hub Dashboard

The **Solar Trade Hub Dashboard** is the internal administration and marketplace operations panel for Solar Trade Hub.

It is used to manage the Solar Trade Hub marketplace, suppliers, installers, customers, products, tenders, orders, payments, deals, content, reports, roles, permissions, settings, and marketplace workflows from one authenticated interface.

The dashboard is built with **React 19, TypeScript, Vite, and Tailwind CSS v4** and connects to the Solar Trade Hub production backend through the API.

## Production URLs

- Storefront: https://solartradehub.co
- Admin Dashboard: https://admin.solartradehub.co
- Backend API: https://server.solartradehub.co
- API Base URL: https://server.solartradehub.co/api/v1
- Backend Health Check: https://server.solartradehub.co/health

## Core Features

### Authentication and Access Control

- Secure sign in and sign up
- Email verification
- Forgot password and password reset
- Protected dashboard routes
- Role-based access control
- Permission-based route protection
- Admin-only areas
- User profile management

### Dashboard

- Central marketplace administration
- Operational overview
- Permission-aware navigation
- Responsive desktop and mobile layout

### Products

Solar Trade Hub uses an external product catalogue as the master product source.

The dashboard can:

- Read products from the external catalogue
- View product details
- Filter and search products
- Work with marketplace-enabled products
- Manage supplier access to eligible products

Product master data is not created or edited directly from the dashboard.

### Customers

- View customer records
- Administrative customer management
- Customer account oversight

### Suppliers

- Supplier listing
- Add suppliers
- View supplier profiles
- Edit supplier records
- Supplier verification
- Marketplace supplier management

### Marketplace

- Range Tokens
- Customer Requests
- Supplier Bids
- Supplier Subscriptions
- Marketplace Plans and Features

Solar Trade Hub uses **Range Tokens** rather than coupon-based discounts.

### Installers

- Installer listing
- Add installers
- View installer profiles
- Edit installers
- Installer applications
- Installer verification

### Tenders

- Tender listing
- Create tenders
- View tenders
- Edit tenders

### Orders

- Order listing
- Pending orders
- Completed orders
- Order detail view

### Payments

- Payment listing
- Pending payments
- Manual payment verification

### Deals

- Deal listing
- Create marketplace deals
- View deals
- Edit deals
- Product-linked promotional pricing
- Scheduled, active, draft, and expired deal workflows

### Users, Roles, and Permissions

- User listing
- View users
- Edit users
- Role management
- Permission management
- Permission-aware routes

### Content Management

- Homepage content
- Banners
- Pages

### Reports

- Marketplace reports
- User reports
- Order reports

### Settings

- General settings
- Marketplace settings
- Email settings

### Notifications and Support

- Notifications
- Help and support

## Technology Stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS v4
- React Router
- Axios
- Lucide React
- Sonner
- ApexCharts
- FullCalendar
- React Dropzone
- Swiper

## Project Structure

```text
solar-trade-hub-dashboard/
├── public/
├── src/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── icons/
│   ├── layout/
│   ├── pages/
│   ├── services/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.production
├── package.json
├── tsconfig.json
└── vite.config.ts