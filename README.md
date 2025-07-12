# Skill Swap Platform

A modern web application that enables users to list their skills and request others in return. Built with React, TypeScript, Node.js, and SQLite.

## Features

### Core Features
- **User Authentication**: Register, login, and profile management
- **Skill Management**: List skills you offer and skills you want to learn
- **User Browsing**: Search and browse other users by skills or location
- **Swap Requests**: Create, accept, reject, and cancel skill swap requests
- **Rating System**: Rate users after completed swaps
- **Privacy Controls**: Make profiles public or private

### Admin Features
- **User Management**: View all users, ban/unban users
- **Content Moderation**: Delete inappropriate skills
- **Platform Statistics**: View comprehensive platform metrics
- **Swap Monitoring**: Monitor all swap requests and their status

## Tech Stack

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **SQLite** database (easily migratable to PostgreSQL/MySQL)
- **JWT** authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Hook Form** for form handling
- **Axios** for API calls
- **React Hot Toast** for notifications

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sri11223/swap-skill.git
   cd swap-skill
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5000) and frontend development server (port 3000).

### Default Admin Account
- **Email**: admin@skillswap.com
- **Password**: admin123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Users
- `GET /api/users/browse` - Browse public users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/me/swaps` - Get user's swap requests

### Skills
- `GET /api/skills/me` - Get current user's skills
- `POST /api/skills` - Create new skill
- `PUT /api/skills/:id` - Update skill
- `DELETE /api/skills/:id` - Delete skill
- `GET /api/skills/search` - Search skills

### Swaps
- `POST /api/swaps` - Create swap request
- `GET /api/swaps/:id` - Get swap request details
- `PUT /api/swaps/:id/status` - Update swap status
- `DELETE /api/swaps/:id` - Delete swap request
- `POST /api/swaps/:id/rate` - Rate completed swap

### Admin (Admin only)
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/ban` - Ban/unban user
- `GET /api/admin/swaps` - Get all swap requests
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/ratings` - Get all ratings
- `DELETE /api/admin/skills/:id` - Delete inappropriate skill

## Database Schema

### Users
- id, email, password, name, location, profilePhoto, isPublic, availability, role, createdAt, updatedAt

### Skills
- id, userId, name, description, type (offered/wanted), level (beginner/intermediate/advanced), createdAt, updatedAt

### Swap Requests
- id, fromUserId, toUserId, offeredSkillId, wantedSkillId, message, status, createdAt, updatedAt

### Ratings
- id, swapId, fromUserId, toUserId, rating, comment, createdAt

## Project Structure

```
swap-skill/
├── server/                 # Backend Node.js application
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Authentication middleware
│   │   ├── database/      # Database initialization
│   │   └── types/         # TypeScript type definitions
│   ├── data/              # SQLite database files
│   └── package.json
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API service functions
│   │   └── types/         # TypeScript type definitions
│   └── package.json
└── package.json           # Root package.json for scripts
```

## Development

### Backend Development
```bash
cd server
npm run dev
```

### Frontend Development
```bash
cd client
npm start
```

### Building for Production
```bash
# Build frontend
cd client
npm run build

# Build backend
cd server
npm run build
```

## Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5000
JWT_SECRET=your-secret-key-here
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the development team. 