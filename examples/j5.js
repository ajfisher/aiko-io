import five from 'johnny-five';

import AikoIO from '../src/index.js';

const board = five.Board({
  io: new AikoIO({
    platform: 'AIKO32',
    transport: {
      type: 'mqtt',
      // host: 'mqtt://iot.local',
      host: 'mqtt://iot.eclipse.org',
      topic: 'aiko_esp/4e8770/0'
    }
  })
});

board.on('ready', () => {
  console.log('ready');

  const led = new five.Led({pin: 32});
  led.blink(2000);
});
