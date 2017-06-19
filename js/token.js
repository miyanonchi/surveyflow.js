class Token {
  _isInt(value) {
    return ((parseInt(value) + "") == value);
  }

  _isFloat(value) {
    return ((parseFloat(value) + "") == value);
  }

  constructor(str = "", line = 0, col = 0) {
    this.type = Token.TYPE.EOT;
    this.ltype = Token.LITERAL.NONE;
    this.str = str;
    this.line = line;
    this.col = col;
    this.val = null;

    if (str == "") return;

    if (str == "\n" || str == "\r\n") {
      // New Line
      this.type = Token.TYPE.NEWLINE;
    }else if (str[0] == '"' && str[str.length-1] == '"'
     || str[0] == "'" && str[str.length-1] == "'") {
      // String
      this.type = Token.TYPE.LITERAL;
      this.ltype = Token.LITERAL.STRING;
      this.val = str.substr(1, str.length-1);
    } else if (this._isInt(str)) {
      // Integer
      this.type = Token.TYPE.LITERAL;
      this.ltype = Token.LITERAL.INT;
      this.val = parseInt(str);
    } else if (this._isFloat(str)) {
      // Float
      this.type = Token.TYPE.LITERAL;
      this.ltype = Token.LITERAL.FLOAT;
      this.val = parseFloat(str);
    } else if (str == "true" || str == "false") {
      // Bool
      this.type = Token.TYPE.LITERAL;
      this.ltype = Token.LITERAL.BOOL;
      this.val = (str == "true");
    } else if (0 <= Token.RESERVED.OPERATOR.indexOf(str)) {
      // Operator
      this.type = Token.TYPE.OPERATOR;
    } else if (0 <= Token.RESERVED.BRACKET.indexOf(str)) {
      // Bracket 
      this.type = Token.TYPE.BRACKET;
    } else if (0 <= Token.RESERVED.CMD.indexOf(str)) {
      // Cmd 
      this.type = Token.TYPE.CMD;
    } else if (0 <= Token.RESERVED.SYMBOL.indexOf(str)) {
      // Symbol
      this.type = Token.TYPE.SYMBOL;
    } else if (0 <= Token.RESERVED.CTRL.indexOf(str)) {
      // Control
      this.type = Token.TYPE.CTRL;
    } else if (/([a-zA-Z]|[a-zA-Z][a-zA-Z_\d]+|_[a-zA-Z\d]+[a-zA-Z_\d]*)/.test(str)) {
      // Variable
      this.type = Token.TYPE.VARIABLE;
    } else {
      this.type = Token.TYPE.ILLIGAL;
    }
  }

  isLiteral() {
    return this.type == Token.TYPE.LITERAL;
  }

  isNewline() {
    return this.type == Token.TYPE.NEWLINE;
  }

  isCmd(str = null)  {
    return (this.type == Token.TYPE.CMD && (str == null || this.str == str));
  }

  isCtrl(str = null) {
    return (this.type == Token.TYPE.CTRL && (str == null || this.str  == str));
  }

  isOperate(str = null) {
    return (this.type == Token.TYPE.OPERATOR && (str == null || this.str  == str));
  }

  isBracket(str = null) {
    return (this.type == Token.TYPE.BRACKET && (str == null || this.str  == str));
  }

  isVariable() {
    return this.type == Token.TYPE.VARIABLE;
  }

  isString() {
    return this.type == Token.TYPE.LITERAL && this.ltype == Token.LITERAL.STRING;
  }

  isInt() {
    return this.type == Token.TYPE.LITERAL && this.ltype == Token.LITERAL.INT;
  }

  isFloat() {
    return this.type == Token.TYPE.LITERAL && this.ltype == Token.LITERAL.FLOAT;
  }

  isBool() {
    return this.type == Token.TYPE.LITERAL && this.ltype == Token.LITERAL.BOOL;
  }
}

Token.prototype.toString = function() {
  var type = "", literal = "", str = this.str;
  switch (this.type) {
  case Token.TYPE.EOT:
    type = "<EndOfToken>";
    break;
  case Token.TYPE.LITERAL:
    type = "Literal:";
    str = this.val;
    switch (this.ltype) {
    case Token.LITERAL.NONE:
      literal = "<None>";
      break;
    case Token.LITERAL.STRING:
      literal = "<String>";
      break;
    case Token.LITERAL.INT:
      literal = "<Int>";
      break;
    case Token.LITERAL.FLOAT:
      literal = "<Float>";
      break;
    case Token.LITERAL.BOOL:
      literal = "<Bool>";
      break;
    }
    break;
  case Token.TYPE.CMD:
    type = "Cmd:";
    break;
  case Token.TYPE.CTRL:
    type = "Control:";
    break;
  case Token.TYPE.BRACKET:
    type = "Bracket:";
    break;
  case Token.TYPE.OPERATOR:
    type = "Operator:";
    break;
  case Token.TYPE.VARIABLE:
    type = "Variable:";
    break;
  case Token.TYPE.SYMBOL:
    type = "Symbol:";
    break;
  case Token.TYPE.NEWLINE:
    type = "NewLine:";
    break;
  case Token.TYPE.ILLIGAL:
    type = "IlligalToken:";
    break;
  }

  return type + " " + str + literal + " l: " + this.line + ", c: " + this.col;
}

Token.TYPE = {
  EOT:       0,
  LITERAL:   1,
  CMD:       2,
  CTRL:      3,
  OPERATOR:  4,
  BRACKET:   5,
  VARIABLE:  6,
  SYMBOL:    7,
  NEWLINE:   8,
  ILLIGAL:   9999
};

Token.LITERAL = {
  NONE:    0,
  BOOL:    1,
  STRING:  2,
  INT:     3,
  FLOAT:   4,
};

Token.RESERVED = {
  VALUE:    ["true", "false"],
  BRACKET:  ["(", ")", "[", "]", "{", "}"],
  CMD:      ["page", "title", "subtitle", "label", "input", "text", "radio", "checkbox"],
  CTRL:     ["if", "unless", "else", "elsif", "for", "while", "begin", "end", "do", "var"],
  SYMBOL:   [",", ";", ":", "."],
  OPERATOR: ["=", "!", "!=", "==", "+", "++", "--", "-", "*", "/", "<", ">", "<=", ">="],
};

