import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { store, persistor } from './redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import { StripeProvider } from '@stripe/stripe-react-native';
import DefaultScreen from './pages/DefaultScreen';
import OnboardingScreen from './pages/OnboardingScreen';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import LoaderScreen from './pages/LoaderScreen';
import HomeScreen from './pages/HomeScreen';
import CartScreen from './pages/CartScreen';
import AuctionListingScreen from './pages/AuctionListingScreen';
import CreateStreamScreen from './pages/CreateStreamScreen';
import CalendarScreen from './pages/CalendarScreen';
import ProfileScreen from './pages/ProfileScreen';
import MyOrdersScreen from './pages/MyOrdersScreen_Old';
import SellerOrdersScreen from './pages/SellerOrdersScreen';
import SellerProductsScreen from './pages/SellerProductsScreen';
import CreateProductScreen from './pages/CreateProductScreen';
import CreatorStreamScreen from './pages/CreatorStreamScreen';
import AdsScreen from './pages/AdsScreen';
import Notification from './pages/Notification';
import Shipments from './pages/Shipment';
import ShipmentDetailScreen from './pages/Shipment/ShipmentDetailScreen';
import Chats from './pages/Chats';
import Messages from './pages/Chats/Messages';
import FavouriteScreen from './pages/Profile/FavouriteScreen';
import CompetitionsSettings from './pages/Competition';
import Competition from './pages/Competition/Competition';
import SingleProductPage from './pages/SingleProductPage';
import CheckoutScreen from './pages/CheckoutScreen';
import BuyerOrderScreen from './pages/BuyerOrderScreen';
import OrderTrackingScreen from './pages/OrderTrackingScreen';
import RatingScreen from './pages/RatingScreen';
import SupportScreen from './pages/Support/SupportScreen';
import LiveSupportScreen from './pages/Support/LiveSupportScreen';
import ProfileDetailScreen from './pages/ProfileDetailScreen';
import PromotionDetailScreen from './pages/PromotionDetailScreen';
import PromotionScreen from './pages/PromotionScreen';
import CreatePost from './pages/CreatePost';
import ViewPost from './pages/ViewPost';
import TransactionHistory from './pages/TransactionHistory';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <StripeProvider publishableKey="pk_test_51OjJpTASyMRcymO6x2PBK1nrHChycNMNXj7HHvTRffOp5xufCj3WRSCLoep1tGp5Ilx3IWj7ck5yqrwEH8VSRKn80055Kvyelu">
        {/* <StripeProvider publishableKey="pk_live_51LR2F5EbzamKzibnbnN6mhXfOU0q5lEaRTLuWDjn9m74dsv5tXj0eyzPmuTGcSFDgtlBbNG3yv3FxkJM24uUAoRp00PYi28zEN"> */}
          <SafeAreaProvider>
            <NavigationContainer>
              <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
                <Stack.Screen name="Default" component={DefaultScreen} />
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Loader" component={LoaderScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Cart" component={CartScreen} />
                <Stack.Screen name="CreatorStream" component={CreatorStreamScreen} />
                <Stack.Screen name="Categories" component={AuctionListingScreen} />
                <Stack.Screen name="Add" component={CreateStreamScreen} />
                <Stack.Screen name="Calendar" component={CalendarScreen} />
                <Stack.Screen name="MyOrders" component={BuyerOrderScreen} />
                <Stack.Screen name="SellerProducts" component={SellerProductsScreen} />
                <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} />
                <Stack.Screen name="CreateProduct" component={CreateProductScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Ads" component={AdsScreen} />
                <Stack.Screen name="Notification" component={Notification} />
                <Stack.Screen name="shipments" component={Shipments} />
                <Stack.Screen name="shipment_detail" component={ShipmentDetailScreen} />
                <Stack.Screen name="chats" component={Chats} />
                <Stack.Screen name="messages" component={Messages} />
                <Stack.Screen name="favourite" component={FavouriteScreen} />
                <Stack.Screen name="competitions/settings" component={CompetitionsSettings} />
                <Stack.Screen name="competition" component={Competition} />
                <Stack.Screen name="single_product" component={SingleProductPage} />
                <Stack.Screen name="checkout" component={CheckoutScreen} />
                <Stack.Screen name="order_tracking" component={OrderTrackingScreen} />
                <Stack.Screen name="order_review" component={RatingScreen} />
                <Stack.Screen name="support" component={SupportScreen} />
                <Stack.Screen name="profile_details" component={ProfileDetailScreen} />
                <Stack.Screen name="live_support" component={LiveSupportScreen} />
                <Stack.Screen name="promotion" component={PromotionScreen} />
                <Stack.Screen name="promotion_details" component={PromotionDetailScreen} />
                <Stack.Screen name="create_post" component={CreatePost} />
                <Stack.Screen name="view_post" component={ViewPost} />
                <Stack.Screen name="transaction_history" component={TransactionHistory} />
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaProvider>
        </StripeProvider>
      </PersistGate>
    </Provider>
  );
}
