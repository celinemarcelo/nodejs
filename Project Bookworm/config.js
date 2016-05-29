var convict = require('convict');

var conf = convict({
	host: {
		format: String,
		default: 'mydb.cqueamw43gnb.ap-northeast-1.rds.amazonaws.com'
	},
	user: {
		format: String,
		default: 'celinemarcelo'
	},
	password: {
		format: String,
		default: 'bookerdewitt'
	},	
	database: {
		format: String,
		default: 'projectbookworm'
	}
});

module.exports = conf;