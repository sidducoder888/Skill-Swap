# Skill Swap Platform

> A modern, secure, and scalable platform for users to exchange skills and knowledge.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)

## 🚀 Features

### Core Features
- **User Authentication**: Secure JWT-based authentication with bcrypt
- **Skill Management**: List skills you offer and skills you want to learn
- **User Discovery**: Search and browse users by skills, location, or expertise level
- **Swap Requests**: Create, accept, reject, and manage skill exchange requests
- **Rating System**: Rate and review users after completed skill swaps
- **Privacy Controls**: Comprehensive privacy settings for user profiles
- **Real-time Notifications**: Get notified about swap requests and updates

### Admin Features
- **User Management**: Comprehensive user administration panel
- **Content Moderation**: Moderate inappropriate content and skills
- **Platform Analytics**: Detailed statistics and usage metrics
- **Swap Monitoring**: Monitor all platform activities and transactions
- **Security Dashboard**: Security logs and threat monitoring

### Enhanced Security & Performance
- ✅ **Security**: Helmet, Rate limiting, CORS protection, Input validation
- ✅ **Monitoring**: Health checks, structured logging, error tracking
- ✅ **Performance**: Compression, caching, optimized database queries
- ✅ **Development**: Hot reload, linting, type checking, automated testing

## 🏗️ Architecture

### Backend Stack
- **Node.js** with Express framework
- **TypeScript** for type safety
- **SQLite** database (production-ready, no separate installation)
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **Rate limiting** for API protection

### Frontend Stack
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **Axios** for API communication
- **React Hot Toast** for notifications

### DevOps & Deployment
- **Docker** containerization with multi-stage builds
- **Docker Compose** for development and production
- **Makefile** for common tasks
- **Health checks** and monitoring
- **Security hardening** with non-root containers

## 🐳 Quick Start (Recommended: Docker)

### Prerequisites
- Docker and Docker Compose
- Make (optional, for convenience commands)

### 1. Clone and Start
```bash
git clone https://github.com/your-username/skill-swap-platform.git
cd skill-swap-platform

# Build and start production environment
make build
make start

# Or manually:
docker-compose up -d --build
```

### 2. Access the Application
- **Application**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin
- **Health Check**: http://localhost:5000/api/health

### 3. Default Admin Account
- **Email**: admin@skillswap.com
- **Password**: admin123

## 💻 Development Setup

### Option A: Docker Development (Recommended)
```bash
# Start development environment
make dev-docker

# View logs
make logs-dev

# Access services:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:5000
# - Database Admin: http://localhost:8080
```

### Option B: Traditional Development
```bash
# Install dependencies
make install

# Start development servers
make dev

# Access services:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:5000
```

## 📋 Available Commands

Run `make help` to see all available commands:

```bash
# Essential commands
make install        # Install dependencies
make dev           # Start development servers
make dev-docker    # Start development with Docker
make build         # Build production image
make start         # Start production environment
make stop          # Stop all services
make logs          # View logs
make test          # Run tests
make lint          # Run linting
make clean         # Clean up Docker resources
make health        # Check application health
make backup        # Backup database
```

## 🔧 Configuration

### Environment Variables

#### Server Configuration (.env)
```bash
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_PATH=./data/skillswap.db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL=http://localhost:3000

# Security
BCRYPT_SALT_ROUNDS=12
```

#### Client Configuration
```bash
# React environment variables
REACT_APP_API_URL=http://localhost:5000
```

## 🛡️ Security Features

### Authentication & Authorization
- JWT-based authentication
- Secure password hashing with bcrypt
- Role-based access control (User/Admin)
- Session management

### API Security
- Rate limiting (100 requests per 15 minutes)
- Authentication rate limiting (5 attempts per 15 minutes)
- Input validation and sanitization
- CORS protection
- Helmet security headers

### Data Protection
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure file uploads
- Data encryption at rest

## 📊 API Documentation

### Authentication Endpoints
```bash
POST /api/auth/register    # Register new user
POST /api/auth/login       # Login user
GET  /api/auth/me         # Get current user
PUT  /api/auth/profile    # Update profile
```

