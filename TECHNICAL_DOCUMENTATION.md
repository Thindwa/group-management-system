# Group Management System - Technical Documentation

## 🏗️ Architecture Overview

The Group Management System is built using React Native with Expo, providing a cross-platform mobile application for managing rotating savings and credit associations (ROSCAs).

### Technology Stack

- **Frontend**: React Native with Expo SDK 51
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: Zustand
- **Navigation**: React Navigation v7
- **Forms**: React Hook Form with Zod validation
- **PDF Generation**: Expo Print
- **Styling**: React Native StyleSheet

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

## 🗄️ Database Schema

### Core Tables

#### Groups
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  contribution_amount DECIMAL(10,2) NOT NULL,
  meeting_frequency VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Circles
```sql
CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  group_id UUID REFERENCES groups(id),
  role VARCHAR(20) DEFAULT 'MEMBER',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Contributions
```sql
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  attachment_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Loans
```sql
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  borrower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  principal DECIMAL(10,2) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  disbursed_by UUID REFERENCES profiles(id),
  disbursed_at TIMESTAMP,
  due_at TIMESTAMP,
  grace_period_days INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Ledger
```sql
CREATE TABLE ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id),
  type VARCHAR(50) NOT NULL,
  ref_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  direction VARCHAR(3) NOT NULL, -- 'IN' or 'OUT'
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Authentication & Authorization

### Supabase Auth Integration

The app uses Supabase Auth for user authentication:

```typescript
// Authentication hook
export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
};
```

### Role-Based Access Control

The app implements role-based permissions:

```typescript
export enum UserRole {
  MEMBER = 'MEMBER',
  TREASURER = 'TREASURER',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN'
}

export const rolePermissions = {
  [UserRole.MEMBER]: ['view_own_data', 'make_contributions', 'request_loans'],
  [UserRole.TREASURER]: ['approve_loans', 'confirm_contributions', 'record_payments'],
  [UserRole.ADMIN]: ['manage_members', 'configure_settings', 'view_reports'],
  [UserRole.SUPERADMIN]: ['manage_groups', 'system_administration']
};
```

## 📱 State Management

### Zustand Stores

The app uses Zustand for state management with separate stores for different domains:

#### Group Store
```typescript
interface GroupState {
  currentGroup: Group | null;
  groupSettings: GroupSettings | null;
  currentCircle: Circle | null;
  members: Profile[];
  balance: BalanceInfo | null;
  isLoading: boolean;
  error: string | null;
}
```

#### Loan Store
```typescript
interface LoanState {
  loans: Loan[];
  pendingLoans: Loan[];
  activeLoans: Loan[];
  loanPayments: Record<string, LoanPayment[]>;
  isLoading: boolean;
  error: string | null;
}
```

#### Contribution Store
```typescript
interface ContributionState {
  contributions: Contribution[];
  pendingContributions: Contribution[];
  contributionSchedule: ContributionSchedule[];
  isLoading: boolean;
  error: string | null;
}
```

## 💰 Interest Calculation Engine

### Loan Interest Calculation

The system implements a sophisticated interest calculation engine:

```typescript
export function computeLoanTotals(opts: {
  principal: number;
  disbursedAt: string | Date;
  interestPercent: number;
  loanPeriodDays: number;
  gracePeriodDays?: number;
  asOf?: string | Date;
  payments?: { amount: number; paidAt: string | Date }[];
}) {
  const now = dayjs(asOf);
  const disb = dayjs(disbursedAt);
  
  const dueAt = disb.add(loanPeriodDays, "day");
  const graceEndAt = dueAt.add(gracePeriodDays, "day");

  let periods = 1; // Base period always applies
  if (now.isAfter(graceEndAt)) {
    const extraDays = now.diff(graceEndAt, "day");
    const extraBlocks = Math.ceil(extraDays / loanPeriodDays);
    periods += extraBlocks;
  }

  const rate = Math.max(0, Number(interestPercent)) / 100;
  const grossDue = principal * (1 + rate * periods);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, Math.round(grossDue - paid));

  return {
    dueAt: dueAt.toISOString(),
    graceEndAt: graceEndAt.toISOString(),
    periods,
    interestPercent,
    loanPeriodDays,
    grossDue: Math.round(grossDue),
    paid,
    outstanding,
    inGrace: now.isBefore(graceEndAt) || now.isSame(graceEndAt),
    overdueBlocks: Math.max(0, periods - 1)
  };
}
```

### Key Features
- **Grace Period Support**: No interest during grace period
- **Overdue Penalties**: Additional periods after grace expires
- **Compound Interest**: Interest on accumulated interest
- **Real-time Calculation**: Updates based on current date

