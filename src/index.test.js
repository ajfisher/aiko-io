import AikoIO from './index.js';

test('Constructor sets up as expected', () => {

    expect(() => { new AikoIO() }).toThrow(/options/i);
});
