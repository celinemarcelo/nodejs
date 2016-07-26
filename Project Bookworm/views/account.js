
app.controller('account', function($scope, $http, $state, $rootScope, $window, $uibModal, jwtHelper){

	var payload = jwtHelper.decodeToken($window.localStorage.token);
	

	$scope.username = payload.username;
	$rootScope.isAdmin = payload.admin;

	$scope.logout = function () {
		delete $window.localStorage.token;
		$rootScope.loggedIn = false;
		$state.go('otherwise');
	}

	$scope.viewFavorites = function () {
		$state.go('favoriteList');
	} 


	$scope.settings = function() {

		var modalInstance = $uibModal.open({
			controller: 'settingsCtrl',
			templateUrl: 'settings.htm',
			resolve: {
				payload: function() {
					return payload;
				}
			},
			windowClass: 'imgModal'
		});
	}

});

app.controller('settingsCtrl', function($scope, $http, $state, $rootScope, $window, $uibModalInstance, $timeout, payload){
	$scope.tab = 1;

	var rootPass = payload.password;
	var rootUser = payload.username;

	$scope.save = function() {
		
		if ($scope.newPassword != $scope.confPass){
			$scope.noMatch = true;
		} else {
			$scope.noMatch = false;
			$scope.showSpinner = true;


			var body = {
				username: $scope.newUsername,
				password: $scope.newPassword
			};

			if ($scope.newUsername){
				rootUser = $scope.newUsername;
			}

			if($scope.newPassword){
				rootPass = $scope.newPassword;
			}


			$http({
				method: "PUT",
				url: "http://celinemarcelo.com:8004/v1/users/" + payload.userId,
				headers: {
					'Content-Type': 'application/json'
				},
				data: body
			}).success(function(data, status){

				if (data.message === "success"){
					delete $window.localStorage.token;

					$http({
						method: "POST",
						url: "http://celinemarcelo.com:8004/v1/authenticate", 
						headers: {
							'Content-Type': 'application/json'
						},
						data: {
							username: rootUser,
							password: rootPass
						}
					}).success(function (data, status) {

						if (data.success === "ok") {
					   		$window.localStorage.token = data.token;
					   		$scope.showSpinner = false;
					   		$scope.success = true;
					   		
					   		$timeout(function() {
								$window.location.reload();
							}, 1000);
					   		
						} else {
							$scope.showSpinner = false;
					   		$scope.fail = true;
						}

					});
				} else if (data.errno == -5) {
					$scope.showSpinner = false;
			   		$scope.fail = true;
				} else if (data.errno == -1) {
					$scope.showSpinner = false;
			   		$scope.exists = true;
				}

				
			});

		}
	};

	$scope.delete = function() {
		$scope.showSpinner = true;
		$http.delete("http://celinemarcelo.com:8004/v1/users/" + payload.userId)
		.success(function(data, status){
			$scope.showSpinner = false;
			$scope.deleted = true;
			delete $window.localStorage.token;
			$timeout(function() {
				$window.location.reload();
			}, 1000);
		});

	};


	$scope.cancel = function() {
		$uibModalInstance.dismiss('cancel');
	};

});