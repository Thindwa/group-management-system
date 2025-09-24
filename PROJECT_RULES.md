# Project Rules for Loans App Development

## 🎯 **Core Principles**

### 1. **Database-First Development**
- All database constraints MUST be checked before UI implementation
- Status values MUST match database CHECK constraints exactly (uppercase)
- Payment method values MUST match database CHECK constraints exactly (lowercase with underscores)
- Always verify table schemas before implementing CRUD operations

### 2. **Role-Based Access Control (RBAC)**
- Every action MUST be protected by RoleGuard component
- Admin/Chairperson roles MUST have approval workflows visible
- Treasurer roles MUST have payment management capabilities
- Member roles MUST only see their own data and create requests

### 3. **Complete CRUD Operations**
- Every entity MUST have full Create, Read, Update, Delete operations
- Every form MUST have proper validation and error handling
- Every action MUST provide user feedback (success/error messages)
- Every screen MUST have loading states and error states

### 4. **Navigation & User Experience**
- Admin users MUST see approval buttons and management options
- Settings screens MUST be fully functional with save/cancel actions
- Member management MUST have add/edit/remove functionality
- All screens MUST be accessible through proper navigation

## 🔧 **Technical Standards**

### 1. **Status Values (Database Constraints)**
```sql
-- Contributions
status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED')

-- Loans  
status IN ('ACTIVE', 'CLOSED', 'OVERDUE')

-- Benefits
status IN ('PENDING', 'APPROVED', 'PAID', 'REJECTED')

-- Circles
status IN ('ACTIVE', 'CLOSED')
```

### 2. **Payment Methods (Database Constraints)**
```sql
method IN ('cash', 'bank_transfer', 'mobile_money')
```

### 3. **User Roles & Permissions**
```typescript
SUPERADMIN: Full access to everything
ADMIN: Group management, approvals, settings
TREASURER: Payment management, loan management
CHAIRPERSON: Approvals, member management
AUDITOR: Read-only access to reports
MEMBER: Create requests, view own data
```

## 📋 **Required Features Checklist**

### ✅ **Authentication & User Management**
- [x] Login system with custom authentication
- [x] User roles and permissions
- [ ] User profile management
- [ ] Password change functionality

### ✅ **Group Management**
- [x] Create groups
- [x] Group settings management
- [ ] Group member management (CRUD)
- [ ] Group statistics and overview

### ✅ **Member Management**
- [ ] Add members to group
- [ ] Edit member details
- [ ] Remove members from group
- [ ] Member role management
- [ ] Member contribution history

### ✅ **Contribution Management**
- [x] Record contributions
- [x] View contribution history
- [x] Payment method selection
- [ ] Contribution approval workflow
- [ ] Contribution reports

### ✅ **Loan Management**
- [x] Create loan requests
- [x] View loan details
- [x] Loan payment tracking
- [ ] **MISSING: Admin approval workflow**
- [ ] **MISSING: Loan disbursement process**
- [ ] **MISSING: Grace period management**

### ✅ **Benefit Management**
- [x] Create benefit requests
- [x] View benefit details
- [ ] **MISSING: Admin approval workflow**
- [ ] **MISSING: Benefit payment process**
- [ ] **MISSING: Document upload**

### ✅ **Settings Management**
- [ ] **MISSING: Group settings screen**
- [ ] **MISSING: Contribution amount settings**
- [ ] **MISSING: Loan interest settings**
- [ ] **MISSING: Benefit amount settings**

### ✅ **Reports & Analytics**
- [x] Basic reports structure
- [x] PDF export functionality
- [ ] **MISSING: Comprehensive reporting**
- [ ] **MISSING: Financial summaries**

## 🚨 **Critical Missing Features**

### 1. **Admin Approval Workflows**
- **LoansScreen**: Missing approve/reject buttons for pending loans
- **BenefitsScreen**: Missing approve/reject buttons for pending benefits
- **Admin Dashboard**: Missing pending requests overview

### 2. **Settings Management**
- **GroupSettingsScreen**: Not fully implemented
- **Member Management**: Add/edit/remove members not working
- **Role Management**: Change member roles not working

### 3. **Navigation Issues**
- **App.tsx**: Custom navigation instead of React Navigation
- **Screen Routing**: Many screens not properly connected
- **Admin Access**: Admin users can't access management features

### 4. **Data Loading Issues**
- **Store Initialization**: Data not loading on app start
- **User Context**: User data not properly loaded
- **Group Context**: Group data not properly loaded

