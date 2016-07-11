var merge = require('merge');

module.exports.map_table = function(table) {
	var set = ['users', 'books', 'authors', 'categories', 'languages', 'reviews', 'favorites'];

	if (set.indexOf(table) > -1){
		//console.log('found');
		return table.charAt(0).toUpperCase() + table.slice(1);
	} else if (table === 'reviewcomments') {
		return 'ReviewComments';
	}
};

module.exports.build_body = function(req) {
	var set = ['books', 'authors', 'categories', 'languages', 'reviews'];

	var timestamp = {
		'timestamp': new Date()
	};

	var registrationDate = {
		'registrationDate': new Date()		
	};

	if (set.indexOf(req.params.table) > -1){
		return req.body;
	} else if (req.params.table === 'favorites' || req.params.table === 'reviewcomments') {
		return merge(req.body, timestamp);
	} else if (req.params.table === 'users') {
		return merge(req.body, registrationDate);
	}
};

module.exports.build_args = function(req) {
	var t = req.params.table

	switch(t) {
		case 'users':
			return "username = '" + req.body.username + "'";
			break;
		case 'books':
			return "title = '" + req.body.title + "' AND author = '" + req.body.author + "'";
			break;
		case 'authors':
			return "firstName = '" + req.body.firstName + "' AND lastName = '" + req.body.lastName + "'";
			break;
		case 'categories':
			return "categoryName = '" + req.body.categoryName + "'";
			break;
		case 'languages':
			return "language = '" + req.body.language + "'";
			break;
		case 'favorites':
			return "user = " + req.body.user + " AND book = " + req.body.book;
	}
};


module.exports.build_id = function(req) {
	var t = req.params.table

	switch (t) {
		case 'users':
			return {'userId': req.params.id};
			break;
		case 'books':
			return {'bookId': req.params.id};
			break;
		case 'authors':
			return {'authorId': req.params.id};
			break;
		case 'favorites':
			return {'favoriteId': req.params.id};
			break;
		case 'categories':
			return {'categoryId': req.params.id};
			break;
		case 'languages':
			return {'languageId': req.params.id};
			break;
		case 'reviewcomments':
			return {'reviewCommentId': req.params.id};
			break;
		case 'reviews':
			return {'reviewId': req.params.id};
			break;
	}
};

module.exports.search_params = function(req) {
	var t = req.params.table

	switch(t) {
		case 'users':
			return "username = '" + req.query.username + "'";
			break;
		case 'books':
			return "title = '" + req.query.title + "' AND author = '" + req.query.author + "'";
			break;
		case 'authors':
			return "firstName = '" + req.query.firstName + "' AND lastName = '" + req.query.lastName + "'";
			break;
		case 'categories':
			return "categoryName = '" + req.query.categoryName + "'";
			break;
		case 'languages':
			return "language = '" + req.query.language + "'";
			break;
		case 'favorites':
			return "user = " + req.query.user + " AND book = " + req.query.book;
	}
};

