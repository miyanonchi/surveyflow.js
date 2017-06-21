'use strict';

class Compiler {
  constructor(src = "") {
    const self = privates(this);

    // ソースコード
    self.src = src;
    // 読み出す位置
    self.pos = 0;
    // 行数
    self.line = 1;
    // 何文字目か
    self.col = 0;
    self.stacked_token = [];

    // 返すプログラムオブジェクト
    self.prog = new Program();

    self.log = log.bind(this);
    self.find_variable = find_variable.bind(this);
    self.is_switch_char = is_switch_char.bind(this);
    self.get_token = get_token.bind(this);
    self.unget_token = unget_token.bind(this);
    self.page = page.bind(this);
    self.block = block.bind(this);
    self.stmt = stmt.bind(this);
    self.define = define.bind(this);
    self.assign = assign.bind(this);
    self.ctrl = ctrl.bind(this);
    self.print = print.bind(this);
    self._if = _if.bind(this);
    self.cmd = cmd.bind(this);
    self.expr = expr.bind(this);
    self.variable = variable.bind(this);
    self.string = string.bind(this);
  }

  compile() {
    const self = privates(this);
    var token = self.get_token();

    self.log("compile開始", 2);
    while (token.type != Token.TYPE.ILLIGAL && token.type != Token.TYPE.EOT) {
      if (token.isCtrl("var")) {
        self.log("変数宣言", 2);
        self.define();
      } else if (token.isCmd("page")) {
        self.log("ページ宣言", 2);
        self.page();
      } else {
        self.unget_token(token);
        self.prog.current.block.stmts.push(self.stmt());
      }
      token = self.get_token();
    }

    return self.prog;
  }
}

function log(obj, type = 0xffff) {
  var mask = 2;
  if ((type & mask) != 0) console.log(obj);
}

function is_switch_char(c) {
  var splt_char = [" ", ",", "(", ")", "{", "}", "=", "!", "+", "-", "*", "/", "<", ">", ";", "\n"];
  return (0 <= splt_char.indexOf(c));
}

function get_token() {
  const self = privates(this);

  // 戻したトークンがある場合
  if (0 < self.stacked_token.length) return self.stacked_token.pop();

  var c = "", in_quot = false, in_dquot = false, str = "", pos = self.pos;
  while (self.pos < self.src.length) {
    // 1文字とってきて
    c = self.src.charAt(self.pos++);
    ++self.col;

    self.log(self.pos + "文字目: '" + c.replace("\n", "\\n") + "'", 1);

    // 文字列フラグ
    if (c == "'" && !in_dquot)
      in_quot = !in_quot;
    if (c == '"' && !in_quot)
      in_dquot = !in_dquot;

    self.log("文字列の中: " + (in_quot || in_dquot), 1);

    col = self.col - (self.pos - pos) + 1; 
    self.log("col: " + col, 1);
    if (!in_quot && !in_dquot) {
      var token = null;
      if (self.is_switch_char(c)) {
        token = new Token(str, self.line, col);
        self.log("token作っとく" + token.toString(), 1);
      }

      // 改行の時
      if (c == "\n") {
        var col = self.col;
        self.col = 0;

        var nl = new Token(c, self.line++, col);
        if (token.str == "") {
          self.log("改行を返す", 1);
          return nl;
        } else {
          self.log("改行を戻してtokenを返す", 1);
          self.unget_token(nl);
          return token;
        }
      }

      // 2文字目が続く可能性があるもの
      if (c == "=" || c == "!" || c == "+" || c == "-" || c == "<" || c == ">") {
        var t = c;
        t += self.src.charAt(self.pos++);
        ++self.col;

        var tkn = null;
        if (t == "==" || t == "!=" || t == "++" || t == "--" || t == "<=" || t == ">=") {
          tkn = new Token(t, self.line, self.col);
        } else {
          --self.pos;
          --self.col;

          tkn = new Token(c, self.line, self.col);
        }

        if (token.str != "") {
          self.unget_token(tkn);
          return token;
        } else {
          return tkn;
        }
      }

      // ',' | "(" | ")" | "{" | "}" の時
      if (c == "," || c == "(" || c == ")" || c == "{" || c == "}") {
        var tkn = new Token(c, self.line, self.col);

        if (token.str == "") {
          return tkn;
        } else {
          self.unget_token(tkn);
          return token;
        }
      }

      // スペースの時
      if (c == " ") {
        do {
          c = self.src.charAt(self.pos++);
          ++self.col;
          self.log("読み飛ばす: '" + c.replace("\n", "\\n") + "'", 1);
        } while(c == " " && self.pos < self.src.length);
        self.log("と思わせて戻す", 1);

        --self.pos;
        --self.col;

        if (token.str == "")
          continue;
        else
          return token;
      }
    }
    str += c;
    self.log("str: " + str, 1);
  }

  return new Token(str, self.line, col);
}

