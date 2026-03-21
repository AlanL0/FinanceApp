import { spacing} from '../../../src/core/theme/spacing';

describe('Spacing Scale', () => {
    it('should follow a consistent multiplier pattern', () => {
        expect(spacing.xs).toBe(4);
        expect(spacing.sm).toBe(8);
        expect(spacing.md).toBe(16);
        expect(spacing.lg).toBe(24);
        expect(spacing.xl).toBe(32);
        expect(spacing.xxl).toBe(48);
    });
});