		app.controller('favoriteList', function($scope, $http, jwtHelper, $window){
			var payload = jwtHelper.decodeToken($window.localStorage.token);


			$scope.currentPage = 1;
			$scope.maxSize = 5;
			var offset = 0;
			var limit = 7;

			$scope.showSpinner = true;


			$http.get("http://celinemarcelo.com:8004/v1/favorites/search?user=" + payload.userId).success(function(data) {
				$scope.totalItems = data.favorites[0].count;					
			});

			$http.get("http://celinemarcelo.com:8004/v1/favorites/search?user=" + payload.userId + "&count=7&orderby=Books.title")
			.then(function (response) {
				$scope.showSpinner = false;

				$scope.books = response.data.favorites[1];

			});

			$scope.pageChanged = function(currentPage) {
				$scope.showSpinner = true;

				offset = (7 * currentPage) - 7;

    			$http.get("http://celinemarcelo.com:8004/v1/favorites/search?orderby=Books.title&offset=" + offset + "&limit=" + limit + "&user=" + payload.userId)
				.then(function (response) {
					

    				$scope.showSpinner = false;

    				$scope.books = response.data.favorites[1];

				});
			};


		});