function unget_token(token) {
  const self = privates(this);
  self.stacked_token.push(token);
}

function BaseException(token) {
  this.name = "Error";
  this.line = token.line;
  this.col = token.col;
  this.str = token.str;

  this.toString = function() {
    return this.name + " " + token.line + ":" + token.col+ " '" + token.str +"'";
  };
  this.message = this.toString();
}

function SyntaxErrorException(token) {
  BaseException.call(this, token);
  this.name = "SyntaxError";
  this.message = this.toString();
}
Object.setPrototypeOf(SyntaxErrorException.prototype, BaseException.prototype);

function VariableNotFoundException(token) {
  BaseException.call(this, token);
  this.name = "VariableNotFoundError";
  this.message = this.toString();
}
Object.setPrototypeOf(VariableNotFoundException.prototype, BaseException.prototype);

function MultipleDefineException(token) {
  BaseException.call(this, token);
  this.name = "MultipleDefineError";
  this.message = this.toString();
}
Object.setPrototypeOf(MultipleDefineException.prototype, BaseException.prototype);

function page() {
  const self = privates(this);
  // Pageの名前が来る
  var token = self.get_token(), page, old_page = self.prog.current.page;
  if (token.isString() || token.isVariable()) {
    page = {
      id: ++self.prog.counters.page_id,
      name: token.str,
      block_id: null,
    };
  } else
    throw new SyntaxErrorException(token);

  // 今のページの情報を更新
  self.prog.current.page = page

  self.log("blockの処理", 2);
  // Blockの処理
  page.block_id = self.block().id;
  self.prog.pages.push(page);

  // 今のページの情報を更新
  self.prog.current.page = old_page;

  return page;
}

function block() {
  const self = privates(this);
  //token = self.get_token();
  var block = {
    id: ++self.prog.counters.block_id,
    parent: self.prog.current.block.id,
    stmts: [],
  };

  // "{" が来る
  var token = self.get_token();
  if (!token.str == "{")
    throw new SyntaxErrorException(token);

  self.prog.current.block = block;

  // ブロックのリストに登録
  self.prog.blocks.push(block);

  token = self.get_token();
  while (token.type != Token.TYPE.ILLIGAL && token.type != Token.TYPE.EOT) {
    // Blockの終わり
    if (token.isBracket("}")) {
      self.unget_token(token);
      self.prog.current.block = self.prog.blocks[block.parent];
      break;
    }

    if (token.isCmd() || token.isCtrl() || token.isVariable()) {
      self.log("statementの処理", 2);
      self.unget_token(token);
      block.stmts.push(self.stmt());
    }

    token = self.get_token();
  }

  // "}" が来る
  token = self.get_token();
  if (!token.str == "}")
    throw new SyntaxErrorException(token);

  return block;
}

function stmt() {
  const self = privates(this);

  var token = self.get_token();
  // コマンド
  if (token.isCmd()) {
    self.log("コマンド", 2);
    self.unget_token(token);
    return self.cmd();
  } else
  // 定義済みの変数への代入、または計算
  if (token.isVariable()) {
    console.log(token);
    self.log("定義済みの変数への代入、または計算", 2);
    self.unget_token(token);
    var variable = self.variable();
    token = self.get_token();
    if (token.isOperator("=")) {
      return self.assign(variable);
    }

    if (token.isOperator("++") || token.isOperator("--")) {

    }
  } else
  // ifやforなどの制御文
  if (token.isCtrl()) {
    self.log("var,if,for,else,unless,elsif,while,begin,do,endなどの処理", 2);
    self.unget_token(token);
    return self.ctrl();
  }

  // 改行
  token = self.get_token();
  if (!token.isNewline() && !token.isSymbol(";") && !token.isEOT())
    throw new SyntaxErrorException(token);
}

function cmd() {
  const self = privates(this);

  var token = self.get_token();

  if (token.str == "page") throw SyntaxErrorException(token);

  cmd_obj = {
    type: token.str,
    val: ""
  };

  switch (token.str) {
  case "title":
    break;
  case "subtitle":
    break;
  case "label":
    break;
  case "input":
    conosle.log(token.toString())
    token = self.get_token();
    conosle.log(token.toString())
    break;
  case "text":
    break;
  case "radio":
    break;
  case "checkbox":
    break;
  }

  return cmd_obj;
}

function ctrl() {
  const self = privates(this);

  var token = self.get_token();

  if (token.type != Token.TYPE.CTRL) throw SyntaxErrorException(token);

  switch (token.str) {
  case "var":
    return self.define();
  case "if":
    return self._if();
  case "unless":
    return self._unless();
  case "for":
    return self._for();
  case "while":
    return self._while();
  case "do":
    return self._do();
  case "print":
  case "echo":
    return self.print();
  }
}

