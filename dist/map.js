'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
// creates the pin mapping for the different board types.

var ESP32 = exports.ESP32 = {
    12: {
        pins: ['IO12'],
        peripherals: ['gpio'],
        gpio: 12
    },
    14: {
        pins: ['IO14'],
        peripherals: ['gpio'],
        gpio: 14
    },
    22: {
        pins: ['IO22'],
        peripherals: ['gpio', 'led'],
        gpio: 22
    },
    25: {
        pins: ['IO25'],
        peripherals: ['gpio'],
        gpio: 25
    },
    26: {
        pins: ['IO26'],
        peripherals: ['gpio'],
        gpio: 26
    },
    27: {
        pins: ['IO27'],
        peripherals: ['gpio'],
        gpio: 27
    },
    32: {
        pins: ['IO32'],
        peripherals: ['gpio'],
        gpio: 32

    },
    34: {
        pins: ['IO34'],
        peripherals: ['gpio'],
        gpio: 34
    },
    35: {
        pins: ['IO35'],
        peripherals: ['gpio'],
        gpio: 35
    }
};