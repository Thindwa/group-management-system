# Group Management System

A comprehensive mobile application for managing rotating savings and credit associations (ROSCAs), also known as "chama" or "tontine" groups. Built with React Native and Expo, this app provides complete financial management for groups including contributions, loans, benefits, and comprehensive reporting.

## 🌟 Features

### 👥 Multi-Role Management
- **Member**: Make contributions, request loans/benefits, view personal data
- **Treasurer**: Approve financial requests, confirm contributions, record payments
- **Admin**: Manage members, configure settings, access reports
- **Super Admin**: Multi-group management, system administration

### 💰 Financial Management
- **Contributions**: Track member contributions with receipt uploads
- **Loans**: Request, approve, and track loans with automatic interest calculation
- **Benefits**: Manage emergency and planned benefit disbursements
- **Interest Engine**: Sophisticated interest calculation with grace periods and penalties
- **Balance Tracking**: Real-time group balance with reserve management

### 📊 Reporting & Analytics
- **Comprehensive Reports**: Detailed financial summaries with modern PDF export
- **Custom Filenames**: Organized PDF reports with group name, circle year, and date
- **Historical Data**: Access past circle information and trends
- **Real-time Analytics**: Live financial health monitoring

### 🔄 Circle Management
- **Multi-Circle Support**: Manage multiple financial periods
- **Circle Transitions**: Smooth transitions between circles
- **Historical Access**: View and compare past circle data
- **Flexible Settings**: Circle-specific configurations

### 🔐 Security & Permissions
- **Role-Based Access**: Granular permissions based on user roles
- **Secure Authentication**: Supabase Auth integration
- **Data Protection**: Row-level security policies
- **Audit Trails**: Complete transaction logging

## 📱 Screenshots

*Screenshots will be added showing the main app interface, dashboard, loan management, and reporting features.*

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/group-management-system.git
   cd group-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

### Building APK

1. **Using the build script**
   ```bash
   ./build-apk.sh
   ```

2. **Manual EAS build**
   ```bash
   npm install -g eas-cli
   eas login
   eas build --platform android --profile preview --local
   ```

## 🗄️ Database Setup

### Supabase Setup

1. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and API keys

2. **Run migrations**
   ```bash
   # Apply all migrations
   supabase db push
   
   # Or run individual migration files
   psql -h your-db-host -U postgres -d postgres -f supabase/migrations/001_complete_schema.sql
   ```

3. **Set up Row Level Security**
   ```bash
   # Apply RLS policies
   psql -h your-db-host -U postgres -d postgres -f supabase/migrations/003_rls_policies.sql
   ```

4. **Seed sample data (optional)**
   ```bash
   psql -h your-db-host -U postgres -d postgres -f supabase/seed.sql
   ```

### Storage Setup

1. **Create storage bucket**
   - Go to Storage in your Supabase dashboard
   - Create a bucket named "receipts"
   - Set it to private
   - The app will automatically create necessary policies

## 📚 Documentation

- **[User Guide](USER_GUIDE.md)** - Complete user manual for all app features
- **[Admin Guide](ADMIN_GUIDE.md)** - Administrator and treasurer documentation
- **[Technical Documentation](TECHNICAL_DOCUMENTATION.md)** - Developer documentation and API reference

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React Native with Expo SDK 51
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: Zustand
- **Navigation**: React Navigation v7
- **Forms**: React Hook Form with Zod validation
- **PDF Generation**: Expo Print

### Project Structure
```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── navigation/         # Navigation configuration
├── screens/            # Application screens
│   ├── admin/         # Admin-specific screens
│   ├── auth/          # Authentication screens
│   ├── member/        # Member-specific screens
│   └── shared/        # Shared screens
├── services/           # External service integrations
├── stores/            # Zustand state management
├── types/             # TypeScript type definitions
└── utils/             # Utility functions

supabase/
├── migrations/        # Database schema migrations
├── config.toml        # Supabase configuration
└── seed.sql          # Sample data
```

## 💰 Interest Calculation

The system implements a sophisticated interest calculation engine:

### Features
- **Grace Period Support**: No interest during grace period
- **Overdue Penalties**: Additional periods after grace expires
- **Compound Interest**: Interest on accumulated interest
- **Real-time Calculation**: Updates based on current date

### Example
```
Principal: $10,000
Interest Rate: 20% per period
Loan Period: 30 days
Grace Period: 5 days

After 40 days: 1 base period + 1 overdue period = 2 periods
Total Due: $10,000 × (1 + 0.20 × 2) = $14,000
Interest Earned: $4,000
```

## 🔧 Development

### Available Scripts
```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run tests
npm test

# Type checking
npx tsc --noEmit

# Lint code
npx eslint src/
```

### Code Style
- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Conventional Commits**: Standardized commit messages

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API and database operation testing
- **E2E Tests**: Full user flow testing

## 🚀 Deployment

### Android APK
```bash
# Build APK using EAS
eas build --platform android --profile preview --local

# Or use the build script
./build-apk.sh
```

### iOS App Store
```bash
# Build for iOS
eas build --platform ios --profile production
```

### Environment Variables
```bash
# Production environment
EXPO_PUBLIC_SUPABASE_URL=your_production_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
```

## 🔒 Security

### Authentication
- Secure email/password authentication via Supabase Auth
- JWT token-based session management
- Password reset functionality

### Data Protection
- Row-level security (RLS) policies in PostgreSQL
- Encrypted data transmission
- Secure API key management
- User role-based access control

### Best Practices
- Regular security updates
- Secure environment variable management
- Regular data backups
- Audit trail logging

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commit messages
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check the comprehensive guides in the `/docs` folder
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions in GitHub Discussions

### Common Issues
- **Build Errors**: Check Node.js version and dependencies
- **Database Connection**: Verify Supabase credentials
- **Authentication Issues**: Check user roles and permissions
- **PDF Generation**: Ensure proper file permissions

## 🗺️ Roadmap

### Upcoming Features
- [ ] Offline support with data synchronization
- [ ] Push notifications for important events
- [ ] Advanced analytics and insights
- [ ] Multi-language support
- [ ] Integration with mobile money services
- [ ] Advanced reporting with charts and graphs

### Recent Updates
- ✅ Modern PDF report generation with custom filenames
- ✅ Comprehensive interest calculation engine
- ✅ Multi-circle management system
- ✅ Role-based access control
- ✅ Real-time balance tracking

## 🙏 Acknowledgments

- **Supabase**: For providing the backend infrastructure
- **Expo**: For the excellent React Native development platform
- **React Navigation**: For navigation solutions
- **Zustand**: For state management
- **React Hook Form**: For form management
- **Zod**: For schema validation

---

**Built with ❤️ for community financial management**

*For more information, please refer to the detailed documentation in the `/docs` folder or contact the development team.*