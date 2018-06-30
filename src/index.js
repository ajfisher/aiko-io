/* This provides the core functionality for the various
 * parts of the Aiko IO board
 */

import { EventEmitter } from 'events';
import { ESP32 } from './map.js';
import { DigitalInput, DigitalOutput } from './peripheral.js';
import { SExp } from './utils.js';
import mqtt from 'mqtt';

// Constants
const INPUT_MODE = 0;
const OUTPUT_MODE = 1;
const ANALOG_MODE = 2;
const PWM_MODE = 3;
const SERVO_MODE = 4;
const UNKNOWN_MODE = 99;

const LOW = 0;
const HIGH = 1;

const DIGITAL_READ_MSEC = 20;

const LED_PIN = 22;

// Private symbols
const isReady = Symbol('isReady');
const pins = Symbol('pins');
const instances = Symbol('instances');
const analogPins = Symbol('analogPins');
const getPinInstance = Symbol('getPinInstance');
const i2c = Symbol('i2c');
const i2cDelay = Symbol('i2cDelay');
const i2cRead = Symbol('i2cRead');
const i2cCheckAlive = Symbol('i2cCheckAlive');
const pinMode = Symbol('pinMode');
const message_handler = Symbol('message_handler');
const message_parser = Symbol('message_parser');

const aikoModule = Symbol('aikoModule');
// partially hide this so it can't be used to just randomly send messages
const client = Symbol('client');
const intopic = Symbol('Device inbound topic');
const outtopic = Symbol('Device outbound topic');

let log = console.info;

export default class AikoIO extends EventEmitter {
  constructor(options) {
    super();

    if (!options) {
      throw new Error('Options are required');
    }

    const { enableSerial = false, enableSoftPwm = false, transport = {}, quiet } = options;

    if (quiet) {
      log = () => {};
    }

    Object.defineProperties(this, {
      [aikoModule]: {
        writable: true,
        value: 'aiko'
      },

      name: {
        enumerable: true,
        value: 'Aiko32-IO'
      },

      [instances]: {
        writable: true,
        value: []
      },

      [isReady]: {
        writable: true,
        value: false
      },
      isReady: {
        enumerable: true,
        get() {
          return this[isReady];
        }
      },

      [pins]: {
        writable: true,
        value: []
      },
      pins: {
        enumerable: true,
        get() {
          return this[pins];
        }
      },

      [analogPins]: {
        writable: true,
        value: []
      },
      analogPins: {
        enumerable: true,
        get() {
          return this[analogPins];
        }
      },

      [i2c]: {
        writable: true,
        // value: new this[raspiI2cModule].I2C()
        value: 0
      },

      [i2cDelay]: {
        writable: true,
        value: 0
      },

      MODES: {
        enumerable: true,
        value: Object.freeze({
          INPUT: INPUT_MODE,
          OUTPUT: OUTPUT_MODE,
          ANALOG: ANALOG_MODE,
          PWM: PWM_MODE,
          SERVO: SERVO_MODE
        })
      },

      HIGH: {
        enumerable: true,
        value: HIGH
      },
      LOW: {
        enumerable: true,
        value: LOW
      },

      defaultLed: {
        enumerable: true,
        value: LED_PIN
      }
    });

    if (transport) {
      if (typeof(transport.type) == 'undefined') {
        throw new Error('No transport type defined');
      } else if (transport.type != 'mqtt') {
        throw new Error('Only mqtt transport type supported');
      }

      if (typeof(transport.host) == 'undefined') {
        throw new Error('No host specified');
      }

      if (typeof(transport.topic) == 'undefined') {
        throw new Error('No topic specified');
      }

      Object.defineProperties(this, {

        transport: {
          enumerable: true,
          value: transport.type
        },

        host: {
          enumerable: true,
          value: transport.host
        },

        topic: {
          // use this as the public value of the topic used
          enumerable: true,
          value: transport.topic
        },
        [intopic]: {
          // this is used for internal purposes so it can keep
          // the housekeeping topics a little more tidy.
          enumerable: false,
          value: transport.topic + '/in'
        },
        [outtopic]: {
          // this is used for internal purposes so we can keep topics a bit
          // more tidy.
          enumerable: false,
          value: transport.topic + '/out'
        }
      });
    }

    // console.log('After transport', this);

    this.init = () => {
      // set up the pin mappings
      const pin_mapping = ESP32;
      this[pins] = [];

      Object.keys(pin_mapping).forEach((pin) => {
        // console.log(pin);
        const pin_info = pin_mapping[pin];
        const supported_modes = [];

        if (pin_info.peripherals.indexOf('gpio') != -1) {
          supported_modes.push(INPUT_MODE, OUTPUT_MODE);
        }
        if (pin_info.peripherals.indexOf('pwm') != -1) {
          supported_modes.push(PWM_MODE, SERVO_MODE);
        }
        if (pin_info.peripherals.indexOf('adc') != -1) {
          supported_modes.push(ANALOG_MODE);
        }

        const instance = this[instances][pin] = {
          peripheral: null,
          mode: supported_modes.indexOf(OUTPUT_MODE) == -1 ? UNKNOWN_MODE : OUTPUT_MODE,

          // cache the previously written value
          previous_written_value: undefined,
          previous_read_value: undefined
        }
        // console.log(instance);

        this[pins][pin] = Object.create(null, {
          supportedModes: {
            enumerable: true,
            value: Object.freeze(supported_modes)
          },
          mode: {
            enumerable: true,
            get() {
              return instance.mode;
            }
          },
          value: {
            enumerable: true,
            get() {
              switch (instance.mode) {
                case INPUT_MODE:
                  return instance.peripheral.read();
                case OUTPUT_MODE:
                  return instance.previous_written_value;
                default:
                  return null;
              }
            },
            set(value) {
              if (instance.mode == OUTPUT_MODE) {
                instance.peripheral.write(value);
              }
            }
          }
        });
      });

      console.log(this[pins]);
      // check transport
      if (this.transport == 'mqtt') {
        console.log('Attempting connection')
        this[client] = mqtt.connect(this.host);

        this[client].on('connect', () => {
          console.log('we are connected!!!!');

          console.log('Doing subscription', this.topic + '/#');
          this[client].subscribe(this.topic + '/#');

          this[isReady] = true;
          this.emit('ready');
          this.emit('connect');
        });

        // TODO refactor this garbage out properly
        this[client].on('message', this[message_handler].bind(this));
      }
    };

    this.init();
  }

