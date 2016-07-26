			app.directive('getAuthor', function($http){
				return {
					link: function(scope, element, attrs){
						$http.get('http://celinemarcelo.com:8004/v1/authors/' + scope.x.author)
						.success(function(response){
							scope.authorName = response.author[0].firstName + " " + response.author[0].lastName;
						});
					},
					template: "<span>{{authorName}}</span>"
				}
			});