'use strict';

const privates = new namespace();

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

    // ページ、ブロック、変数生成時にIDとする
    self.counters = {
      page_id: 0,
      block_id: 0,
      var_id: 0,
    };

    // プログラム中のページのリスト
    self.pages = [
      {
        id: 0,
        name: "_dummy_",
        block_id: 0,
      }
    ];

    self.blocks = [
      {
        id: 0,
        name: "_main_",
        parent: null,
        stmts: [],
      }
    ];
    self.variables = [];

    self.current = {
      page: self.pages[0],
      block: self.blocks[0],
    };

    self.callbacks = [];

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
      }
      if (token.isCmd("page")) {
        self.log("ページ宣言", 2);
        self.page();
      }
      token = self.get_token();
    }

    return { blocks: self.blocks, pages: self.pages, variables: self.variables };
  }
}

function log(obj, type) {
  var _type = 2;
  if (_type == type) console.log(obj);
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

    self.log(self.pos + "文字目: '" + c.replace("\n", "\\n") + "'");

    // 文字列フラグ
    if (c == "'" && !in_dquot)
      in_quot = !in_quot;
    if (c == '"' && !in_quot)
      in_dquot = !in_dquot;

    self.log("文字列の中: " + (in_quot || in_dquot));

    col = self.col - (self.pos - pos) + 1; 
    self.log("col: " + col);
    if (!in_quot && !in_dquot) {
      var token = null;
      if (self.is_switch_char(c)) {
        token = new Token(str, self.line, col);
        self.log("token作っとく" + token.toString());
      }

      // 改行の時
      if (c == "\n") {
        var col = self.col;
        self.col = 0;

        var nl = new Token(c, self.line++, col);
        if (token.str == "") {
          self.log("改行を返す");
          return nl;
        } else {
          self.log("改行を戻してtokenを返す");
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
          if (token.str != "") {
            self.unget_token(tkn);
            return token;
          }
        } else {
          --self.pos;
          --self.col;

          tkn = new Token(c, self.line, self.col);
        }

        return tkn;
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
          self.log("読み飛ばす: '" + c.replace("\n", "\\n") + "'");
        } while(c == " " && self.pos < self.src.length);
        self.log("と思わせて戻す");

        --self.pos;
        --self.col;

        if (token.str == "")
          continue;
        else
          return token;
      }
    }
    str += c;
    self.log("str: " + str);
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
  var token = self.get_token(), page, old_page = self.current.page;
  if (token.isString() || token.isVariable()) {
    page = {
      id: ++self.counters.page_id,
      name: token.str,
      block_id: null,
    };
  } else
    throw new SyntaxErrorException(token);

  // "{" が来る
  token = self.get_token();
  if (!token.str == "{")
    throw new SyntaxErrorException(token);

  // 今のページの情報を更新
  self.current.page = page

  self.log("blockの処理", 2);
  // Blockの処理
  page.block_id = self.block().id;
  self.pages.push(page);

  // "}" が来る
  token = self.get_token();
  if (!token.str == "}")
    throw new SyntaxErrorException(token);

  // 今のページの情報を更新
  self.current.page = old_page; 

  return page;
}

function block() {
  const self = privates(this);
  //token = self.get_token();
  var block = {
    id: ++self.counters.block_id,
    parent: self.current.block,
    stmts: [],
  };

  self.current.block = block;

  // ブロックのリストに登録
  self.blocks.push(block);

  var token = self.get_token();
  while (token.type != Token.TYPE.ILLIGAL && token.type != Token.TYPE.EOT) {
    // Blockの終わり
    if (token.isBracket("}")) {
      self.current.block = block.parent;
      break;
    }

    if (token.isCmd() || token.isCtrl() || token.isVariable()) {
      self.log("statementの処理", 2);
      self.unget_token(token);
      block.stmts.push(self.stmt());
    }

    token = self.get_token();
  }

  return block;
}

function stmt() {
  const self = privates(this);

  var token = self.get_token();
  // コマンド
  if (token.isCmd()) {
    self.log("コマンド", 2);
    self.unget_token(token);
    self.cmd();
  } else
  // 定義済みの変数への代入、または計算
  if (token.isVariable()) {
    self.log("定義済みの変数への代入、または計算", 2);
    self.unget_token(token);
    self.variable();
  } else
  // ifやforなどの制御文
  if (token.isCtrl()) {
    self.log("var,if,for,else,unless,elsif,while,begin,do,endなどの処理", 2);
    self.unget_token(token);
    self.ctrl();
  }
  // 改行
  token = self.get_token();
  if (!token.isNewline())
    throw new SyntaxErrorException(token);
}

function cmd() {
  const self = privates(this);

  var token = self.get_token();

  if (token.str == "page") throw SyntaxErrorException(token);

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
}

function ctrl() {
  const self = privates(this);

  var token = self.get_token();

  if (token.type != Token.TYPE.CTRL) throw SyntaxErrorException(token);

  switch (token.str) {
  case "var":
    self.define();
    break;
  case "if":
    self._if();
    break;
  case "unless":
    self._unless();
    break;
  case "for":
    self._for();
    break;
  case "while":
    self._while();
    break;
  case "do":
    self._do();
    break;
  }
}

function assign(v) {
  const self = privates(this);

  // 代入の右辺
  var token = self.get_token();
  console.log(token);
  if (token.isCmd()) {
    self.cmd();
  }
}

function _if() {
  const self = privates(this);

  var token = self.get_token();
  if (!token.isBracket("(")) throw SyntaxErrorException(token);

  self.expr();

  token = self.get_token();
  if (!token.isBracket(")")) throw SyntaxErrorException(token);

  token = self.get_token();
  if (token.isBracket("{"))
    self.block();
  else
    self.stmt();

  token = self.get_token();
  while (token.isCtrl("elsif")) {
    
    token = self.get_token();
  }

  if (token.isCtrl("else")) {

  } else {
    self.unget_token(token);
  }

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

  var cur = self.current;

  var variable = {
    id: ++self.counters.var_id,
    name: token.str,
    page: cur.page.id,
    block: cur.block.id,
    value: null,
  };

  // 変数リストに追加
  self.variables.push(variable);

  token = self.get_token();

  // "=" がきたら
  if (token.isOperate("=")) {
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
  if (token.isNewline()) {
    // 問題ないから読み飛ばす
  }

  //throw new SyntaxErrorException(token);

  return variable;
}

function expr() {
  const self = privates(this);

  var token = self.get_token();

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
    return self.variable().value;
  } else
  // title,subtitle,etc...
  if (token.isCmd()) {
    self.cmd();
  }

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
      page_id = self.current.page.id, block_id = self.current.block.id,
      page_name = "", var_name = "";

  // 変数がPageの下にある時
  if (0 < dot) {
    page_name = token.str.substr(0, dot);
    var_name = token.str.substr(dot+1);
  } else {
    var_name = token.str;
  }

  for (var p of self.pages) {
    if (p.name == page_name) {
      page_id = p.id;
      block_id = p.block_id;
      break;
    }
  }

  // 変数が定義済みか調べる
  for (var v of self.variables) {
    if (v.page == page_id && v.name == var_name) return v;
  }

  return null;
}