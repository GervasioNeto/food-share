import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { Toast } from "../components/Toast";
import { toastConfig } from "../components/Toast/toastConfig";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Bell, Home, Map, MessageSquare, User } from "lucide-react-native";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import MapScreen from "../screens/MapScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import DonationDetailScreen from "../screens/DonationDetailScreen";
import NewDonationScreen from "../screens/NewDonationScreen";
import MyDonationsScreen from "../screens/MyDonationsScreen";
import RequestsScreen from "../screens/RequestsScreen";
import NotificationDetailScreen from "../screens/NotificationDetailScreen";
import ChatListScreen from "../screens/ChatListScreen";
import ChatScreen from "../screens/ChatScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const GREEN = "#3DDC97";
const DARK = "#1a1a1a";
const GRAY = "#888";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, React.ElementType> = {
    Início: Home,
    Mapa: Map,
    Chats: MessageSquare,
    Alertas: Bell,
    Perfil: User,
  };

  const Icon = icons[name];
  const color = focused ? GREEN : GRAY;
  return <Icon size={24} color={color} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: DARK, borderTopColor: "#333", paddingTop: 0, height: 65 },
        tabBarLabelStyle: { fontSize: 14, fontWeight: "bold" },
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
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const { session, loading } = useAuth();
  const [isRecovery, setIsRecovery] = useState(false);
  const [bootChecked, setBootChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkInitialState() {
      try {
        const url = await Linking.getInitialURL();

        if (url?.includes("reset-password")) {
          if (mounted) setIsRecovery(true);
        }

        const { data } = await supabase.auth.getSession();

        if (data.session && url?.includes("reset-password")) {
          if (mounted) setIsRecovery(true);
        }
      } finally {
        if (mounted) setBootChecked(true);
      }
    }

    checkInitialState();

    const linkSub = Linking.addEventListener("url", ({ url }) => {
      if (url?.includes("reset-password")) {
        setIsRecovery(true);
      }
    });

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }

      if (event === "USER_UPDATED" || event === "SIGNED_OUT") {
        setIsRecovery(false);
      }
    });

    return () => {
      mounted = false;
      linkSub.remove();
      authSub.unsubscribe();
    };
  }, []);

  if (loading || !bootChecked) return null;

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isRecovery ? (
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
            />
          ) : session ? (
            <Stack.Screen name="App" component={AppStack} />
          ) : (
            <Stack.Screen name="Auth" component={AuthStack} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <Toast config={toastConfig} />
    </>
  );
}
