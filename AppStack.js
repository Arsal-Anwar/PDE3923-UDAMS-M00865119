// appstack.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import ThresholdScreen from './screens/ThresholdScreen';
import LogsScreen from './screens/LogsScreen';

const Stack = createStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: true, title: 'Driver Monitor' }}
      />
      <Stack.Screen 
        name="Threshold" 
        component={ThresholdScreen} 
        options={{ headerShown: true, title: 'Alert Settings' }}
      />
      <Stack.Screen 
        name="Logs" 
        component={LogsScreen} 
        options={{ headerShown: true, title: 'Alert History' }}
      />
    </Stack.Navigator>
  );
}
