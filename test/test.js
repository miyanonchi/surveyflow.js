var TYPE = {
  LOG: 0,
  HTML: 1,
  ALERT: 2,
};

var DEBUG = TYPE.HTML;

function assert(obj1, obj2) {
  switch (DEBUG) {
  case TYPE.LOG:
    assert_log(obj1, obj2);
    break;
  case TYPE.ALERT:
    assert_alert(obj1, obj2);
    break;
  case TYPE.HTML:
    assert_html(obj1, obj2);
    break;
  default:
    assert_log(obj1, obj2);
  }
}

function assert_alert(obj1, obj2) {
  if (obj1 != obj2) alert(obj1 + " == " + obj2 + ": " + obj1 == obj2);
}

function assert_log(obj1, obj2) {
  if (obj1 != obj2) console.log(obj1 + " == " + obj2 + ": " + obj1 == obj2);
}

var ELM = null;

function assert_html(obj1, obj2) {
  if (!ELM || typeof(ELM) != "HTMLElement") assert_log(obj1, obj2);

  var str = JSON.stringify(obj1) + " == " + JSON.stringify(obj2) + ": " 
            + ((obj1 == obj2)? "true": "false");
  console.log(str)
  var e_li = document.createElement("li");
  e_li.appendChild(document.createTextNode(str));
  ELM.appendChild(e_li);
}
