import { typography } from '../../../src/core/theme/typography';

describe('Typography Scale', () => {
    it('should export font sizes from xs to xxxl', () => {
        expect(typography.fontSize.xs).toBeLessThan(typography.fontSize.sm);
        expect(typography.fontSize.sm).toBeLessThan(typography.fontSize.md);
        expect(typography.fontSize.md).toBeLessThan(typography.fontSize.lg);
        expect(typography.fontSize.lg).toBeLessThan(typography.fontSize.xl);
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