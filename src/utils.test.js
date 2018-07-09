import { SExp } from './utils.js';


describe('The s-expression', () => {
  const s = new SExp();

  test('has no expression on construction', () => {
    expect(s.expression).toEqual([]);
  });
});

// take a general example
describe('Parsing an expression string', () => {
  const s = new SExp();
  s.parse('((data "quoted data" 123 4.5)\n(data (!@# (4.5) "(more" "data)")))');
  console.log(s.expression);
  test('will work over multiple lines', () => {
    expect(s.expression.length).toEqual(2);
  });

  test('will handle nested expressions', () => {
    expect(s.expression[0].length).toEqual(4);
    expect(s.expression[1].length).toEqual(2);
  });

  test('will handle deep nesting', () => {
    expect(s.expression[1][1].length).toEqual(4);
  });

  test('handles quoted data properly', () => {
    expect(s.expression[0][1]).toEqual('"quoted data"');
  });

  test('handles special chars', () => {
    expect(s.expression[1][1][0]).toEqual('!@#');
  });

  test('handles quoted ()s', () => {
    expect(s.expression[1][1][2]).toEqual('"(more"');
    expect(s.expression[1][1][3]).toEqual('"data)"');
  });

  test('handles integers', () => {
    expect(s.expression[0][2]).toEqual(123);
  });

  test('handles floats', () => {
    expect(s.expression[0][3]).toEqual(4.5);
  });
});
