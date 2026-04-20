import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
// import MapScreen from '../screens/MapScreen'; // TODO: habilitar após resolver compatibilidade web

function MapPlaceholder() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0F0F0F",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: 12 }}>🗺️</Text>
      <Text style={{ color: "#3DDC97", fontSize: 18, fontWeight: "700" }}>
        Mapa em breve
      </Text>
      <Text style={{ color: "#666", fontSize: 13, marginTop: 6 }}>
        Funcionalidade em desenvolvimento
      </Text>
    </View>
  );
}
import NotificationsScreen from "../screens/NotificationsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import DonationDetailScreen from "../screens/DonationDetailScreen";
import NewDonationScreen from "../screens/NewDonationScreen";
import MyDonationsScreen from "../screens/MyDonationsScreen";
import RequestsScreen from "../screens/RequestsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const GREEN = "#3DDC97";
const DARK = "#1a1a1a";
const GRAY = "#888";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Início: "🏠",
    Mapa: "🗺️",
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
      <Tab.Screen name="Mapa" component={MapPlaceholder} />
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
      <Stack.Screen name="Requests" component={RequestsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
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
    <NavigationContainer>
      {session ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
