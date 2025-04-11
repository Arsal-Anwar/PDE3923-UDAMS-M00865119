import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/Threshold'; // Renamed to match your screenshot
import LogsScreen from './screens/LogsScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ 
            title: 'Driver Login',
            headerShown: true,
            headerBackTitle: ' ' 
          }}
        />
        <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen}
          options={{ 
            title: 'Create Account',
            headerShown: true,
            headerBackTitle: ' ' 
          }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ 
            title: 'Driver Monitor',
            headerShown: true,
            headerLeft: null
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ 
            title: 'Alert Settings',
            headerShown: true,
            headerBackTitle: 'Back' 
          }}
        />
        <Stack.Screen 
          name="Logs" 
          component={LogsScreen}
          options={{ 
            title: 'Alert History',
            headerShown: true,
            headerBackTitle: 'Back' 
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}