			app.directive('getCategory', function($http){
				return {
					link: function(scope, element, attrs){
						$http.get('http://celinemarcelo.com:8004/v1/categories/' + scope.x.category)
						.success(function(response){
							scope.categoryName = response.category[0].categoryName;
						});
					},
					template: "<span>{{categoryName}}</span>"
				}
			});