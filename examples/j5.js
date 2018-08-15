import five from 'johnny-five';

import AikoIO from '../src/index.js';

const host = process.argv[2] || 'mqtt://iot.local';

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

  const led = new five.Led({pin: 25});
  led.off();
  setTimeout(() => {
    console.log('setting brightness');
    led.brightness(128);
    setTimeout(() => {
      console.log('setting brightness');
      led.brightness(255);
      setTimeout(() => {
        console.log('fading');
        led.fade(0, 2000);
      }, 5000);
    }, 5000);
  }, 5000);
  /**
  const button = new five.Button({pin: 32});
  button.on('press', () => {console.log('press')});
  button.on('hold', () => {console.log('hold')});
  button.on('release', () => {console.log('release')});
  **/
});
