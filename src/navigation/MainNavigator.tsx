import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { 
  canAccessMemberFunctions, 
  canAccessAdminFunctions, 
  canAccessTreasurerFunctions, 
  canAccessChairpersonFunctions, 
  canAccessAuditorFunctions 
} from '../utils/rolePermissions';

// Member screens
import DashboardScreen from '../screens/member/DashboardScreen';
import ContributeScreen from '../screens/member/ContributeScreen';
import RequestBenefitScreen from '../screens/member/RequestBenefitScreen';
import RequestLoanScreen from '../screens/member/RequestLoanScreen';
import ProfileScreen from '../screens/member/ProfileScreen';

// Admin screens
import ApprovalsScreen from '../screens/admin/ApprovalsScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import AddLedgerEntryScreen from '../screens/admin/AddLedgerEntryScreen';
import ContributionsScreen from '../screens/admin/ContributionsScreen';
import ContributionConfirmationsScreen from '../screens/admin/ContributionConfirmationsScreen';
import AdminBenefitsScreen from '../screens/admin/BenefitsScreen';
import AdminLoansScreen from '../screens/admin/LoansScreen';
import LedgerScreen from '../screens/admin/LedgerScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import SettingsScreen from '../screens/admin/SettingsScreen';
import CircleScreen from '../screens/admin/CircleScreen';

// Member screens
import MemberBenefitsScreen from '../screens/member/BenefitsScreen';
import MemberLoansScreen from '../screens/member/LoansScreen';

// Shared screens
import JoinGroupScreen from '../screens/shared/JoinGroupScreen';
import CreateGroupScreen from '../screens/shared/CreateGroupScreen';
import ManageGroupMembersScreen from '../screens/admin/ManageGroupMembersScreen';
import LoanStatsScreen from '../screens/admin/LoanStatsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MemberTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Contribute') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'RequestBenefit') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'RequestLoan') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Benefits') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Loans') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Contribute" component={ContributeScreen} />
      <Tab.Screen name="RequestBenefit" component={RequestBenefitScreen} />
      <Tab.Screen name="RequestLoan" component={RequestLoanScreen} />
      <Tab.Screen name="Benefits" component={MemberBenefitsScreen} />
      <Tab.Screen name="Loans" component={MemberLoansScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Contribute') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'RequestBenefit') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'RequestLoan') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'MyBenefits') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'MyLoans') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Approvals') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'UserManagement') {
            iconName = focused ? 'person-add' : 'person-add-outline';
          } else if (route.name === 'Contributions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Benefits') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Loans') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'CreateGroup') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'ManageMembers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Circle') {
            iconName = focused ? 'refresh-circle' : 'refresh-circle-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Contribute" component={ContributeScreen} />
      <Tab.Screen name="RequestBenefit" component={RequestBenefitScreen} />
      <Tab.Screen name="RequestLoan" component={RequestLoanScreen} />
      <Tab.Screen name="MyBenefits" component={MemberBenefitsScreen} />
      <Tab.Screen name="MyLoans" component={MemberLoansScreen} />
      <Tab.Screen name="Approvals" component={ApprovalsScreen} />
      <Tab.Screen name="UserManagement" component={UserManagementScreen} />
      <Tab.Screen name="Contributions" component={ContributionsScreen} />
      <Tab.Screen name="Benefits" component={AdminBenefitsScreen} initialParams={{ mode: 'admin' }} />
      <Tab.Screen name="Loans" component={AdminLoansScreen} initialParams={{ mode: 'admin' }} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Tab.Screen name="ManageMembers" component={ManageGroupMembersScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="Circle" component={CircleScreen} />
    </Tab.Navigator>
  );
}

function TreasurerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Contribute') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'RequestBenefit') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'RequestLoan') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'MyBenefits') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'MyLoans') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'ConfirmContributions') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'Contributions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Benefits') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Loans') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Ledger') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Contribute" component={ContributeScreen} />
      <Tab.Screen name="RequestBenefit" component={RequestBenefitScreen} />
      <Tab.Screen name="RequestLoan" component={RequestLoanScreen} />
      <Tab.Screen name="MyBenefits" component={MemberBenefitsScreen} />
      <Tab.Screen name="MyLoans" component={MemberLoansScreen} />
      <Tab.Screen name="ConfirmContributions" component={ContributionConfirmationsScreen} />
      <Tab.Screen name="Contributions" component={ContributionsScreen} />
      <Tab.Screen name="Benefits" component={AdminBenefitsScreen} initialParams={{ mode: 'treasurer' }} />
      <Tab.Screen name="Loans" component={AdminLoansScreen} initialParams={{ mode: 'treasurer' }} />
      <Tab.Screen name="Ledger" component={LedgerScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

function ChairpersonTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Contribute') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'RequestBenefit') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'RequestLoan') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'MyBenefits') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'MyLoans') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Approvals') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'Contributions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Benefits') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Loans') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Contribute" component={ContributeScreen} />
      <Tab.Screen name="RequestBenefit" component={RequestBenefitScreen} />
      <Tab.Screen name="RequestLoan" component={RequestLoanScreen} />
      <Tab.Screen name="MyBenefits" component={MemberBenefitsScreen} />
      <Tab.Screen name="MyLoans" component={MemberLoansScreen} />
      <Tab.Screen name="Approvals" component={ApprovalsScreen} />
      <Tab.Screen name="Contributions" component={ContributionsScreen} />
      <Tab.Screen name="Benefits" component={AdminBenefitsScreen} />
      <Tab.Screen name="Loans" component={AdminLoansScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

function AuditorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Contribute') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'RequestBenefit') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'RequestLoan') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'MyBenefits') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'MyLoans') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Contributions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Benefits') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Loans') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Ledger') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Contribute" component={ContributeScreen} />
      <Tab.Screen name="RequestBenefit" component={RequestBenefitScreen} />
      <Tab.Screen name="RequestLoan" component={RequestLoanScreen} />
      <Tab.Screen name="MyBenefits" component={MemberBenefitsScreen} />
      <Tab.Screen name="MyLoans" component={MemberLoansScreen} />
      <Tab.Screen name="Contributions" component={ContributionsScreen} />
      <Tab.Screen name="Benefits" component={AdminBenefitsScreen} />
      <Tab.Screen name="Loans" component={AdminLoansScreen} />
      <Tab.Screen name="Ledger" component={LedgerScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const { session, profile } = useAuth();
  
  // Get user role from profile data
  const userRole = profile?.role as UserRole || 'MEMBER';

  console.log('User Role:', userRole, 'Profile:', profile?.full_name);

  // Select the appropriate tab navigator based on role hierarchy
  const getTabNavigator = () => {
    switch (userRole) {
      case 'SUPERADMIN':
      case 'ADMIN':
        return AdminTabs;
      case 'TREASURER':
        return TreasurerTabs;
      case 'CHAIRPERSON':
        return ChairpersonTabs;
      case 'AUDITOR':
        return AuditorTabs;
      case 'MEMBER':
      default:
        return MemberTabs;
    }
  };


  const TabNavigator = getTabNavigator();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator} 
      />
      <Stack.Screen name="JoinGroup" component={JoinGroupScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="AddLedgerEntry" component={AddLedgerEntryScreen} />
      <Stack.Screen name="LoanStats" component={LoanStatsScreen} />
    </Stack.Navigator>
  );
}
