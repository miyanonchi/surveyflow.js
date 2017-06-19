$("#src_view").focus();

$("#src_view").on("keydown", function(e) {
  if (e.ctrlKey && e.keyCode == 13) {
    var src = $("#src_view").val();
    var comp = new Compiler(src);

    e.preventDefault();

    try {
      var o = comp.compile();
      console.log(o.blocks);
      console.log(o.pages);
      console.log(o.variables);
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
  }
});
