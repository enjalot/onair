(function() {

window.ui = {};

ui.config = new tributary.Config();

console.log("start text", starttext)
ui.model = new tributary.CodeModel({
  code: starttext,
  mode:"javascript"
});

ui.context = new tributary.TributaryContext({
  config: ui.config,
  model: ui.model,
  el: d3.select("#display").node()
});
ui.context.render();


ui.editor = new tributary.Editor({
  model: ui.model,
  el: d3.select("#editor").node()
});
ui.editor.render();


}());
