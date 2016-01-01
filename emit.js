var EventEmitter = require('events');
var emitter = new EventEmitter;
emitter.on('nam', function(first, last) {
	console.log(first + ', ' + last);
});
emitter.emit('nam', 'tj', 'holowaychuk');
emitter.emit('nam', 'simon', 'holowaychuk');
emitter.emit('nam', 'simon', 'WEH');

process.on('SIGINT', function(err){
	console.log('There was an error!');

	process.exit(1);


});

setTimeout(function(){
	//throw new Error	('fail');


}, 100);

//process