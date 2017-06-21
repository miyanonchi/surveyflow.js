'use strict';

class Program {
  constructor() {
    const self = privates(this);

    // ソースプログラム
    this.src = "";

    // ページ、ブロック、変数生成時にIDとする
    this.counters = {
      page_id: 0,
      block_id: 0,
      var_id: 0,
    };

    // プログラム中のページのリスト
    this.pages = [
      {
        id: 0,
        name: "_dummy_",
        block_id: 0,
      }
    ];

    this.blocks = [
      {
        id: 0,
        name: "_main_",
        parent: null,
        stmts: [],
      }
    ];
    this.variables = [];

    this.current = {
      page: this.pages[0],
      block: this.blocks[0],
    };

    this.callbacks = [];
  }

  exec() {
    console.log("huga!!!");
  }
}
