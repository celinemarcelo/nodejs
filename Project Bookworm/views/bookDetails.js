
			app.controller('bookDetails', function($scope, $http, $stateParams, $uibModal){
				$scope.inFavorites = 'Favorite';

				//$scope.showLarge = false;
				$scope.bookId = $stateParams.bookId;

				$scope.open = function () {

					var modalInstance = $uibModal.open({
						controller: 'ModalInstanceCtrl',	
						templateUrl: 'modalContent.htm',
						size: 'sm',
						resolve: {
					        bookId: function () {
					        	return $scope.bookId;
					        }
					    },
					    windowClass: 'imgModal'
					});
				}



				$http.get("http://celinemarcelo.com:8004/v1/books/" + $stateParams.bookId)
				.success(function(response){
					
					$scope.title = response.book[0].title;

					$http.get("http://celinemarcelo.com:8004/v1/authors/" + response.book[0].author)
					.success(function(response){
						
						$scope.authorName = response.author[0].firstName + " " + response.author[0].lastName;
					});

					$http.get("http://celinemarcelo.com:8004/v1/categories/" + response.book[0].category)
					.success(function(response){
						
						$scope.categoryName = response.category[0].categoryName;
					});

					$http.get("http://celinemarcelo.com:8004/v1/languages/" + response.book[0].language)
					.success(function(response){
					
						$scope.language = response.language[0].language;
					});
				});
			});


			app.controller('ModalInstanceCtrl', function($scope, $uibModalInstance, bookId){
				$scope.bookId = bookId;


			});