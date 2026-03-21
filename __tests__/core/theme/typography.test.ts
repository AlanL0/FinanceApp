import { typography } from '../../../src/core/theme/typography';

describe('Typography Scale', () => {
    it('should export font sizes from xs to xxxl', () => {
        expect(typography.fontSize.xs).toBeLessThan(typography.fontsize.sm);
        expect(typography.fontSize.sm).toBeLessThan(typography.fontsize.md);
        expect(typography.fontSize.md).toBeLessThan(typography.fontsize.lg);
        expect(typography.fontSize.lg).toBeLessThan(typography.fontsize.xl);
    });

    it('should export font weights', () => {
        expect(typography.fontWeight.regular).toBeDefined();
        expect(typography.fontWeight.medium).toBeDefined();
        expect(typography.fontWeight.bold).toBeDefined();
    });

    it('should export line heights', () => {
        expect(typography.lineHeight.tight).toBeDefined();
        expect(typography.lineHeight.normal).toBeDefined();
        expect(typography.lineHeight.relaxed).toBeDefined();
    })
})