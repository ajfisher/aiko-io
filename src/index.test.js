import AikoIO from './index.js';

test('Constructor sets up as expected', () => {
  expect(() => { new AikoIO() }).toThrow(/options/i);
});

test('Constructor fails with no transport defined', () => {
  expect(() => { new AikoIO({}) }).toThrow(/transport/i);
});

test('Constructor fails with no host', () => {
  expect(() => {
    new AikoIO({
      transport: {type: 'mqtt'}
    })
  }).toThrow(/host/i);
});

test('Constructor fails with no topic defined', () => {
  expect(() => {
    new AikoIO({
      transport: {type: 'mqtt', host: 'mqtt://localhost'}
    })
  }).toThrow(/topic/i);
});

test('IO Plugin fails with MQTT transport not specified properly', () => {
  expect(() => {
    new AikoIO({
      transport: {type: 'mqtt', host: 'mock', topic: 'test'}
    })
  }).toThrow(/Missing protocol/i);
});

// TODO 
// Test for pins after construction
// Implement a mock for the various functions
// implement pin mode
// implement digital write
// test pin normalisation
