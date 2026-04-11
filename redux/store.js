import { configureStore, combineReducers } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import favouriteReducer from './favouriteSlice';
import authReducer from './authSlice';
import streamReducer from './streamSlice';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['cart', 'favourite', 'auth', 'stream'],
};

const rootReducer = combineReducers({
  cart: cartReducer,
  favourite: favouriteReducer,
  auth: authReducer,
  stream: streamReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
});

export const persistor = persistStore(store);
