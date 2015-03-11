###
  Written by SAKSHAM AGGARWAL
  Do not copy. Think something new and innovative instead
###

define ['droplet-helper', 'droplet-parser', 'droplet-model'], (helper, parser, model) ->
  
  exports = {}

  COLORS = {
    'Default': 'violet'
  }

  CLASSES = ['mostly-value', 'no-drop']

  exports.CSVParser = class CSVParser extends parser.Parser
    
    constructor: (@text, @opts = {}) ->
      super
      @lines = @text.split '\n'

    getAcceptsRule: (node) -> default: helper.NORMAL

    getPrecedence: (node) -> 1

    getClasses: (node) -> CLASSES

    getColor: (node) -> COLORS['Default']

    getBounds: (node) ->
      return bounds = {
        start: {
          line: node.index
          column: node.start
        }
        end: {
          line: node.index
          column: node.end
        }
      }

    getSocketLevel: (node) -> helper.ANY_DROP

    csvBlock: (node) ->
      @addBlock
        bounds: @getBounds node
        depth: 0
        precedence: @getPrecedence node
        color: @getColor node
        socketLevel: @getSocketLevel node

    csvSocket: (node) ->
      @addSocket
        bounds: @getBounds node
        depth: 1
        precedence: @getPrecedence node
        classes: @getClasses node
        acccepts: @getAcceptsRule node

    markRoot: ->
      root = @CSVtree @text
      @mark root

    mark: (node) ->
      if node.type is 'Statement'
        @csvBlock node
      else if node.type is 'Value'
        @csvSocket node

      for child in node.children
        @mark child


    CSVtree: (text) ->
      ###
        Structure of node:
        node->index = line number
        node->type = Tree/Statement/Value/Comment
        node->start = starting character
        node->end = ending character
        node->children = children
      ###
      return @getNode text, 'Tree'

    isComment: (text) ->
      text.match(/^\s*\/\/.*$/)

    getNode: (text, type, index, start, end) ->
      node = {}
      node.index = index
      node.type = type
      node.start = start
      node.end = end
      node.children = []
      if type is 'Tree'
        text = text.split '\n'
        for row, i in text
          if (row.length is 0) or (@isComment row)
            node.children.push @getNode(row, 'Comment', i, 0, row.length)
          else
            node.children.push @getNode(row, 'Statement', i, 0, row.length)
      else if type is 'Statement'
        inside_quotes = false
        last = 0
        text = text.concat ','
        for val, i in text
          if val is ',' and inside_quotes is false
            node.children.push @getNode (text.substring last, i), 'Value', index, last, i
            last = i+1
          else if val is '"' and inside_quotes is false
            inside_quotes = true
          else if val is '"' and inside_quotes is true
            inside_quotes = false
        if inside_quotes is true
          throw new Error 'Odd number of quotes'
      else if type is 'Value'
        substr = text.trim()
        node.start += text.indexOf substr
        node.end = node.start + substr.length

      return node

  CSVParser.parens = (leading, trailing, node, context) ->
    #console.log context.id, node
    #console.log model.Container.prototype.getTokenAtLocation node.id
    return [leading, trailing]

  CSVParser.drop = (block, context, preceding) ->
    if (context.type is 'socket') or ('no-drop' in context.classes)
      return helper.FORBID
    else
      return helper.ENCOURAGE

  CSVParser.normalString = (str) ->
    has_quotes = ((str[0] is str.slice -1) and str[0] in ['"', '\''])
    if has_quotes
      tmp = str.match(/\"+/g)
      has_quotes = Math.min(tmp[0].length, tmp.slice(-1)[0].length)%2 == 1
    #console.log has_quotes
    if has_quotes and str.length > 1
      newstr = str[1...-1]
    else
      newstr = str
    needs_quotes = (newstr[0] is ' ') or (newstr.slice(-1) is ' ') or newstr.match(',')? or newstr.match('"')?
    if has_quotes is needs_quotes
      return str
    else if has_quotes and not needs_quotes
      if str.length > 1
        return str[1...-1]
      else
        return str
    else
      return '"' + str + '"'
  
    ###
    console.log start, str, end
    tmp = str.replace(/([^\"]+)(\")([^\"]+)/g, '$1$2$2$3')
    while tmp isnt str
      str = tmp
      tmp = str.replace(/([^\"]+)(\")([^\"]+)/g, '$1$2$2$3')
    console.log start, str, end
    tmp = str.replace(/([^\']+)(\')([^\']+)/g, '$1$2$2$3')
    while tmp isnt str
      str = tmp
      tmp = str.replace(/([^\']+)(\')([^\']+)/g, '$1$2$2$3')
    console.log start, str, end
    ###

  return parser.wrapParser CSVParser