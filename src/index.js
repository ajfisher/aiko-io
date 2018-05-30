/* This provides the core functionality for the various
 * parts of the Aiko IO board
 */

import { EventEmitter } from 'events';


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
const serial = Symbol('serial');
const serialQueue = Symbol('serialQueue');
const addToSerialQueue = Symbol('addToSerialQueue');
const serialPump = Symbol('serialPump');
const isSerialProcessing = Symbol('isSerialProcessing');
const isSerialOpen = Symbol('isSerialOpen');

const aikoModule = Symbol('aikoModule');
// partially hide this so it can't be used to just randomly send messages
const client = Symbol('client');
const topic = Symbol('topic');


export default class AikoIO extends EventEmitter {
	constructor (options) {
		super();

		if (!options) {
			throw new Error('Options are required');
		}

		const { enableSerial = false, enableSoftPwm = false, transport = {} } = options;

		Object.defineProperties(this, {

			[aikoModule]: {
				writable: true,
				value: 'aiko'
			},
/**			[raspiBoardModule]: {
				writable: true,
				value: platform['raspi-board']
			},

			[raspiGpioModule]: {
				writable: true,
				value: platform['raspi-gpio']
			},

			[raspiI2cModule]: {
				writable: true,
				value: platform['raspi-i2c']
			},

			[raspiLedModule]: {
				writable: true,
				value: platform['raspi-led']
			},

			[raspiPwmModule]: {
				writable: true,
				value: platform['raspi-pwm']
			},

			[raspiSerialModule]: {
				writable: true,
				value: platform['raspi-serial']
			},

			[raspiSoftPwmModule]: {
				writable: true,
				value: platform['raspi-soft-pwm']
			}**/

		});

		Object.defineProperties(this, {

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
				//value: new this[raspiI2cModule].I2C()
                value: 0
			},

			[i2cDelay]: {
				writable: true,
				value: 0
			},

			[serialQueue]: {
				value: []
			},

			[isSerialProcessing]: {
				writable: true,
				value: false
			},

			[isSerialOpen]: {
				writable: true,
				value: false
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
            Object.defineProperties(this, {

                transport: {
                    enumerable: true,
                    value: transport.type,
                },

                host: {
                    enumerable: true,
                    value: transport.host,
                },

                topic: {
                    // use this as the public value of the topic used
                    enumerable: true,
                    value: transport.topic,
                },
                [topic]: {
                    // this is used for internal purposes so it can keep
                    // the housekeeping topics a little more tidy.
                    enumerable: false,
                    value: transport.topic + "/in",
                }
            });
        }

        console.log("After transport", this);

		if (enableSerial) {
			Object.defineProperties(this, {

				/**        [raspiSerialModule]: {
		  writable: true,
		  value: platform['raspi-serial']
		},

		[serial]: {
		  writable: true,
		  value: new this[raspiSerialModule].Serial()
		},

		SERIAL_PORT_IDs: {
		  enumerable: true,
		  value: Object.freeze({
			HW_SERIAL0: this[raspiSerialModule].DEFAULT_PORT,
			DEFAULT: this[raspiSerialModule].DEFAULT_PORT
		  })
		}**/

			});
		} else {
			/**Object.defineProperties(this, {

				SERIAL_PORT_IDs: {
					enumerable: true,
					value: Object.freeze({})
				}
			});**/
		}


        this.init = () => {

            // check transport
            if (this.transport == 'mqtt') {
                console.log('Attempting connection')
                this[client] = mqtt.connect(this.host);

                this[client].on('connect', () => {
                    console.log('we are connected!!!!');

                    console.log("Doing subscription", this.topic + "/#");
                    this[client].subscribe(this.topic + "/#");

                    this[isReady] = true;
                    this.emit('ready');
                    this.emit('connect');
                });

                // refactor this garbage out properly
                this[client].on('message', function (topic, message) {
                    // message is Buffer
                    console.log(message.toString())
                });
            }
            // connect to device
            // when connected issue ready
            // idf error throw error;.
        };

        this.init();
	}

    // now implement the Plugin IO interface

    pinMode(pin, mode) {
        //throw new Error("Not implemented");
        console.warn("Not implemented");
        console.log(mode);
    }

    analogRead(pin) {
        console.warn("Not implemented");
    }

    analogWrite(pin, value) {
        console.warn("Not implemented");
    }

    digitalRead(pin) {
        console.warn("Not implemented");
    }

    digitalWrite(pin, value) {

        // send a message over the transport to write to the pin.
        let msg = "(nb:digital_write " + pin + " " + value + ")";

        console.log(this[topic], msg);
        this[client].publish(this[topic], msg);

    }

    pwmWrite(pin, value) {
        console.warn("Not implemented");
    }
}



