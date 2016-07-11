var app = angular.module('app', ['ui.router', 'ui.bootstrap', 'ngFileUpload', 'angular-jwt', 'ngAnimate']);

			app.factory('tokenInjector', function ($window){
				return {
					request: function (config){
						if ($window.localStorage.token) {
							config.headers['Authorization'] = 'Bearer ' + $window.localStorage.token;

						}


						//console.log($window.localStorage.token);
						return config;
						
					}


				};
			});


			app.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', function($stateProvider, $urlRouterProvider, $httpProvider){
  				
  				$httpProvider.interceptors.push('tokenInjector');

  				$stateProvider
  					.state("otherwise", {
  						url: "/",
  						title: "Project Bookworm",
				    	templateUrl: "welcome.htm"
				    })

				    .state("bookList", {
				    	url: "/books",
				    	title: "Book List",
				    	templateUrl: "bookList.htm",
				    	controller: "bookList",
				    	resolve: {
			                login: function($q, $http, $state) {
			                    var deferred = $q.defer();
			                    $http({
									method: "POST",
									url: "http://celinemarcelo.com:8004/v1/authenticate"
								}).success(function(data, status){
									
									if (data.success === "ok") {

										deferred.resolve();
									} else {
										deferred.reject();
									}
								});	

			                   
			                    return deferred.promise;
			                }
				    	}
				    })

				    .state("bookDetails", {
				    	url: "/books/:bookId",
				    	title: "Book Details",
				    	templateUrl: "bookDetails.htm",
				    	controller: "bookDetails"
				    })

				    .state("login", {
				    	url: "/login",
				    	title: "Login/Register",
				    	templateUrl: "login.htm",
				    	controller: "login",
				    	resolve: {
			                login: function($q, $http, $state) {
			                    var deferred = $q.defer();
			                    $http({
									method: "POST",
									url: "http://celinemarcelo.com:8004/v1/authenticate"
								}).success(function(data, status){
									
									if (data.success === "ok") {

										deferred.reject();
									} else {
										deferred.resolve();
									}
								});	

			                   
			                    return deferred.promise;
			                }
				    	}
				    })

				    .state("account", {
				    	url: "/account",
				    	title: "My Account",
				    	templateUrl: "account.htm",
				    	controller: "account",
				    	resolve: {
			                login: function($q, $http, $state) {
			                    var deferred = $q.defer();
			                    $http({
									method: "POST",
									url: "http://celinemarcelo.com:8004/v1/authenticate"
								}).success(function(data, status){
									
									if (data.success === "ok") {

										deferred.resolve();
									} else {
										deferred.reject();
									}
								});	

			                   
			                    return deferred.promise;
			                }
				    	}
				    });


				    $urlRouterProvider.otherwise("/");
			}]);

			app.run(['$rootScope', '$state', '$window', '$http', '$q', 'jwtHelper', function($rootScope, $state, $window, $http, $q, jwtHelper) {

						



				$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
					
					$http({
						method: "POST",
						url: "http://celinemarcelo.com:8004/v1/authenticate"
					}).success(function(data, status){

						if (data.success === "ok") {
							$rootScope.loggedIn = true;

							var payload = jwtHelper.decodeToken($window.localStorage.token);

							$rootScope.isAdmin = payload.admin;


							console.log($rootScope.loggedIn);

						} else {
							$rootScope.loggedIn = false;
						}
					});		
					
					
					
    			});


    			$rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        			$rootScope.pageTitle = toState.title;
        			$rootScope.activeTab = toState.title;
    			});

    			$rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams) {

        			if (toState.name === 'login') {
        				$state.go('account');
        			} else if (toState.name === 'account') {
        				$state.go('login');
        			} else if (toState.name === 'bookList') {
        				$state.go('login');
        			}
    			});
			}]);

