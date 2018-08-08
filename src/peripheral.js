'use strict';

import { EventEmitter } from 'events';

const mqtt_client = Symbol('MQTT Client');
const mqtt_topic = Symbol('MQTT Topic');

const LOW = 0;
const HIGH = 1;

class Peripheral extends EventEmitter {
  // Peripheral is a device that's attached to a specific pin
  constructor(config) {
    // set up the peripheral
    super();

    const {pin, client, topic} = config;

    if (typeof(pin) === 'undefined') {
      throw new Error('Peripherals need a pin and there was none defined');
    }

    this[mqtt_client] = client;
    this.pin = pin;
    this[mqtt_topic] = topic;
    this.alive = true;
  }
}

export class DigitalInput extends Peripheral {
  // Digital input is a peripheral that only does input reads
  constructor(config) {
    super(config);

    this._value = LOW;

    this.on(`digital-input-${this.pin}`, (value) => {
      this._value = value;
    });
  }

  get value() {
    return this._value;
  }

  read() {
    // read in this context provides the latest value that's been set.
    // so this should be coming off the message buffer.
    if (!this.alive) {
      throw new Error('Attempted to read on a destroyed peripheral');
    }
    return this.value;
  }
}

export class DigitalOutput extends Peripheral {
  // digital output is a peripheral that only does output writes
  constructor(config) {
    super(config);

    this._value = LOW;
  }

  get value() {
    return this._value;
  }

  write(value) {
    if (!this.alive) {
      throw new Error('Tried to write to destroyed peripheral');
    }
    if ([LOW, HIGH].indexOf(value) === -1) {
      throw new Error('Digital write values only 0,1, provided: ' + val);
    }
    this._value = value;
    const msg = `(nb:digital_write ${this.pin} ${value})`;

    this[mqtt_client].publish(this[mqtt_topic], msg);

    console.log(`AikoIO, digital write pin ${this.pin} to ${value} using ${this[mqtt_topic]}:${msg}`);
    // TODO: Determine if this is absolutely necessary
    // this.emit('change', this.value);
  }
}
