# MarkFair Frontend

<p align="center">
  <img src="public/markfair-logo.png" alt="MarkFair Logo" width="300"/>
</p>

MarkFair Frontend Application - A Web3 Marketing Platform Connecting Brands with KOLs

## 🚀 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **Authentication**: Clerk Authentication
- **Blockchain**: Starknet React + get-starknet
- **Animation**: Framer Motion
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 📋 Features

### 🔐 Authentication & Role Management
- Secure authentication system with Clerk integration
- Brand/KOL role selection
- User profile management

### 🌐 Blockchain Integration
- Starknet wallet connection
- Smart contract interaction
- Network switching support

### 📊 Task Management System
- **Brand Features**:
  - Create marketing tasks
  - Track task progress
  - Payment management
- **KOL Features**:
  - Browse task marketplace
  - Apply for tasks
  - Task execution and submission

### 🎥 Social Media Integration
- YouTube account connection
- Channel data retrieval
- Content creation tools

### 💼 Dashboard
- Personal data overview
- Earnings statistics
- Task history

## 🛠️ Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn package manager
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MarkFair/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   
   Create a `.env` file and configure the following environment variables:
   ```env
   # Clerk Authentication
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   
   # Backend API URL
   VITE_API_BASE_URL=http://localhost:8000
   
   # Starknet Network Configuration
   VITE_STARKNET_NETWORK=sepolia
   
   # Smart Contract Addresses (Example addresses for demo)
   VITE_KOLESCROW_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
   VITE_MARKFAIR_TOKEN_CONTRACT_ADDRESS=0xabcdef1234567890abcdef1234567890abcdef12
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The application will start at `http://localhost:5173`

## 📝 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
frontend/
├── public/                 # Static assets
│   ├── markfair-logo.png  # Project logo
│   └── image.png          # Other images
├── src/
│   ├── abi/               # Smart contract ABIs
│   ├── api/               # API interface definitions
│   ├── components/        # React components
│   │   ├── layout/        # Layout components
│   │   ├── NetworkSwitcher.tsx
│   │   ├── RoleSelectionModal.tsx
│   │   └── WalletConnector.tsx
│   ├── contexts/          # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   │   ├── tasks/         # Task-related pages
│   │   ├── Dashboard.tsx
│   │   ├── Home.tsx
│   │   └── ...
│   ├── providers/         # Global providers
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── package.json           # Project configuration
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
└── tsconfig.json          # TypeScript configuration
```

## 🔧 Configuration

### Vite Configuration
- Development server port: 5173
- Build output directory: `dist/`
- TypeScript and React support

### Tailwind CSS
- Responsive design support
- Dark theme configuration
- Custom color schemes

### TypeScript
- Strict mode enabled
- Path alias configuration
- Optimized type checking

## 🌐 Deployment

### Build for Production
```bash
npm run build
```

Build files will be output to the `dist/` directory and can be deployed to any static file server.

### Recommended Deployment Platforms
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## 🔗 Related Links

- [Backend API Documentation](../backend/README.md)
- [Smart Contract Documentation](../contract/README.md)
- [Starknet Documentation](https://docs.starknet.io/)
- [Clerk Documentation](https://clerk.com/docs)

## 🤝 Development Guidelines

### Code Standards
- Use ESLint for code linting
- Follow React Hooks best practices
- TypeScript strict mode
- Functional component approach

### Commit Convention
```bash
# Feature development
git commit -m "feat: add task creation functionality"

# Bug fixes
git commit -m "fix: resolve wallet connection issue"

# Style improvements
git commit -m "style: optimize responsive layout"
```

## 📞 Support

For questions or suggestions:
1. Check project documentation
2. Submit an Issue
3. Contact development team

---

**MarkFair** - Making Web3 marketing simpler, more transparent, and fairer 🚀