### User Management
```bash
GET  /api/users/browse    # Browse public users
GET  /api/users/:id       # Get user profile
GET  /api/users/me/swaps  # Get user's swaps
```

### Skill Management
```bash
GET    /api/skills/me     # Get current user's skills
POST   /api/skills        # Create new skill
PUT    /api/skills/:id    # Update skill
DELETE /api/skills/:id    # Delete skill
GET    /api/skills/search # Search skills
```

### Swap Requests
```bash
POST   /api/swaps         # Create swap request
GET    /api/swaps/:id     # Get swap details
PUT    /api/swaps/:id/status # Update swap status
DELETE /api/swaps/:id     # Delete swap request
POST   /api/swaps/:id/rate   # Rate completed swap
```

### Admin Panel
```bash
GET    /api/admin/users   # Get all users
PUT    /api/admin/users/:id/ban # Ban/unban user
GET    /api/admin/swaps   # Get all swaps
GET    /api/admin/stats   # Get platform statistics
DELETE /api/admin/skills/:id # Delete inappropriate skill
```

## 🗄️ Database Schema

### Users Table
- Authentication and profile information
- Privacy settings and availability
- Role-based permissions

### Skills Table
- Skill offerings and requests
- Skill levels and descriptions
- User associations

### Swap Requests Table
- Request details and status
- User relationships
- Timestamps and metadata

### Ratings Table
- User ratings and reviews
- Swap completion feedback
- Quality metrics

## 🚀 Deployment

### Production Deployment with Docker
```bash
# Build production image
make build

# Start production environment
make start

# Check status
make status

# View logs
make logs
```

### Environment-Specific Configurations
```bash
# Production
NODE_ENV=production
DATABASE_PATH=/app/data/skillswap.db

# Development
NODE_ENV=development
DATABASE_PATH=./data/skillswap.db
```

## 🔍 Monitoring & Health Checks

### Health Endpoint
```bash
GET /api/health
```

Response:
```json
{
  "status": "OK",
  "message": "Skill Swap Platform API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### Logging
- Structured logging with Morgan
- Error tracking and reporting
- Performance monitoring
- Security event logging

## 📈 Performance Optimization

### Backend Optimizations
- Response compression
- Database query optimization
- Caching strategies
- Rate limiting

### Frontend Optimizations
- Code splitting
- Lazy loading
- Asset optimization
- Progressive Web App features

## 🧪 Testing

### Running Tests
```bash
# Run all tests
make test

# Run with coverage
make test-coverage

# Run specific test suites
cd server && npm test
cd client && npm test
```

### Test Coverage
- Unit tests for API endpoints
- Integration tests for user flows
- Frontend component tests
- End-to-end testing

## 🔄 Development Workflow

### Code Quality
```bash
# Lint code
make lint

# Fix linting issues
make lint-fix

# Type checking
cd server && npm run type-check
```

### Security Auditing
```bash
# Security audit
make security-audit

# Fix security issues
make security-fix
```

## 🆚 Docker vs Traditional Installation

### Docker Advantages
- ✅ Environment consistency
- ✅ Easy deployment
- ✅ Scalability
- ✅ Production-ready
- ✅ Isolation

### Traditional Installation Advantages
- ✅ Direct system access
- ✅ Native performance
- ✅ Easier debugging
- ✅ Lower resource usage

**Recommendation**: Use Docker for production and team development. Use traditional installation for solo development or resource-constrained environments.

## 📚 Documentation

- [Deployment Report](./DEPLOYMENT_REPORT.md) - Comprehensive deployment analysis
- [API Documentation](./docs/api.md) - Detailed API reference
- [Security Guide](./docs/security.md) - Security best practices
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

#### Docker Issues
```bash
# Clean Docker resources
make clean

# Rebuild containers
make build
```

#### Database Issues
```bash
# Reset database (development only)
make db-reset

# Backup database
make backup
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React and Node.js communities
- Docker and containerization ecosystem
- Open source contributors
- Security research community

## 📞 Support

- Create an issue for bug reports
- Join our community discussions
- Check the documentation
- Contact the development team

---

**Built with ❤️ by the Skill Swap Team** 