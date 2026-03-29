import { colors } from '../../../src/core/theme/colors';

describe('Color Tokens', () => {
    it('should export all required brand colors', () => {
        expect(colors.brand.navy).toBeDefined();
        expect(colors.brand.teal).toBeDefined();
        expect(colors.brand.tealLight).toBeDefined();
        expect(colors.brand.tealDark).toBeDefined();
        expect(colors.brand.gold).toBeDefined();
    });

    it('should export semantic colors', () => {
        expect(colors.semantic.positive).toBeDefined();
        expect(colors.semantic.negative).toBeDefined();
        expect(colors.semantic.negativeDk).toBeDefined();
    });

    it('should export UI colors', () => {
        expect(colors.ui.bg).toBeDefined();
        expect(colors.ui.card).toBeDefined();
        expect(colors.ui.text).toBeDefined();
        expect(colors.ui.textSec).toBeDefined();
        expect(colors.ui.border).toBeDefined();
    });

    it('should have valid hex color format', () => {
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        const allColors = [
            ...Object.values(colors.brand),
            ...Object.values(colors.semantic),
            ...Object.values(colors.accent),
            ...Object.values(colors.ui),
        ];
        allColors.forEach(color => {
            expect(color).toMatch(hexRegex);
        });
    });
});
