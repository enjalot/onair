(function() {

window.ui = {};

ui.config = new tributary.Config();

ui.model = new tributary.CodeModel();

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
