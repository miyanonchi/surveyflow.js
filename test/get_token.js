var compiler, token, src = "";

src  = "input \"ho ge\"\nlabel 'huga'\nfor ( -3.2 )  \n \n\n  { } as huge {\n} \n";
src += "var hoge = \"\", unnaaa  = A\n";
src += "_huga _ __huga__ aa___ _hoge_ __a a_ _a_ a_a";

src = document.getElementById("src").value;

SRC = document.getElementById("src_area");
ELM = document.getElementById("result");

SRC.appendChild(document.createTextNode(src.replace(/\n/g, "\\n\n")));
SRC.appendChild(document.createElement("br"));

compiler = new Compiler(src);
const self = privates(compiler);

do {
  token = self.get_token();
  console.log(token);
  self.unget_token(token);
  token = self.get_token();
  ELM.appendChild(document.createTextNode(token.toString()));
  ELM.appendChild(document.createElement("br"));
  //console.log(token.toString());
} while(token.type != Token.TYPE.EOT);
