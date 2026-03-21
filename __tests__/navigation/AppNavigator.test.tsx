import React from 'react';
import { render } from '@testing-library/react-native'
import {NavigationContainer} from "@react-navigation/native";
import {AppNavigator } from '../../src/navigation/AppNavigator';

describe('AppNavigator', () => {
    it('should render all 5 tab labels', () => {
        const {getByText} = render(
            <NavigationContainer>
                <AppNavigator />
            </NavigationContainer>
        );

        expect(getByText('Home')).toBeTruthy();
        expect(getByText('Search')).toBeTruthy();
        expect(getByText('Portfolio')).toBeTruthy();
        expect(getByText('Learn')).toBeTruthy();
        expect(getByText('Profile')).toBeTruthy();
    });
});