## 🛠 **Implementation Priority**

### **Phase 1: Critical Fixes (IMMEDIATE)**
1. Fix admin approval workflows in LoansScreen and BenefitsScreen
2. Implement proper GroupSettingsScreen
3. Fix member management CRUD operations
4. Fix navigation and screen routing

### **Phase 2: Core Features (HIGH PRIORITY)**
1. Implement proper React Navigation
2. Fix data loading and store initialization
3. Complete settings management
4. Add proper error handling and loading states

### **Phase 3: Enhanced Features (MEDIUM PRIORITY)**
1. Add document upload functionality
2. Implement comprehensive reporting
3. Add notification system
4. Improve UI/UX

## 📝 **Code Quality Standards**

### 1. **Error Handling**
- Every async operation MUST have try-catch
- Every error MUST be displayed to user
- Every form MUST have validation

### 2. **Loading States**
- Every async operation MUST show loading indicator
- Every screen MUST have loading state
- Every form submission MUST disable form during processing

### 3. **User Feedback**
- Every action MUST show success/error message
- Every form MUST show validation errors
- Every screen MUST handle empty states

### 4. **Data Consistency**
- Every database operation MUST use proper constraints
- Every status update MUST match database schema
- Every user action MUST be properly authorized

## 🔍 **Testing Requirements**

### 1. **Role Testing**
- Test each role can access appropriate features
- Test admin can approve/reject requests
- Test members can only see their own data

### 2. **CRUD Testing**
- Test all Create operations work
- Test all Read operations work
- Test all Update operations work
- Test all Delete operations work

### 3. **Data Validation**
- Test all form validations work
- Test all database constraints are respected
- Test all error handling works

## 📊 **Success Metrics**

### 1. **Functional Completeness**
- All CRUD operations work for all entities
- All user roles can perform their assigned actions
- All forms validate and submit properly

### 2. **User Experience**
- Admin users can approve/reject requests
- Settings can be modified and saved
- Members can be added/edited/removed
- All screens load and display data properly

### 3. **Data Integrity**
- All database constraints are respected
- All status values are consistent
- All user permissions are enforced

---

**Remember**: Every feature MUST be fully functional before moving to the next. No half-implemented features!

## 🎯 **Core Principles**

### 1. **Database-First Development**
- All database constraints MUST be checked before UI implementation
- Status values MUST match database CHECK constraints exactly (uppercase)
- Payment method values MUST match database CHECK constraints exactly (lowercase with underscores)
- Always verify table schemas before implementing CRUD operations

### 2. **Role-Based Access Control (RBAC)**
- Every action MUST be protected by RoleGuard component
- Admin/Chairperson roles MUST have approval workflows visible
- Treasurer roles MUST have payment management capabilities
- Member roles MUST only see their own data and create requests

### 3. **Complete CRUD Operations**
- Every entity MUST have full Create, Read, Update, Delete operations
- Every form MUST have proper validation and error handling
- Every action MUST provide user feedback (success/error messages)
- Every screen MUST have loading states and error states

### 4. **Navigation & User Experience**
- Admin users MUST see approval buttons and management options
- Settings screens MUST be fully functional with save/cancel actions
- Member management MUST have add/edit/remove functionality
- All screens MUST be accessible through proper navigation

## 🔧 **Technical Standards**

### 1. **Status Values (Database Constraints)**
```sql
-- Contributions
status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED')

-- Loans  
status IN ('ACTIVE', 'CLOSED', 'OVERDUE')

-- Benefits
status IN ('PENDING', 'APPROVED', 'PAID', 'REJECTED')

-- Circles
status IN ('ACTIVE', 'CLOSED')
```

### 2. **Payment Methods (Database Constraints)**
```sql
method IN ('cash', 'bank_transfer', 'mobile_money')
```

### 3. **User Roles & Permissions**
```typescript
SUPERADMIN: Full access to everything
ADMIN: Group management, approvals, settings
TREASURER: Payment management, loan management
CHAIRPERSON: Approvals, member management
AUDITOR: Read-only access to reports
MEMBER: Create requests, view own data
```

## 📋 **Required Features Checklist**

### ✅ **Authentication & User Management**
- [x] Login system with custom authentication
- [x] User roles and permissions
- [ ] User profile management
- [ ] Password change functionality

