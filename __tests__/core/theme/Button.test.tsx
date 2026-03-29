import React from 'react';
import { render, fireEvent } from "@testing-library/react-native";
import { Button } from '../../../src/core/theme/Button';

describe('Button component', () => {
    it('should render the label text', () => {
        const { getByText } = render(
            <Button label="Buy Stock" onPress={() => {}} />
        );
        expect(getByText('Buy Stock')).toBeTruthy();
    });

    it('should call onPress when tapped', () => {
        const onPress = jest.fn();
        const {getByText } = render(
            <Button label="Buy Stock" onPress={onPress} />
        );
        fireEvent.press(getByText('Buy Stock'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should apply variant styles', () => {
        const { getByTestId } = render(
            <Button label="Sell" onPress={() => {}} variant="danger" testID="btn" />
        );
        expect(getByTestId('btn')).toBeTruthy();
    });
});
