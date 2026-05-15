import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {View, Text, StyleSheet} from "react-native";
import {colors} from "../core/theme/colors";
import { HomeScreen } from '../features/home/HomeScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { SearchScreen } from '../features/search/SearchScreen';
import { StockDetailScreen } from '../features/stocks/StockDetailScreen';
import { WatchlistScreen } from '../features/watchlist/WatchlistScreen';
import type { MainTabParamList, SearchStackParamList } from './types';

//Placeholder screens (replaced in later weeks)
const PlaceHolderScreen = ({ name }: { name: string }) => (
    <View style={styles.center}>
        <Text style={styles.text}>{name} Screen</Text>
    </View>
);
const PortfolioScreen = () => <PlaceHolderScreen name="Portfolio" />;
const LearnScreen     = () => <PlaceHolderScreen name="Learn" />;

const Tab = createBottomTabNavigator<MainTabParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();

const SearchStackNavigator = () => (
    <SearchStack.Navigator
        screenOptions={{
            headerTintColor: colors.ui.text,
            headerStyle: { backgroundColor: colors.ui.bg },
            headerShadowVisible: false,
        }}
    >
        <SearchStack.Screen
            name="SearchHome"
            component={SearchScreen}
            options={{ headerShown: false }}
        />
        <SearchStack.Screen
            name="StockDetail"
            component={StockDetailScreen}
            options={({ route }) => ({ title: route.params.symbol.toUpperCase() })}
        />
        <SearchStack.Screen
            name="Watchlist"
            component={WatchlistScreen}
            options={{ title: 'Watchlist' }}
        />
    </SearchStack.Navigator>
);

export const AppNavigator = () => (
    <Tab.Navigator screenOptions={{tabBarActiveTintColor: colors.brand.teal,
    tabBarInactiveTintColor: colors.ui.textSec,
    headerShown: false,}}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Search" component={SearchStackNavigator} />
        <Tab.Screen name="Portfolio" component={PortfolioScreen} />
        <Tab.Screen name="Learn" component={LearnScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
);

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    text: {fontSize: 18, color: colors.ui.text},
});
