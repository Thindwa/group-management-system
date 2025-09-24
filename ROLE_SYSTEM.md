# Role-Based Access Control System

## Overview
The app now uses a **hierarchical role system** where higher roles inherit all capabilities of lower roles. Users have **one role** that determines their full set of permissions.

## Role Hierarchy (Highest to Lowest)

### 1. SUPERADMIN
- **Full system access and control**
- Can do everything all other roles can do
- Additional: System management, debug access

### 2. ADMIN  
- **Group management and user administration**
- Can do everything except superadmin functions
- Additional: User management, group settings, full data access

### 3. TREASURER
- **Financial management and payments**
- Can do member functions + treasurer functions
- Additional: Disburse loans, record repayments, manage payments

### 4. CHAIRPERSON
- **Approvals and decision making**
- Can do member functions + chairperson functions  
- Additional: Approve benefits, approve loans, manage approvals

### 5. AUDITOR
- **Financial oversight and reporting**
- Can do member functions + auditor functions
- Additional: View ledger, view reports, audit transactions

### 6. MEMBER
- **Basic group participation**
- Can only do basic member functions
- Functions: Contribute, request benefits, request loans, view dashboard

## What Each Role Can Do

### All Roles Can:
- ✅ View Dashboard
- ✅ Make Contributions
- ✅ Request Benefits
- ✅ Request Loans
- ✅ View their own profile

### Treasurer+ Can Also:
- ✅ Disburse Loans
- ✅ Record Loan Repayments
- ✅ Make Benefit Payments
- ✅ View Ledger
- ✅ View Reports

### Chairperson+ Can Also:
- ✅ Approve Benefits
- ✅ Approve Loans
- ✅ Manage Approvals
- ✅ View Reports

### Auditor+ Can Also:
- ✅ View Ledger
- ✅ View Reports
- ✅ Audit Transactions

### Admin+ Can Also:
- ✅ Manage Users
- ✅ Manage Group Settings
- ✅ View All Data
- ✅ Access All Functions

### Superadmin Can Also:
- ✅ System Management
- ✅ Debug Access
- ✅ Everything

## Benefits

1. **No Duplicate Users**: One person, one role, all capabilities
2. **Intuitive**: Higher roles can do everything lower roles can do
3. **Flexible**: Easy to assign appropriate roles to users
4. **Secure**: Clear permission boundaries
5. **Scalable**: Easy to add new roles or permissions

## Implementation

- **Navigation**: Each role gets tabs for their level + all lower levels
- **UI**: Buttons/actions are shown based on role capabilities
- **Backend**: Permission checks use hierarchical logic
- **Database**: Single role field per user

## Example Scenarios

- **Treasurer** can contribute, request loans, AND disburse payments
- **Chairperson** can contribute, request loans, AND approve requests
- **Admin** can do everything except superadmin functions
- **Member** can only do basic participation functions
