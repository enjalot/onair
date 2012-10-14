(function() {

window.ui = {};

var tb = Tributary();

ui.config = new tb.Config();

//console.log("start text", starttext)
ui.model = new tb.CodeModel({
  code: starttext,
  mode:"javascript"
});

ui.context = new tb.TributaryContext({
  config: ui.config,
  model: ui.model,
  el: d3.select("#display").node()
});
ui.context.render();
ui.context.execute();


ui.editor = new tb.Editor({
  model: ui.model,
  el: d3.select("#editor").node()
});
ui.editor.render();


}());
