'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _map = require('./map.js');

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
var serial = Symbol('serial');
var serialQueue = Symbol('serialQueue');
var addToSerialQueue = Symbol('addToSerialQueue');
var serialPump = Symbol('serialPump');
var isSerialProcessing = Symbol('isSerialProcessing');
var isSerialOpen = Symbol('isSerialOpen');

var aikoModule = Symbol('aikoModule');
// partially hide this so it can't be used to just randomly send messages
var client = Symbol('client');
var topic = Symbol('topic');
var log = console.info;

var AikoIO = function (_EventEmitter) {
	_inherits(AikoIO, _EventEmitter);

	function AikoIO(options) {
		var _Object$definePropert2;

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

		Object.defineProperties(_this, _defineProperty({}, aikoModule, {
			writable: true,
			value: 'aiko'
		}));

		Object.defineProperties(_this, (_Object$definePropert2 = {

			name: {
				enumerable: true,
				value: 'Aiko32-IO'
			}

		}, _defineProperty(_Object$definePropert2, instances, {
			writable: true,
			value: []
		}), _defineProperty(_Object$definePropert2, isReady, {
			writable: true,
			value: false
		}), _defineProperty(_Object$definePropert2, 'isReady', {
			enumerable: true,
			get: function get() {
				return this[isReady];
			}
		}), _defineProperty(_Object$definePropert2, pins, {
			writable: true,
			value: []
		}), _defineProperty(_Object$definePropert2, 'pins', {
			enumerable: true,
			get: function get() {
				return this[pins];
			}
		}), _defineProperty(_Object$definePropert2, analogPins, {
			writable: true,
			value: []
		}), _defineProperty(_Object$definePropert2, 'analogPins', {
			enumerable: true,
			get: function get() {
				return this[analogPins];
			}
		}), _defineProperty(_Object$definePropert2, i2c, {
			writable: true,
			//value: new this[raspiI2cModule].I2C()
			value: 0
		}), _defineProperty(_Object$definePropert2, i2cDelay, {
			writable: true,
			value: 0
		}), _defineProperty(_Object$definePropert2, 'MODES', {
			enumerable: true,
			value: Object.freeze({
				INPUT: INPUT_MODE,
				OUTPUT: OUTPUT_MODE,
				ANALOG: ANALOG_MODE,
				PWM: PWM_MODE,
				SERVO: SERVO_MODE
			})
		}), _defineProperty(_Object$definePropert2, 'HIGH', {
			enumerable: true,
			value: HIGH
		}), _defineProperty(_Object$definePropert2, 'LOW', {
			enumerable: true,
			value: LOW
		}), _defineProperty(_Object$definePropert2, 'defaultLed', {
			enumerable: true,
			value: LED_PIN
		}), _Object$definePropert2));

		if (transport) {
			Object.defineProperties(_this, _defineProperty({

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
			}, topic, {
				// this is used for internal purposes so it can keep
				// the housekeeping topics a little more tidy.
				enumerable: false,
				value: transport.topic + "/in"
			}));
		}

		console.log("After transport", _this);

		if (enableSerial) {
			Object.defineProperties(_this, {

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

		_this.init = function () {

			// set up the pin mappings
			var pin_mapping = _map.ESP32;
			_this[pins] = [];

			Object.keys(pin_mapping).forEach(function (pin) {
				console.log(pin);
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

				//const instance = this[instances][pin] = {
			});

			// check transport
			if (_this.transport == 'mqtt') {
				console.log('Attempting connection');
				_this[client] = _mqtt2.default.connect(_this.host);

				_this[client].on('connect', function () {
					console.log('we are connected!!!!');

					console.log("Doing subscription", _this.topic + "/#");
					_this[client].subscribe(_this.topic + "/#");

					_this[isReady] = true;
					_this.emit('ready');
					_this.emit('connect');
				});

				// refactor this garbage out properly
				_this[client].on('message', function (topic, message) {
					// message is Buffer
					console.log(message.toString());
				});
			}
		};

		_this.init();
		return _this;
	}

	// now implement the Plugin IO interface

	_createClass(AikoIO, [{
		key: 'pinMode',
		value: function pinMode(pin, mode) {
			// set the mode of the pin to one of the allowed values.
			var mode_name = 'unknown';

			for (var key in this.MODES) {
				if (this.MODES[key] === mode) {
					mode_name = key;
				}
			}

			var msg = '(nb:pin_mode ' + pin + ' ' + mode + ')';

			this[client].publish(this[topic], msg);

			log(this[topic], msg);
			log('AikoIO, set pin ' + pin + ' to mode ' + mode);
		}
	}, {
		key: 'analogRead',
		value: function analogRead(pin) {
			console.warn("Not implemented");
		}
	}, {
		key: 'analogWrite',
		value: function analogWrite(pin, value) {
			this.pwmWrite(pin, value);
		}
	}, {
		key: 'digitalRead',
		value: function digitalRead(pin) {
			console.warn("Not implemented");
		}
	}, {
		key: 'digitalWrite',
		value: function digitalWrite(pin, value) {

			// send a message over the transport to write to the pin.
			var msg = '(nb:digital_write ' + pin + ' ' + value + ')';

			this[client].publish(this[topic], msg);

			log(this[topic], msg);
			log('AikoIO, digital write pin ' + pin + ' to ' + value);
		}
	}, {
		key: 'pwmWrite',
		value: function pwmWrite(pin, value) {
			console.warn("Not implemented");
		}
	}]);

	return AikoIO;
}(_events.EventEmitter);

exports.default = AikoIO;