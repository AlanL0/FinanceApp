import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {View, Text, StyleSheet} from "react-native";
import {colors} from "../core/theme/colors";
import { HomeScreen } from '../features/home/HomeScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';

//Placeholder screens (replaced in later weeks)
const PlaceHolderScreen = ({ name }: { name: string }) => (
    <View style={styles.center}>
        <Text style={styles.text}>{name} Screen</Text>
    </View>
);
const SearchScreen    = () => <PlaceHolderScreen name="Search" />;
const PortfolioScreen = () => <PlaceHolderScreen name="Portfolio" />;
const LearnScreen     = () => <PlaceHolderScreen name="Learn" />;

const Tab = createBottomTabNavigator();

export const AppNavigator = () => (
    <Tab.Navigator screenOptions={{tabBarActiveTintColor: colors.brand.teal,
    tabBarInactiveTintColor: colors.ui.textSec,
    headerShown: false,}}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Portfolio" component={PortfolioScreen} />
        <Tab.Screen name="Learn" component={LearnScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
);

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    text: {fontSize: 18, color: colors.ui.text},
});