import five from 'johnny-five';

import AikoIO from '../src/index.js';

const host = process.argv[2] || 'mqtt://iot.eclipse.org';

const board = five.Board({
  io: new AikoIO({
    platform: 'AIKO32',
    transport: {
      type: 'mqtt',
      // host: 'mqtt://iot.local',
      // host: 'mqtt://iot.eclipse.org',
      host,
      topic: 'aiko_esp/4e8770/0'
    }
  })
});

board.on('ready', () => {
  console.log('ready');

  // const led = new five.Led({pin: 32});
  // led.blink(2000);
  //
  const button = new five.Button({pin: 32});
  button.on('press', () => {console.log('press')});
  button.on('hold', () => {console.log('hold')});
  button.on('release', () => {console.log('release')});
});
