'use strict'

export class SExp {
  // Simple S Expression Parser
  constructor(options) {
    this.expression = [];
  }

  parse(data) {
    // takes a string and returns the atoms of the s-expression as an array
    // of items. Each of these items can be it's own s-expression which can
    // then be used to parse things further.
    // eg: ((data "quoted data" 123 4.5)
    //      (data (!@# (4.5) "(more" "data)")))

    // parsing:
    // regex into collection groups.
    // \s*(?:(\()|(\))|(\-?\d+\.\d+|\-?\d+)|("[^"]*")|([^(^)\s]+))
    // walk the groups left to right.
    // open bracket: create a new array.
    // token - push onto current array.
    // close bracket - push current array onto master array
    // make sure brackets are balanced, if not then throw error
    //
    // use this to break things up into a set of collection groups
    const re = /\s*(?:(\()|(\))|(\-?\d+\.\d+|\-?\d+)|("[^"]*")|([^(^)\s]+))/gmi;
    // tokenise the data string
    let t = data.match(re);
    // return an updated token array with the whitespace trimmed out as it's extra.
    t = t.map((item) => {
      return item.trim();
    });

    function process_exp(tokens) {
      // this is a private function used to construct sub expressions etc and
      // allow the processing of tokens. It's called recursively until there's
      // nothing left.
      let done = false;
      const exp = [];

      while (! done) {
        // pop a token off the front of the token list
        const tok = tokens.shift();

        // check a boundary case to see if we've processed all of the tokens.
        if (typeof(tok) === 'undefined') {
          return exp[0];
          // return (exp.length > 1) ? exp : exp[0];
        }

        if (tok === '(') {
          // new expression, call into this function again with the remaining
          // tokens and create a sub expression.
          const tempexp = process_exp(tokens);
          exp.push(tempexp);
          // after this, we may have other tokens at the same level to process.
        } else if (tok === ')') {
          // we've finished an expression, so mark this ones as complete and
          // then return the finished expression.
          done = true;
          // do a boundary check as if exp has a length of one, return it only
          return (exp.length > 1) ? exp : exp[0];
        } else {
          // an atom so just add it onto the current expression list.
          // do a quick bit of checking regarding type.
          // check if it's an int
          const i = parseInt(tok, 10);
          // check if it's a float
          const f = parseFloat(tok, 10);
          // when doing a check on conversion, ensure that we cast backwards
          // to ensure js hasn't coerced a number value.
          if (! isNaN(i) && i.toString() === tok) {
            exp.push(i);
          } else if (! isNaN(f) && f.toString() === tok) {
            exp.push(f);
          } else {
            // basically we're a string
            exp.push(tok);
          }
        }
      }
    }

    this.expression = process_exp(t);
  }
}
