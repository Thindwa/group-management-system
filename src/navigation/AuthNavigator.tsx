import React, { useState } from 'react';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

export default function AuthNavigator() {
  const [currentScreen, setCurrentScreen] = useState('Login');

  const navigateTo = (screen: string) => {
    setCurrentScreen(screen);
  };

  switch (currentScreen) {
    case 'Register':
      return <RegisterScreen onNavigate={navigateTo} />;
    case 'ForgotPassword':
      return <ForgotPasswordScreen onNavigate={navigateTo} />;
    default:
      return <LoginScreen onNavigate={navigateTo} />;
  }
}