### ✅ **Group Management**
- [x] Create groups
- [x] Group settings management
- [ ] Group member management (CRUD)
- [ ] Group statistics and overview

### ✅ **Member Management**
- [ ] Add members to group
- [ ] Edit member details
- [ ] Remove members from group
- [ ] Member role management
- [ ] Member contribution history

### ✅ **Contribution Management**
- [x] Record contributions
- [x] View contribution history
- [x] Payment method selection
- [ ] Contribution approval workflow
- [ ] Contribution reports

### ✅ **Loan Management**
- [x] Create loan requests
- [x] View loan details
- [x] Loan payment tracking
- [ ] **MISSING: Admin approval workflow**
- [ ] **MISSING: Loan disbursement process**
- [ ] **MISSING: Grace period management**

### ✅ **Benefit Management**
- [x] Create benefit requests
- [x] View benefit details
- [ ] **MISSING: Admin approval workflow**
- [ ] **MISSING: Benefit payment process**
- [ ] **MISSING: Document upload**

### ✅ **Settings Management**
- [ ] **MISSING: Group settings screen**
- [ ] **MISSING: Contribution amount settings**
- [ ] **MISSING: Loan interest settings**
- [ ] **MISSING: Benefit amount settings**

### ✅ **Reports & Analytics**
- [x] Basic reports structure
- [x] PDF export functionality
- [ ] **MISSING: Comprehensive reporting**
- [ ] **MISSING: Financial summaries**

## 🚨 **Critical Missing Features**

### 1. **Admin Approval Workflows**
- **LoansScreen**: Missing approve/reject buttons for pending loans
- **BenefitsScreen**: Missing approve/reject buttons for pending benefits
- **Admin Dashboard**: Missing pending requests overview

### 2. **Settings Management**
- **GroupSettingsScreen**: Not fully implemented
- **Member Management**: Add/edit/remove members not working
- **Role Management**: Change member roles not working

### 3. **Navigation Issues**
- **App.tsx**: Custom navigation instead of React Navigation
- **Screen Routing**: Many screens not properly connected
- **Admin Access**: Admin users can't access management features

### 4. **Data Loading Issues**
- **Store Initialization**: Data not loading on app start
- **User Context**: User data not properly loaded
- **Group Context**: Group data not properly loaded

## 🛠 **Implementation Priority**

### **Phase 1: Critical Fixes (IMMEDIATE)**
1. Fix admin approval workflows in LoansScreen and BenefitsScreen
2. Implement proper GroupSettingsScreen
3. Fix member management CRUD operations
4. Fix navigation and screen routing

### **Phase 2: Core Features (HIGH PRIORITY)**
1. Implement proper React Navigation
2. Fix data loading and store initialization
3. Complete settings management
4. Add proper error handling and loading states

### **Phase 3: Enhanced Features (MEDIUM PRIORITY)**
1. Add document upload functionality
2. Implement comprehensive reporting
3. Add notification system
4. Improve UI/UX

## 📝 **Code Quality Standards**

### 1. **Error Handling**
- Every async operation MUST have try-catch
- Every error MUST be displayed to user
- Every form MUST have validation

### 2. **Loading States**
- Every async operation MUST show loading indicator
- Every screen MUST have loading state
- Every form submission MUST disable form during processing

### 3. **User Feedback**
- Every action MUST show success/error message
- Every form MUST show validation errors
- Every screen MUST handle empty states

### 4. **Data Consistency**
- Every database operation MUST use proper constraints
- Every status update MUST match database schema
- Every user action MUST be properly authorized

## 🔍 **Testing Requirements**

### 1. **Role Testing**
- Test each role can access appropriate features
- Test admin can approve/reject requests
- Test members can only see their own data

### 2. **CRUD Testing**
- Test all Create operations work
- Test all Read operations work
- Test all Update operations work
- Test all Delete operations work

### 3. **Data Validation**
- Test all form validations work
- Test all database constraints are respected
- Test all error handling works

## 📊 **Success Metrics**

### 1. **Functional Completeness**
- All CRUD operations work for all entities
- All user roles can perform their assigned actions
- All forms validate and submit properly

### 2. **User Experience**
- Admin users can approve/reject requests
- Settings can be modified and saved
- Members can be added/edited/removed
- All screens load and display data properly

### 3. **Data Integrity**
- All database constraints are respected
- All status values are consistent
- All user permissions are enforced

---

**Remember**: Every feature MUST be fully functional before moving to the next. No half-implemented features!