## 📊 Report Generation

### PDF Report System

The app generates comprehensive PDF reports using Expo Print:

```typescript
const generatePDF = async (reportData: ReportData) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${reportData.title}</title>
        <style>
          /* Modern CSS styling */
          body { font-family: 'Segoe UI', sans-serif; }
          .section { margin-bottom: 2rem; }
          .item { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <!-- Report content -->
      </body>
    </html>
  `;
  
  return html;
};
```

### Report Types
- **Comprehensive Circle Summary**: Complete financial overview
- **Contribution Reports**: Member contribution analysis
- **Loan Reports**: Loan portfolio and interest tracking
- **Benefit Reports**: Benefit disbursement summaries

## 🔒 Security Implementation

### Row Level Security (RLS)

Supabase RLS policies ensure data isolation:

```sql
-- Example RLS policy for loans
CREATE POLICY "Users can view loans in their group" ON loans
  FOR SELECT TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM profiles 
      WHERE id = auth.uid()
    )
  );
```

### Data Validation

Zod schemas validate all user input:

```typescript
const loanRequestSchema = z.object({
  principal: z.number().positive(),
  purpose: z.string().min(1),
  description: z.string().optional()
});
```

## 🚀 Deployment

### Environment Configuration

```bash
# .env file
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Build Configuration

#### EAS Build Configuration
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Database Migrations

Migrations are managed through Supabase:

```bash
# Apply migrations
supabase db push

# Generate new migration
supabase db diff --file migration_name
```

## 🧪 Testing

### Unit Tests
```typescript
describe('Interest Calculation', () => {
  it('should calculate correct interest for overdue loan', () => {
    const result = computeLoanTotals({
      principal: 10000,
      disbursedAt: '2024-01-01',
      interestPercent: 20,
      loanPeriodDays: 30,
      gracePeriodDays: 5,
      asOf: '2024-02-15'
    });
    
    expect(result.periods).toBe(2);
    expect(result.grossDue).toBe(14000);
  });
});
```

### Integration Tests
- API endpoint testing
- Database operation testing
- Authentication flow testing

## 📈 Performance Optimization

### Database Optimization
- **Indexes**: Strategic database indexing
- **Query Optimization**: Efficient SQL queries
- **Connection Pooling**: Supabase connection management

### App Performance
- **Lazy Loading**: Component lazy loading
- **State Optimization**: Efficient state updates
- **Image Optimization**: Compressed assets

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Supabase account

### Installation
```bash
# Clone repository
git clone <repository-url>
cd group-management-system

# Install dependencies
npm install

# Start development server
npx expo start
```

### Development Commands
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
```

## 🐛 Debugging

### Common Issues

#### Database Connection
```typescript
// Check Supabase connection
const { data, error } = await supabase
  .from('groups')
  .select('*')
  .limit(1);

if (error) {
  console.error('Database connection error:', error);
}
```

#### Authentication Issues
```typescript
// Debug authentication state
useEffect(() => {
  const { data: { session } } = supabase.auth.getSession();
  console.log('Current session:', session);
}, []);
```

#### State Management
```typescript
// Debug Zustand state
const useDebugStore = create((set, get) => ({
  // Add debug logging
  updateState: (newState) => {
    console.log('Previous state:', get());
    set(newState);
    console.log('New state:', get());
  }
}));
```

## 📚 API Reference

### Supabase Client
```typescript
import { supabase } from './services/supabase';

// Query data
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', 'value');

// Insert data
const { data, error } = await supabase
  .from('table_name')
  .insert({ column: 'value' });

// Update data
const { data, error } = await supabase
  .from('table_name')
  .update({ column: 'new_value' })
  .eq('id', 'record_id');
```

### Custom Hooks
```typescript
// Use authentication
const { session, loading } = useAuth();

// Use group data
const { currentGroup, members } = useGroupStore();

// Use loan data
const { loans, isLoading } = useLoanStore();
```

## 🔄 Maintenance

### Regular Tasks
- **Database Backups**: Automated daily backups
- **Security Updates**: Regular dependency updates
- **Performance Monitoring**: App performance tracking
- **User Feedback**: Collect and analyze user feedback

### Monitoring
- **Error Tracking**: Implement error logging
- **Performance Metrics**: Monitor app performance
- **User Analytics**: Track user behavior
- **System Health**: Monitor system status

---

*This technical documentation provides comprehensive information for developers working on the Group Management System. For additional support, refer to the source code or contact the development team.*