  [message_handler](t, msg) {
    // general handler for mqtt messages coming in
    // message is Buffer

    // check if the message is in our outbound
    if (t === this[intopic]) {
      // console.log('received an inbound message');
    } else if (t === this[outtopic]) {
      // console.log('received a message from the device');
      console.log('This is a data payload coming back so we care about this');
      console.log(msg.toString());
      this[message_parser](msg.toString());
    }
  }

  [message_parser](payload) {
    // handles an aiko_io message and then sends it to the appropriate place
    // to deal with. Aiko IO messages are simply S Expressions.

    const s = new SExp();
    s.parse(payload);
  }

  [getPinInstance](pin) {
    // returns the Pin instance based on the pin number supplied
    const pin_instance = this[instances][pin];
    if (! pin_instance) {
      throw new Error(`Unknown pin "${pin}"`);
    }

    return pin_instance;
  }
  // now implement the Plugin IO interface

  pinMode(pin, mode) {
    // set the mode of the pin to one of the allowed values.

    const pin_instance = this[getPinInstance](pin);

    const config = {
      pin,
      client: this[client],
      topic: this[intopic]
    };
    let mode_name = 'unknown';

    // check the available supported modes and see if we can do what we want
    // to try and do. If not return an error with appropriate info in it.
    if (this[pins][pin].supportedModes.indexOf(mode) == -1) {
      switch (mode) {
        case INPUT_MODE: mode_name = 'input'; break;
        case OUTPUT_MODE: mode_name = 'output'; break;
        case ANALOG_MODE: mode_name = 'analog'; break;
        case PWM_MODE: mode_name = 'pwm'; break;
        case SERVO_MODE: mode_name = 'servo'; break;
        default: mode_name = 'other'; break;
      }
      throw new Error(`Pin "${pin}" does not support "${mode_name}" mode`);
    }

    // if we're here we know we can do something with the pin so set it up
    // as the right type of peripheral.
    switch (mode) {
      case INPUT_MODE:
        console.log('Creating input peripheral');
        pin_instance.peripheral = new DigitalInput(config);
        break;
      case OUTPUT_MODE:
        pin_instance.peripheral = new DigitalOutput(config);
        break;
      case ANALOG_MODE:
      case PWM_MODE:
      case SERVO_MODE:
        log('no peripheral implemented');
        break;
      default:
        log(`Unkown mode ${mode}`);
    }

    // create and publish the message to the client.
    const msg = `(nb:pin_mode ${pin} ${mode})`;
    this[client].publish(this[intopic], msg);

    log(`AikoIO, set pin ${pin} to mode ${mode} using ${this[intopic]}:${msg}`);
  }

  analogRead(pin) {
    console.warn('Not implemented');
  }

  analogWrite(pin, value) {
    // this.pwmWrite(pin, value);
    console.warn('Not implemented');
  }

  digitalRead(pin, handler) {
    // send a message to trigger the pin Mode of the particular pin to
    // DIGITAL READ
    const pin_instance = this[getPinInstance](pin);

    // boot the pin into digital input mode
    if (pin_instance.mode != INPUT_MODE) {
      this.pinMode(pin, INPUT_MODE);
    }

    // now set up an interval to provide the data back on a clock.
    const reader = setInterval(() => {
      let value;
      if (pin_instance.mode == INPUT_MODE) {
        value = pin_instance.peripheral.read();
      } else {
        value = pin_instance.previous_written_value;
      }

      if (value !== pin_instance.previous_read_value) {
        pin_instance.previous_read_value = value;
        if (handler) {
          handler(value);
        }
        this.emit(`digital-read-${pin}`, value);
      }
    }, DIGITAL_READ_MSEC);
  }

  digitalWrite(pin, value) {
    // send a message over the transport to write to the pin.

    const pin_instance = this[getPinInstance](pin);

    if (pin_instance.previous_written_value !== value) {
      pin_instance.peripheral.write(value);
      pin_instance.previous_written_value = value;
    }
  }

  pwmWrite(pin, value) {
    console.warn('Not implemented');
  }
}


