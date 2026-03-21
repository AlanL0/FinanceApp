import { theme } from '../../src/core/theme';

describe('Theme barrel export', () => {
    it('should export colors, typography, and spacing', () =>{
        expect(theme.colors).toBeDefined();
        expect(theme.typography).toBeDefined();
        expect(theme.spacing).toBeDefined();
    });
});

