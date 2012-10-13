racer = require 'racer'
racer.use require 'racer/lib/ot'


process.nextTick ->
  racer.init @init
  delete @init

racer.on 'ready', (model) ->

  console.log("HIIII", ui)
  

  #editor = document.getElementById 'editor'

  ## Update the model in response to DOM events ##

  applyChange = (newval) ->
    oldval = model.get '_room.text'
    console.log("old", oldval, "new", newval)

    return if oldval == newval
    commonStart = 0
    commonStart++ while oldval.charAt(commonStart) == newval.charAt(commonStart)

    commonEnd = 0
    commonEnd++ while oldval.charAt(oldval.length - 1 - commonEnd) == newval.charAt(newval.length - 1 - commonEnd) and
      commonEnd + commonStart < oldval.length and commonEnd + commonStart < newval.length

    unless oldval.length == commonStart + commonEnd
      model.otDel '_room.text', commonStart,
        oldval.length - commonStart - commonEnd

    unless newval.length == commonStart + commonEnd
      model.otInsert '_room.text', commonStart,
        newval.substr commonStart, newval.length - commonEnd

  #editor.disabled = false
  #prevvalue = editor.value = model.get '_room.text'
  editorvalue = prevValue = model.get '_room.text'

  replaceText = (newText, transformCursor) ->
    newSelection = [
      transformCursor editor.selectionStart
      transformCursor editor.selectionEnd
    ]
    #scrollTop = editor.scrollTop
    #editor.value = newText
    ui.model.set("code", newText)
    ui.editor.cm.setValue(newText)

    #editor.scrollTop = scrollTop if editor.scrollTop != scrollTop
    #[editor.selectionStart, editor.selectionEnd] = newSelection

  model.on 'otInsert', '_room.text', (pos, text, isLocal) ->
    return if isLocal
    replaceText editorvalue[...pos] + text + editorvalue[pos..], (cursor) ->
      if pos <= cursor then cursor + text.length else cursor

  model.on 'otDel', '_room.text', (pos, text, isLocal) ->
    return if isLocal
    replaceText editorvalue[...pos] + editorvalue[pos + text.length..], (cursor) ->
      if pos < cursor then cursor - Math.min(text.length, cursor - pos) else cursor

  genOp = (e) ->
    setTimeout ->
      editorvalue = ui.model.get("code")
      if editorvalue != prevValue
        prevValue = editorvalue
        applyChange editorvalue.replace /\r\n/g, '\n'
    , 0

  ui.model.on("change:code", genOp)
  
  """
  for event in ['input', 'keydown', 'keyup', 'select', 'cut', 'paste']
    if editor.addEventListener
      editor.addEventListener event, genOp, false
    else
      editor.attachEvent 'on' + event, genOp
  """
