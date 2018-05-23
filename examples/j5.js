import five from 'johnny-five';

import AikoIO from '../src/index.js';

const board = five.Board({
    io: new AikoIO({
        platform: 'AIKO32',
        transport: {
            type: 'mqtt',
            host: 'mqtt://iot.local',
            topic: 'aiko_esp/3914cc/0',
        },
    }),
});

board.on('ready', () => {

    console.log("ready");

    let led = new five.Led({pin: 22});
    led.blink(5000);

});
