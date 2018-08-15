// creates the pin mapping for the different board types.

export const ESP32 = {
  12: {
    pins: ['IO12'],
    peripherals: ['gpio', 'pwm'],
    gpio: 12
  },
  14: {
    pins: ['IO14'],
    peripherals: ['gpio', 'pwm'],
    gpio: 14
  },
  22: {
    pins: ['IO22'],
    peripherals: ['gpio', 'led', 'pwm'],
    gpio: 22
  },
  25: {
    pins: ['IO25'],
    peripherals: ['gpio', 'pwm'],
    gpio: 25
  },
  26: {
    pins: ['IO26'],
    peripherals: ['gpio', 'pwm'],
    gpio: 26
  },
  27: {
    pins: ['IO27'],
    peripherals: ['gpio', 'pwm'],
    gpio: 27
  },
  32: {
    pins: ['IO32'],
    peripherals: ['gpio', 'pwm'],
    gpio: 32

  },
  34: {
    pins: ['IO34'],
    peripherals: ['gpio', 'pwm'],
    gpio: 34
  },
  35: {
    pins: ['IO35'],
    peripherals: ['gpio', 'pwm'],
    gpio: 35
  }
}
