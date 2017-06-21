$("#src_view").focus();

function compile() {
  var src = $("#src_view").val();
  var prog;
  var comp = new Compiler(src);

  try {
    prog = comp.compile();
  } catch(ex) {
    err = $("<pre>", { class: "text-danger" });
    err.text(ex.toString() + "\n");

    line = src.split("\n")[ex.line-1];
    err.text(err.text() + line + "\n");
    line = "";
    for (i = 1; i < ex.col; ++i)
      line += " ";
    err.text(err.text() + line + "^");
    $("#form_preview").empty().append(err);
    throw ex;
  }

  console.log("compile done.");

  prog.exec();
}

$("#src_view").on("keydown", function(e) {
  if (e.ctrlKey && e.keyCode == 13) {
    e.preventDefault();
    compile();
  }
});

$("#compile").on("click", function() {
  compile();
});