function assign(v) {
  const self = privates(this);

  // 代入の右辺
  var token = self.get_token();
  if (token.isCmd()) {
    return self.cmd();
  } else {
    // 式
    self.unget_token(token);
    console.log(token);
    return v.value = self.expr();
  }
}

function _if() {
  const self = privates(this);

  var if_obj = {
    type: "if",
    cnd: {
      left: true,
      oper: "==",
      right: true
    },
    thn: [],
    els: [],
  };

  var token = self.get_token();
  if (!token.isBracket("(")) throw SyntaxErrorException(token);

  // 左辺
  if_obj.cnd.left = self.expr();

  token = self.get_token();

  // 比較演算子
  if (token.isOperator()) {
    if (0 <= ["==", "!=", "<", ">", "<=", ">="].indexOf(token.str)) {
      if_obj.cnd.oper = token.str;
    }

    // 右辺
    if_obj.cnd.right = self.expr();
  } else
  // 閉じかっこ
  if (!token.isBracket(")")) {
    // 特に問題ない
  } else throw SyntaxErrorException(token);

  token = self.get_token();
  if (token.isBracket("{")) {
    self.unget_token(token);
    self.block();
  } else {
    self.stmt();
  }

  token = self.get_token();
  while (token.isCtrl("elsif")) {
    
    token = self.get_token();
  }

  if (token.isCtrl("else")) {

  } else {
    self.unget_token(token);
  }

  return if_obj;
}

function define() {
  const self = privates(this);

  // 変数名
  var token = self.get_token();
  if (!token.isVariable())
    throw new SyntaxErrorException(token);

  // すでに定義済み
  if (self.find_variable(token))
    throw new MultipleDefineException(token);

  var cur = self.prog.current;

  var variable = {
    id: ++self.prog.counters.var_id,
    name: token.str,
    page: cur.page.id,
    block: cur.block.id,
    value: null,
  };

  // 変数リストに追加
  self.prog.variables.push(variable);

  token = self.get_token();

  // "=" がきたら
  if (token.isOperator("=")) {
    self.log("代入", 2);
    self.assign(variable);
  } else {
    self.unget_token(token);
  }

  token = self.get_token();
  // "," がきたら
  if (token.type == Token.TYPE.SYMBOL && token.str == ",") {
    self.define();
  } else {
    self.unget_token(token);
  }

  // 改行がきたら
  if (token.isNewline() || token.isSymbol(";")) {
    // 問題ないから読み飛ばす
  }

  //throw new SyntaxErrorException(token);

  return variable;
}

function print() {
  const self = privates(this);

  var obj = {
    type: "print",
    val: ""
  };

  obj.val = self.expr();

  return obj;
}

function expr() {
  const self = privates(this);

  var token = self.get_token();

  console.log(token);

  // リテラル(Int or Float or Bool)
  if (token.isInt() || token.isFloat() || token.isBool())
    return token.val;
  else
  // リテラル(String)
  if (token.isString()) {
    self.unget_token(token);
    return self.string();
  } else
  // 変数
  if (token.isVariable()) {
    self.unget_token(token);
    return self.variable();
  } else
  // title,subtitle,etc...
  if (token.isCmd()) {
    return self.cmd();
  } else SyntaxErrorException(token);

  return 0;
}

function string() {
  const self = privates(this);

  var token = self.get_token();
  if (token.isString()) {
    return token.str;
  }
}

function variable() {
  const self = privates(this);

  var token = self.get_token(), variable;
  if (token.isVariable()) {
    variable = self.find_variable(token);

    // 変数が未定義
    if (!variable)
      throw new VariableNotFoundException(token);
  }
  // 変数であることが確定している状態で来ているのでありえない
  else
    throw new SyntaxErrorException(token);

  return variable;
}

function find_variable(token) {
  const self = privates(this);

  var dot = token.str.lastIndexOf("."),
      page_id = self.prog.current.page.id, block_id = self.prog.current.block.id,
      page_name = "", var_name = "";

  // 変数がPageの下にある時
  if (0 < dot) {
    page_name = token.str.substr(0, dot);
    var_name = token.str.substr(dot+1);
  } else {
    var_name = token.str;
  }

  for (var p of self.prog.pages) {
    if (p.name == page_name) {
      page_id = p.id;
      block_id = p.block_id;
      break;
    }
  }

  // 変数が定義済みか調べる
  for (var v of self.prog.variables) {
    if (v.page == page_id && v.name == var_name) return v;
  }

  return null;
}
