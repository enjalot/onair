(function() {

var config = new tributary.Config();

var model = new tributary.CodeModel();

var context = new tributary.TributaryContext({
  config: config,
  model: model,
  el: d3.select("#display").node()
});
context.render();


var editor = new tributary.Editor({
  model: model,
  el: d3.select("#editor").node()
});
editor.render();


}());
