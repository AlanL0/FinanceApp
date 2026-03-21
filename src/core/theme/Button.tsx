import React from 'react';
import {TouchableOpacity, Text, StyleSheet, ViewStyle, Touchable} from "react-native";
import { colors } from './colors'
import {typography} from "./typography";
import { spacing } from "./spacing";

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
    label: string;
    onPress: () => void;
    variant?: Variant;
    testID?: string;
}

const variantStyles: Record<Variant, ViewStyle> = {
    primary: { backgroundColor: colors.teal},
    secondary: {backgroundColor: colors.navy} ,
    danger: {backgroundColor: colors.danger},
};

export const Button = ({ label, onPress, variant = 'primary', testID }) => (
    <TouchableOpacity
        style={[styles.base, variantStyles[variant]]}
        onPress={onPress}
        testID={testID}
    >
        <Text style={styles.label}> {label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    base: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 8,
        alignItems: 'center',
    },
    label: {
        color: '#FFFFFF',
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semiBold,
    },
});

