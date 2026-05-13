import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Toast } from "../components/Toast";
import { toastConfig } from "../components/Toast/toastConfig";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { useAuth } from "../contexts/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import MapScreen from '../screens/MapScreen';
import NotificationsScreen from "../screens/NotificationsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import DonationDetailScreen from "../screens/DonationDetailScreen";
import NewDonationScreen from "../screens/NewDonationScreen";
import MyDonationsScreen from "../screens/MyDonationsScreen";
import RequestsScreen from "../screens/RequestsScreen";
import NotificationDetailScreen from "../screens/NotificationDetailScreen";
import ChatListScreen from "../screens/ChatListScreen";
import ChatScreen from "../screens/ChatScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const GREEN = "#3DDC97";
const DARK = "#1a1a1a";
const GRAY = "#888";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Início: "🏠",
    Mapa: "🗺️",
    Chats: "💬",
    Alertas: "🔔",
    Perfil: "👤",
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[name]}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: DARK, borderTopColor: "#333" },
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: GRAY,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Mapa" component={MapScreen} />
      <Tab.Screen name="Chats" component={ChatListScreen} />
      <Tab.Screen name="Alertas" component={NotificationsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="DonationDetail" component={DonationDetailScreen} />
      <Stack.Screen name="NewDonation" component={NewDonationScreen} />
      <Stack.Screen name="MyDonations" component={MyDonationsScreen} />
      <Stack.Screen
        name="NotificationDetail"
        component={NotificationDetailScreen}
      />
      <Stack.Screen name="Requests" component={RequestsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const { session, loading } = useAuth();

  if (loading) return null;

  return (
    <>
      <NavigationContainer>
        {session ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
      <Toast config={toastConfig} />
    </>
  );
}
