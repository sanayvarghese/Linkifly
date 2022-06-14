function restrict() {
  var restrictedWords = new Array(
    "#",

    "sanay",

    "<",

    "`",

    "~",

    ">",

    "$",

    "^",

    "&",

    "*",

    "@"
  );

  var txtInput = document.getElementById("basic-url").value;
  txtInput.remove(restrictedWords);

  var error = 0;

  for (var i = 0; i < restrictedWords.length; i++) {
    var val = restrictedWords[i];

    if (txtInput.toLowerCase().indexOf(val.toString()) > -1) {
      error = error + 1;
    }
  }

  if (error > 0) {
    alert("You have entered some restricted words.");
    const jo = document.getElementById("basic-url").value;
    jo.remove(restrictedWords);
  }
}
