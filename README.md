# FoodShare

A mobile application for food donation and redistribution, developed as an extension project at the University of Fortaleza (UNIFOR).

> **Course:** Mobile Platform Development

---

## Description

FoodShare connects **food donors** (restaurants and individuals) with **NGOs and individuals in need**. The platform allows donors to register food items, and receivers to find and request nearby donations through geolocation. The app handles the full donation lifecycle: listing, requesting, chat-based coordination, and completion tracking.

---

## Technologies

| Technology | Version | Purpose |
|---|---|---|
| React Native + Expo | SDK 54 | Cross-platform mobile framework |
| TypeScript | ~5.9 | Static typing |
| Supabase | ^2.102 | Auth, database, storage, real-time |
| React Navigation | ^7 | Stack + bottom-tab navigation |
| react-native-maps | 1.20.1 | Interactive donation map |
| expo-location | ~19.0 | Geolocation and address geocoding |
| expo-image-picker | ~17.0 | Photo upload for donations and avatars |
| lucide-react-native | ^1.17 | Icon library |
| react-native-toast-message | ^2.3 | User feedback toasts |

---

## Screens

| Screen | Description |
|---|---|
| Login | Email and password authentication with "forgot password" link |
| Register | Account creation as Donor or Receiver, with role-based fields |
| Forgot Password | Sends a recovery link to the user's email via Supabase Auth |
| Reset Password | Sets a new password after clicking the recovery deep link |
| Home | Main feed of available donations with search and filtering |
| Map | Interactive map showing donation pins by geolocation |
| Donation Detail | Full donation info with request button (receivers) or owner note (donors) |
| New Donation | Form to create a donation with photo, food details, expiry date, and address |
| My Donations | Donor's list of all their donations with status filters and expiry badge |
| Requests | Donor view to accept or reject incoming donation requests |
| Chat List | List of active chat rooms opened after a request is accepted |
| Chat | Real-time messaging between donor and receiver to coordinate pickup |
| Notifications | Feed of activity alerts (requests, acceptances, rejections, expiry) |
| Notification Detail | Detail view of a notification-linked request with accept/reject actions |
| Profile | User profile with role badge, contact info, and impact stats |
| Edit Profile | Form to update name, phone, address, and avatar |

---

## Donation Flow

1. Donor creates a donation (food details, photo, expiry date, pickup address)
2. Address is geocoded to coordinates for map display
3. Donation appears on the Home feed and Map with **Available** status
4. Receiver requests the donation — donor receives a notification
5. Donor accepts the request — other pending requests are auto-rejected, a chat room is created, and both parties are notified
6. Donor and receiver use the in-app chat to arrange pickup
7. Donor marks the donation as **Completed**
8. Impact stats update for both donor and receiver

### Expiry handling

- Donations with a past expiry date are **filtered out of public feeds** (Home and Map)
- In the donor's "My Donations" screen, expired items remain visible with an **Expired** badge in red
- On screen load, the app detects newly expired donations and sends the donor a notification

---

## Role-Based Access

| Feature | Donor | Receiver |
|---|---|---|
| Create donations | Yes | No |
| View donation feed | Yes | Yes |
| Request a donation | No | Yes |
| Manage requests | Yes | No |
| In-app chat | Yes | Yes |
| Impact stats | Total donated, kg | Total received, kg |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- A [Supabase](https://supabase.com/) project

### Installation

```bash
git clone https://github.com/GervasioNeto/food-share.git
cd food-share
npm install
```

### Environment setup

Create a `.env` file at the project root based on `.env.example`:

```bash
cp .env.example .env
```

Fill in your Supabase project credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database

Run the SQL in [`docs/schema.sql`](docs/schema.sql) in the Supabase SQL Editor to create all required tables.

### Running the app

```bash
npx expo start
```

| Platform | Command |
|---|---|
| Android | `npx expo start --android` |
| iOS | `npx expo start --ios` |
| Web | `npx expo start --web` |

---

## Database Schema

| Table | Description |
|---|---|
| `profiles` | User data: name, role (donor/receiver), phone, address, coordinates, avatar |
| `donations` | Food items with status lifecycle (available → reserved → completed) and expiry date |
| `requests` | Receiver requests linked to a donation (pending / accepted / rejected) |
| `chat_rooms` | One room created per accepted request, linking donor, receiver, and donation |
| `messages` | Chat messages within a room |
| `notifications` | Activity notifications with type-based routing (request, accepted, rejected, available, general) |

---

## Project Structure

```
src/
├── components/
│   ├── BackButton.tsx        # Reusable back navigation button
│   └── Toast/                # Toast notification utility
│       ├── index.tsx
│       └── toastConfig.tsx
├── contexts/
│   └── AuthContext.tsx       # Global auth state and profile management
├── lib/
│   └── supabase.ts           # Supabase client
├── navigation/
│   ├── index.tsx             # Root navigator with auth gate and deep link handling
│   └── navigation.tsx        # Tab and stack route definitions
└── screens/
    ├── LoginScreen.tsx
    ├── RegisterScreen.tsx
    ├── ForgotPasswordScreen.tsx
    ├── ResetPasswordScreen.tsx
    ├── HomeScreen.tsx
    ├── MapScreen.tsx
    ├── DonationDetailScreen.tsx
    ├── NewDonationScreen.tsx
    ├── MyDonationsScreen.tsx
    ├── RequestsScreen.tsx
    ├── ChatListScreen.tsx
    ├── ChatScreen.tsx
    ├── NotificationsScreen.tsx
    ├── NotificationDetailScreen.tsx
    ├── ProfileScreen.tsx
    └── EditProfileScreen.tsx
```

---

## Notes

- The system does **not** process payments between users
- The system does **not** guarantee the sanitary quality of food items
- Intended exclusively for **non-commercial** use
- Requires an active internet connection — no offline mode
