require 'string-format'
fs = require 'fs'

class Bot
	similarity = ( incoming, words ) ->
		score = 0
		for word in incoming
			match = words.filter ( w ) -> w.word is word
			score += 1 / m.score for m in match
		score / incoming.length

	pickOne = ( items ) ->
		index = Math.random()
		index *= Math.pow 10, ( items.length - 1 ) / 10
		items[Math.floor index]

	constructor: ({ @name, @channel, @chattiness, @muted, @server  }) ->
		@name ?= 'ruddy'
		@channel ?= '#redspider'
		@chattiness ?= 0
		@muted ?= no
		@server ?= 'localhost'
		@names = [@name]
		@messages = require './database.json'
		@client = do =>
			irc = require 'irc'
			client = new irc.Client @server, @name,
				channels: [@channel]
				userName: @name
				realName: @name
			client.on 'message' + @channel, @receive
			client.on 'names', ( channel, nicks ) =>
				@names = ( nick for nick, value of nicks )
				@names.push @name
				console.log "Got names!", @names
			say: ( to, message ) ->
				client.say to, message

		setInterval @dump, 5000

	dump: =>
		fs.writeFile './database.json', JSON.stringify @messages

	receive: ( from, text ) =>
		message = @prepare text
		console.log from, ': ', text
		if @canRespondTo text
			@respond from, message
		@save message

	prepare: ( message ) =>
		message = message.replace /^\s*/, ''
		message = message.replace /\s*$/, ''
		message = message.replace /^\S+:\s*/, ''
		message = message.replace '}', '}}'
		message = message.replace '{', '{{'
		i = 0
		for name in @names
			regex = new RegExp "\\b" + name + "\\b", 'gi'
			if regex.test message
				message = message.replace regex, "{#{ i }}"
				i += 1
		words: ( word.toLowerCase() for word in message.split ' ' )
		text: message

	save: ( message ) =>
		@messages.push message

	canRespondTo: ( message ) =>
		not @muted and ( Math.random() <= @chattiness or 0 <= message.indexOf @name )

	respond: ( from, message ) =>
		# Find the best matches
		words = for word in message.words
			count = 0
			count += 1 for w in ( m.words for m in @messages ) when 0 <= w.indexOf word
			score: count
			word: word

		matches = ({ i, text: m.text, words: m.words } for m, i in @messages when m.words.some ( w ) ->
			words.some ( w2 ) -> w2.word.toLowerCase() is w.toLowerCase() )

		return unless matches?.length

		matches.sort ( a, b ) ->
			( similarity b.words, words ) - ( similarity a.words, words )

		matches = matches[0..5]

		index = pickOne matches
		message = @messages[index.i + 1]

		if message?
			console.log @name, ': ', message.text
			@save message
			@client.say @channel, message.text.format from, @names...

module.exports = Bot
