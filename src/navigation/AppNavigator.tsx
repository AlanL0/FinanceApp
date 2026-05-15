import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Pressable, View, Text, StyleSheet } from 'react-native';
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

interface HeaderBackButtonProps {
    onPress: () => void;
}

const HeaderBackButton = ({ onPress }: HeaderBackButtonProps) => (
    <Pressable
        accessibilityLabel="Back"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onPress}
        style={({ pressed }) => [
            styles.headerBackButton,
            pressed && styles.headerBackButtonPressed,
        ]}
        testID="header-back-button"
    >
        <Text style={styles.headerBackButtonText}>Back</Text>
    </Pressable>
);

function createBackHeaderOptions(onBack: () => void): NativeStackNavigationOptions {
    return {
        headerBackVisible: false,
        headerBackTitle: 'Back',
        headerBackButtonDisplayMode: 'generic',
        headerBackTitleStyle: styles.headerBackTitle,
        scrollEdgeEffects: { top: 'hidden' },
        unstable_headerLeftItems: ({ canGoBack }) => (
            canGoBack ? [
                {
                    type: 'button',
                    label: 'Back',
                    labelStyle: styles.headerBackNativeLabel,
                    tintColor: colors.brand.teal,
                    variant: 'plain',
                    hidesSharedBackground: true,
                    sharesBackground: false,
                    onPress: onBack,
                },
            ] : []
        ),
        headerLeft: ({ canGoBack }) => (
            canGoBack ? <HeaderBackButton onPress={onBack} /> : null
        ),
    };
}

const SearchStackNavigator = () => (
    <SearchStack.Navigator
        screenOptions={({ navigation }) => ({
            headerTintColor: colors.ui.text,
            headerStyle: { backgroundColor: colors.ui.bg },
            headerShadowVisible: false,
            ...createBackHeaderOptions(() => navigation.goBack()),
        })}
    >
        <SearchStack.Screen
            name="SearchHome"
            component={SearchScreen}
            options={{ headerShown: false, title: 'Back' }}
        />
        <SearchStack.Screen
            name="StockDetail"
            component={StockDetailScreen}
            options={{ headerShown: false }}
        />
        <SearchStack.Screen
            name="Watchlist"
            component={WatchlistScreen}
            options={{ headerShown: false, gestureEnabled: false }}
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
    headerBackButton: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 2,
        marginLeft: -4,
        paddingHorizontal: 4,
        paddingVertical: 8,
    },
    headerBackButtonPressed: {
        opacity: 0.55,
    },
    headerBackButtonText: {
        color: colors.brand.teal,
        fontSize: 16,
        fontWeight: '600',
    },
    headerBackNativeLabel: {
        color: colors.brand.teal,
        fontSize: 16,
        fontWeight: '600',
    },
    headerBackTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
});
