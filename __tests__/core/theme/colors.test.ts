import { colors } from '../../../src/core/theme/colors';

describe('Color Tokens', () => {
    it('should export all required brand colors', () => {
        expect(colors.navy).toBeDefined();
        expect(colors.teal).toBeDefined();
        expect(colors.tealLight).toBeDefined();
        expect(colors.tealDark).toBeDefined();
        expect(colors.gold).toBeDefined();
    });

    it('should export semantic colors', () => {
        expect(colors.success).toBeDefined(); // greem for gains
        expect(colors.danger).toBeDefined(); // red for losses
        expect(colors.warning).toBeDefined();
        expect(colors.background).toBeDefined();
        expect(colors.text).toBeDefined();
        expect(colors.textSecondary).toBeDefined();
    });

    it('should have valid hex color format' , () => {
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        Object.values(colors).forEach(color => {
            expect(color).toMatch(hexRegex);
        });
    });
});