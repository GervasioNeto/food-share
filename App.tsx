import React from "react";
import { AuthProvider } from "./src/contexts/AuthContext";
import Navigation from "./src/navigation";
import Toast from "react-native-toast-message";

export default function App() {
  return (
    <>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
      <Toast />
    </>
  );
}