
			app.controller('account', function($scope, $http, $state, $rootScope, $window, jwtHelper){

				var payload = jwtHelper.decodeToken($window.localStorage.token);
				

				$scope.username = payload.username;
				$rootScope.isAdmin = payload.admin;

				$scope.logout = function () {
					delete $window.localStorage.token;
					$rootScope.loggedIn = false;
					$state.go('otherwise');
				}

			});