import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialScreen from './screens/MaterialScreen';
import PYQScreen from './screens/PYQScreen';
import ChatScreen from './screens/ChatScreen';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function Index() {
  return (
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#121212' }, // Dark header background
          headerTintColor: 'white', // White text color
          tabBarStyle: { backgroundColor: '#121212' }, // Dark bottom tab
          tabBarActiveTintColor: 'white', // Highlighted tab color
          tabBarInactiveTintColor: 'gray', // Inactive tab color
        }}
      >
        <Tab.Screen 
          name="Material" 
          component={MaterialScreen} 
          options={{ 
            tabBarIcon: ({ color, size }) => <MaterialIcons name="menu-book" size={size} color={color} /> 
          }} 
        />
        <Tab.Screen 
          name="PYQ" 
          component={PYQScreen} 
          options={{ 
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="file-document-outline" size={size} color={color} /> 
          }} 
        />
        <Tab.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={{ 
            tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} /> 
          }} 
        />
      </Tab.Navigator>
  );
}
