
			app.controller('login', function($scope, $http, $window, $state, $rootScope){
				$scope.newUserTrigger = false;
				$scope.loginTrigger = false;

				$scope.submit = function() {
					$scope.newExists = false;
					$scope.newFail = false;
					$scope.showNewSpinner = true;


					console.log($scope.newPassword);
					console.log($scope.confPassword);


					if ($scope.newPassword != $scope.confPassword) {
						$scope.noMatch = true;
						$scope.showNewSpinner = false;
					} else {
						$scope.noMatch = false;
						console.log("Matches!");

						var body = {
							username: $scope.newUsername,
							password: $scope.newPassword
						}

						$http({
							method: "POST",
							url: "http://celinemarcelo.com:8004/v1/users", 
							headers: {
								'Content-Type': 'application/json'
							},
							data: body
						}).success(function (data, status) {
							console.log(data);

							if (data.errno === -1) {
								$scope.newExists = true;
								$scope.showNewSpinner = false;
							} else if (data.errno === -5) {
								$scope.newFail = true;
								$scope.showNewSpinner = false;
							} else {
								$http({
									method: "POST",
									url: "http://celinemarcelo.com:8004/v1/authenticate", 
									headers: {
										'Content-Type': 'application/json'
									},
									data: body
								}).success(function (data, status) {
									console.log(data);

									if (data.message === "Authenticated! Token issued.") {
								   		$rootScope.loggedIn = true;
								   		$window.localStorage.token = data.token;


										$scope.showNewSpinner = false;
								   		
								   		$state.go('account');
								   		
									}	

								});

							}
							
						});




					}


				}

				$scope.loginFunc = function() {
					$scope.wrong = false;
					$scope.showSpinner = true;


					var body = {
						username: $scope.username,
						password: $scope.password
					} 



					$http({
						method: "POST",
						url: "http://celinemarcelo.com:8004/v1/authenticate", 
						headers: {
							'Content-Type': 'application/json'
						},
						data: body
					}).success(function (data, status) {
						console.log(data);

						if (data.message === "Authenticated! Token issued.") {
					   		$window.localStorage.token = data.token;
					   		$rootScope.loggedIn = true;
							$scope.showSpinner = false;

					   		$state.go('account');
					   		
						} else if (data.errno === -3 || data.errno === -2) {
							$scope.showSpinner = false;

							$scope.wrong = true;
						}

					});



				}


			});
