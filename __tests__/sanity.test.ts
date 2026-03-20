describe('Test Environment', () => {
    it('should run a basic test', () => {
        expect(1 + 1).toBe(2);
    });

    it('should support async tests', async () => {
        const result = await Promise.resolve('hello');
        expect(result).toBe('hello');
    });
});