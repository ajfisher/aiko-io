'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _map = require('./map.js');

var _peripheral = require('./peripheral.js');

var _utils = require('./utils.js');

var _mqtt = require('mqtt');

var _mqtt2 = _interopRequireDefault(_mqtt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* This provides the core functionality for the various
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * parts of the Aiko IO board
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

// Constants
var INPUT_MODE = 0;
var OUTPUT_MODE = 1;
var ANALOG_MODE = 2;
var PWM_MODE = 3;
var SERVO_MODE = 4;
var UNKNOWN_MODE = 99;

var LOW = 0;
var HIGH = 1;

var DIGITAL_READ_MSEC = 20;

var LED_PIN = 22;

// Private symbols
var isReady = Symbol('isReady');
var pins = Symbol('pins');
var instances = Symbol('instances');
var analogPins = Symbol('analogPins');
var getPinInstance = Symbol('getPinInstance');
var i2c = Symbol('i2c');
var i2cDelay = Symbol('i2cDelay');
var i2cRead = Symbol('i2cRead');
var i2cCheckAlive = Symbol('i2cCheckAlive');
var pinMode = Symbol('pinMode');
var message_handler = Symbol('message_handler');
var message_parser = Symbol('message_parser');

var aikoModule = Symbol('aikoModule');
// partially hide this so it can't be used to just randomly send messages
var client = Symbol('client');
var intopic = Symbol('Device inbound topic');
var outtopic = Symbol('Device outbound topic');

var log = console.info;

var AikoIO = function (_EventEmitter) {
  _inherits(AikoIO, _EventEmitter);

  function AikoIO(options) {
    var _Object$definePropert;

    _classCallCheck(this, AikoIO);

    var _this = _possibleConstructorReturn(this, (AikoIO.__proto__ || Object.getPrototypeOf(AikoIO)).call(this));

    if (!options) {
      throw new Error('Options are required');
    }

    var _options$enableSerial = options.enableSerial,
        enableSerial = _options$enableSerial === undefined ? false : _options$enableSerial,
        _options$enableSoftPw = options.enableSoftPwm,
        enableSoftPwm = _options$enableSoftPw === undefined ? false : _options$enableSoftPw,
        _options$transport = options.transport,
        transport = _options$transport === undefined ? {} : _options$transport,
        quiet = options.quiet;


    if (quiet) {
      log = function log() {};
    }

    Object.defineProperties(_this, (_Object$definePropert = {}, _defineProperty(_Object$definePropert, aikoModule, {
      writable: true,
      value: 'aiko'
    }), _defineProperty(_Object$definePropert, 'name', {
      enumerable: true,
      value: 'Aiko32-IO'
    }), _defineProperty(_Object$definePropert, instances, {
      writable: true,
      value: []
    }), _defineProperty(_Object$definePropert, isReady, {
      writable: true,
      value: false
    }), _defineProperty(_Object$definePropert, 'isReady', {
      enumerable: true,
      get: function get() {
        return this[isReady];
      }
    }), _defineProperty(_Object$definePropert, pins, {
      writable: true,
      value: []
    }), _defineProperty(_Object$definePropert, 'pins', {
      enumerable: true,
      get: function get() {
        return this[pins];
      }
    }), _defineProperty(_Object$definePropert, analogPins, {
      writable: true,
      value: []
    }), _defineProperty(_Object$definePropert, 'analogPins', {
      enumerable: true,
      get: function get() {
        return this[analogPins];
      }
    }), _defineProperty(_Object$definePropert, i2c, {
      writable: true,
      // value: new this[raspiI2cModule].I2C()
      value: 0
    }), _defineProperty(_Object$definePropert, i2cDelay, {
      writable: true,
      value: 0
    }), _defineProperty(_Object$definePropert, 'MODES', {
      enumerable: true,
      value: Object.freeze({
        INPUT: INPUT_MODE,
        OUTPUT: OUTPUT_MODE,
        ANALOG: ANALOG_MODE,
        PWM: PWM_MODE,
        SERVO: SERVO_MODE
      })
    }), _defineProperty(_Object$definePropert, 'HIGH', {
      enumerable: true,
      value: HIGH
    }), _defineProperty(_Object$definePropert, 'LOW', {
      enumerable: true,
      value: LOW
    }), _defineProperty(_Object$definePropert, 'defaultLed', {
      enumerable: true,
      value: LED_PIN
    }), _Object$definePropert));

    if (transport) {
      var _Object$definePropert2;

      if (typeof transport.type == 'undefined') {
        throw new Error('No transport type defined');
      } else if (transport.type != 'mqtt') {
        throw new Error('Only mqtt transport type supported');
      }

      if (typeof transport.host == 'undefined') {
        throw new Error('No host specified');
      }

      if (typeof transport.topic == 'undefined') {
        throw new Error('No topic specified');
      }

      Object.defineProperties(_this, (_Object$definePropert2 = {

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
        }
      }, _defineProperty(_Object$definePropert2, intopic, {
        // this is used for internal purposes so it can keep
        // the housekeeping topics a little more tidy.
        enumerable: false,
        value: transport.topic + '/in'
      }), _defineProperty(_Object$definePropert2, outtopic, {
        // this is used for internal purposes so we can keep topics a bit
        // more tidy.
        enumerable: false,
        value: transport.topic + '/out'
      }), _Object$definePropert2));
    }

    // console.log('After transport', this);

    _this.init = function () {
      // set up the pin mappings
      var pin_mapping = _map.ESP32;
      _this[pins] = [];

      Object.keys(pin_mapping).forEach(function (pin) {
        // console.log(pin);
        var pin_info = pin_mapping[pin];
        var supported_modes = [];

        if (pin_info.peripherals.indexOf('gpio') != -1) {
          supported_modes.push(INPUT_MODE, OUTPUT_MODE);
        }
        if (pin_info.peripherals.indexOf('pwm') != -1) {
          supported_modes.push(PWM_MODE, SERVO_MODE);
        }
        if (pin_info.peripherals.indexOf('adc') != -1) {
          supported_modes.push(ANALOG_MODE);
        }

        var instance = _this[instances][pin] = {
          peripheral: null,
          mode: supported_modes.indexOf(OUTPUT_MODE) == -1 ? UNKNOWN_MODE : OUTPUT_MODE,

          // cache the previously written value
          previous_written_value: undefined,
          previous_read_value: undefined
          // console.log(instance);

        };_this[pins][pin] = Object.create(null, {
          supportedModes: {
            enumerable: true,
            value: Object.freeze(supported_modes)
          },
          mode: {
            enumerable: true,
            get: function get() {
              return instance.mode;
            }
          },
          value: {
            enumerable: true,
            get: function get() {
              switch (instance.mode) {
                case INPUT_MODE:
                  return instance.peripheral.read();
                case OUTPUT_MODE:
                  return instance.previous_written_value;
                default:
                  return null;
              }
            },
            set: function set(value) {
              if (instance.mode == OUTPUT_MODE) {
                instance.peripheral.write(value);
              }
            }
          }
        });
      });

      console.log(_this[pins]);
      // check transport
      if (_this.transport == 'mqtt') {
        console.log('Attempting connection');
        _this[client] = _mqtt2.default.connect(_this.host);

        _this[client].on('connect', function () {
          console.log('we are connected!!!!');

          console.log('Doing subscription', _this.topic + '/#');
          _this[client].subscribe(_this.topic + '/#');

          _this[isReady] = true;
          _this.emit('ready');
          _this.emit('connect');
        });

        // TODO refactor this garbage out properly
        _this[client].on('message', _this[message_handler].bind(_this));
      }
    };

    _this.init();
    return _this;
  }

  _createClass(AikoIO, [{
    key: message_handler,
    value: function value(t, msg) {
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
  }, {
    key: message_parser,
    value: function value(payload) {
      // handles an aiko_io message and then sends it to the appropriate place
      // to deal with. Aiko IO messages are simply S Expressions.

      var s = new _utils.SExp();
      s.parse(payload);
      console.log(s.expression);
      switch (s.expression[0]) {
        case 'nb:digital_read':
          console.log('Digital read message');
          break;
        default:
          console.log('No idea what it is: ', s.expression[0]);
          break;
      }
    }
  }, {
    key: getPinInstance,
    value: function value(pin) {
      // returns the Pin instance based on the pin number supplied
      var pin_instance = this[instances][pin];
      if (!pin_instance) {
        throw new Error('Unknown pin "' + pin + '"');
      }

      return pin_instance;
    }
    // now implement the Plugin IO interface

  }, {
    key: 'pinMode',
    value: function pinMode(pin, mode) {
      // set the mode of the pin to one of the allowed values.

      var pin_instance = this[getPinInstance](pin);

      var config = {
        pin: pin,
        client: this[client],
        topic: this[intopic]
      };
      var mode_name = 'unknown';

      // check the available supported modes and see if we can do what we want
      // to try and do. If not return an error with appropriate info in it.
      if (this[pins][pin].supportedModes.indexOf(mode) == -1) {
        switch (mode) {
          case INPUT_MODE:
            mode_name = 'input';break;
          case OUTPUT_MODE:
            mode_name = 'output';break;
          case ANALOG_MODE:
            mode_name = 'analog';break;
          case PWM_MODE:
            mode_name = 'pwm';break;
          case SERVO_MODE:
            mode_name = 'servo';break;
          default:
            mode_name = 'other';break;
        }
        throw new Error('Pin "' + pin + '" does not support "' + mode_name + '" mode');
      }

      // if we're here we know we can do something with the pin so set it up
      // as the right type of peripheral.
      switch (mode) {
        case INPUT_MODE:
          console.log('Creating input peripheral');
          pin_instance.peripheral = new _peripheral.DigitalInput(config);
          break;
        case OUTPUT_MODE:
          pin_instance.peripheral = new _peripheral.DigitalOutput(config);
          break;
        case ANALOG_MODE:
        case PWM_MODE:
        case SERVO_MODE:
          log('no peripheral implemented');
          break;
        default:
          log('Unkown mode ' + mode);
      }

      // create and publish the message to the client.
      var msg = '(nb:pin_mode ' + pin + ' ' + mode + ')';
      this[client].publish(this[intopic], msg);

      log('AikoIO, set pin ' + pin + ' to mode ' + mode + ' using ' + this[intopic] + ':' + msg);
    }
  }, {
    key: 'analogRead',
    value: function analogRead(pin) {
      console.warn('Not implemented');
    }
  }, {
    key: 'analogWrite',
    value: function analogWrite(pin, value) {
      // this.pwmWrite(pin, value);
      console.warn('Not implemented');
    }
  }, {
    key: 'digitalRead',
    value: function digitalRead(pin, handler) {
      var _this2 = this;

      // send a message to trigger the pin Mode of the particular pin to
      // DIGITAL READ
      var pin_instance = this[getPinInstance](pin);

      // boot the pin into digital input mode
      if (pin_instance.mode != INPUT_MODE) {
        this.pinMode(pin, INPUT_MODE);
      }

      // now set up an interval to provide the data back on a clock.
      var reader = setInterval(function () {
        var value = void 0;
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
          _this2.emit('digital-read-' + pin, value);
        }
      }, DIGITAL_READ_MSEC);
    }
  }, {
    key: 'digitalWrite',
    value: function digitalWrite(pin, value) {
      // send a message over the transport to write to the pin.

      var pin_instance = this[getPinInstance](pin);

      if (pin_instance.previous_written_value !== value) {
        pin_instance.peripheral.write(value);
        pin_instance.previous_written_value = value;
      }
    }
  }, {
    key: 'pwmWrite',
    value: function pwmWrite(pin, value) {
      console.warn('Not implemented');
    }
  }]);

  return AikoIO;
}(_events.EventEmitter);

exports.default = AikoIO;