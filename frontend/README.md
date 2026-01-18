# Property Rental Platform - Frontend

A modern React + TypeScript frontend for the Property Rental Platform, built with Vite, Tailwind CSS, and React Router.

## Features

- **Authentication**: Login, Register with role-based access
- **Property Browsing**: Search, filter, and view property details
- **Booking System**: Create bookings with availability checking
- **Owner Dashboard**: Manage properties and respond to booking requests
- **Customer Dashboard**: View and manage bookings
- **Admin Dashboard**: Approve properties, manage users, view analytics
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Axios** for API calls
- **React Hook Form** for form handling
- **React Hot Toast** for notifications
- **Tailwind CSS** for styling
- **date-fns** for date formatting

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on `http://localhost:8000`

### Installation

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

3. **Build for production**
   ```bash
   npm run build
   ```

4. **Preview production build**
   ```bash
   npm run preview
   ```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/        # React Context providers
│   │   └── AuthContext.tsx
│   ├── pages/           # Page components
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Properties.tsx
│   │   ├── PropertyDetail.tsx
│   │   ├── OwnerDashboard.tsx
│   │   ├── CustomerDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── CreateProperty.tsx
│   │   └── EditProperty.tsx
│   ├── services/        # API service layer
│   │   └── api.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## API Integration

The frontend communicates with the backend API through the `api` service (`src/services/api.ts`). The API client:

- Automatically adds JWT tokens to requests
- Handles token refresh on 401 errors
- Shows error toasts for failed requests
- Provides type-safe API methods

## Authentication Flow

1. User registers/logs in → Receives JWT tokens
2. Tokens stored in localStorage
3. AuthContext manages user state
4. Protected routes check authentication and role

## Routing

- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/properties` - Browse properties
- `/properties/:id` - Property details
- `/owner/dashboard` - Owner dashboard (protected)
- `/owner/properties/new` - Create property (protected)
- `/owner/properties/:id/edit` - Edit property (protected)
- `/customer/dashboard` - Customer bookings (protected)
- `/admin/dashboard` - Admin dashboard (protected)

## Environment Variables

The frontend uses a proxy configuration in `vite.config.ts` to forward `/api` requests to the backend. For production, update the proxy target or use environment variables.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript strict mode enabled
- ESLint configured for React
- Prettier recommended (not included, but recommended)

## Features in Detail

### Property Browsing
- Search by title, description, location
- Filter by city, country, property type, price range, capacity
- Pagination support
- Responsive grid layout

### Booking System
- Real-time availability checking
- Date validation
- Guest capacity validation
- Booking status management

### Owner Features
- Create and edit properties
- Upload property images
- View booking requests
- Approve/reject bookings

### Customer Features
- Browse and search properties
- View property details
- Create booking requests
- Cancel bookings
- View booking history

### Admin Features
- Approve/reject properties
- Activate/deactivate users
- View platform analytics
- Monitor all bookings

## Known Limitations

- Image upload UI not fully implemented (backend ready)
- No real-time updates (would require WebSockets)
- No payment integration UI
- No email notifications UI

## Future Enhancements

- Image upload component
- Property image gallery
- Booking calendar view
- Advanced search with maps
- Wishlist/favorites
- Reviews and ratings
- Real-time notifications
- Payment integration UI
