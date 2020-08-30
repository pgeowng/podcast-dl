var Queue = function(limit) {
	this.limit = limit;
	this.q = [];
	this.index = 0;
	this.load = 0;
};

Queue.prototype.next = function() {
	var i = Math.min(this.limit - this.load, this.q.length - this.index);
	for (; i; i--) {
		var curr = this.index++;
		this.load++;
		var _this = this;

		this.q[curr].task(function(){
			var _args = arguments;
			_this.load--;

			setTimeout(function(){
				_this.q[curr].cb.apply(null, _args);
			});

			setTimeout(_this.next.bind(_this));
		});
	}
};

Queue.prototype.launch = function(task, cb) {
	this.q.push({
		task: task,
		cb: cb,
	});

	this.next()
};

Queue.prototype.parallel = function(arr, cb) {
	var count = 0, size = arr.length, result = [], wasError = false;

	var taskWrap = function(fn, cb) {
		if (wasError) cb();
		else fn(cb);
	};

	var cbWrap = function(index, err, res) {
		if (wasError) return;

		if (err) {
			wasError = true;
			cb(err);
		}

		result[index] = res;
		count++;
		if (count === size) cb(null, result);
	};

	for (var i = 0; i < arr.length; i++) {
		this.q.push({
			task: taskWrap.bind(null, arr[i]),
			cb: cbWrap.bind(null, i)
		});
	}

	this.next()
}

module.exports = Queue