'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DigitalOutput = exports.DigitalInput = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var mqtt_client = Symbol('MQTT Client');
var mqtt_topic = Symbol('MQTT Topic');

var LOW = 0;
var HIGH = 1;

var Peripheral = function (_EventEmitter) {
  _inherits(Peripheral, _EventEmitter);

  // Peripheral is a device that's attached to a specific pin
  function Peripheral(config) {
    _classCallCheck(this, Peripheral);

    var _this = _possibleConstructorReturn(this, (Peripheral.__proto__ || Object.getPrototypeOf(Peripheral)).call(this));
    // set up the peripheral


    var pin = config.pin,
        client = config.client,
        topic = config.topic;


    if (typeof pin === 'undefined') {
      throw new Error('Peripherals need a pin and there was none defined');
    }

    _this[mqtt_client] = client;
    _this.pin = pin;
    _this[mqtt_topic] = topic;
    _this.alive = true;
    return _this;
  }

  return Peripheral;
}(_events.EventEmitter);

var DigitalInput = exports.DigitalInput = function (_Peripheral) {
  _inherits(DigitalInput, _Peripheral);

  // Digital input is a peripheral that only does input reads
  function DigitalInput(config) {
    _classCallCheck(this, DigitalInput);

    var _this2 = _possibleConstructorReturn(this, (DigitalInput.__proto__ || Object.getPrototypeOf(DigitalInput)).call(this, config));

    _this2._value = LOW;
    return _this2;
  }

  _createClass(DigitalInput, [{
    key: 'read',
    value: function read() {
      // read in this context provides the latest value that's been set.
      // so this should be coming off the message buffer.
      if (!this.alive) {
        throw new Error('Attempted to read on a destroyed peripheral');
      }
      return this.value;
    }
  }, {
    key: 'value',
    get: function get() {
      return this._value;
    }
  }]);

  return DigitalInput;
}(Peripheral);

var DigitalOutput = exports.DigitalOutput = function (_Peripheral2) {
  _inherits(DigitalOutput, _Peripheral2);

  // digital output is a peripheral that only does output writes
  function DigitalOutput(config) {
    _classCallCheck(this, DigitalOutput);

    var _this3 = _possibleConstructorReturn(this, (DigitalOutput.__proto__ || Object.getPrototypeOf(DigitalOutput)).call(this, config));

    _this3._value = LOW;
    return _this3;
  }

  _createClass(DigitalOutput, [{
    key: 'write',
    value: function write(value) {
      if (!this.alive) {
        throw new Error('Tried to write to destroyed peripheral');
      }
      if ([LOW, HIGH].indexOf(value) === -1) {
        throw new Error('Digital write values only 0,1, provided: ' + val);
      }
      this._value = value;
      var msg = '(nb:digital_write ' + this.pin + ' ' + value + ')';

      this[mqtt_client].publish(this[mqtt_topic], msg);

      console.log('AikoIO, digital write pin ' + this.pin + ' to ' + value + ' using ' + this[mqtt_topic] + ':' + msg);
      // TODO: Determine if this is absolutely necessary
      // this.emit('change', this.value);
    }
  }, {
    key: 'value',
    get: function get() {
      return this._value;
    }
  }]);

  return DigitalOutput;
}(Peripheral);