app.controller('bookList', function($scope, $http, $q, Upload, $window, $timeout) {
	$scope.currentPage = 1;
	$scope.maxSize = 5;
	var offset = 0;
	var limit = 7;

	$http.get("http://celinemarcelo.com:8004/v1/books?orderby=title").success(function(data) {
		$scope.totalItems = data.books[0].count;

		
	});

	$http.get("http://celinemarcelo.com:8004/v1/authors").success(function(data) {
		$scope.authors = data.authors[1];
	});

	$http.get("http://celinemarcelo.com:8004/v1/categories").success(function(data) {
		$scope.categories = data.categories[1];
	});

	$http.get("http://celinemarcelo.com:8004/v1/languages").success(function(data) {
		$scope.languages = data.languages[1];
	});


	$scope.submit = function(file){

		$scope.showSpinner = true;

		var authorId, categoryId, languageId, bookId;

		var authorBody = {
			'firstName': $scope.firstName,
			'lastName': $scope.lastName
		};

		var categoryBody = {
			'categoryName': $scope.categoryName
		};

		var languageBody = {
			'language': $scope.language
		};

		
		var checkAuthor = $http({
			method: "POST",
			url: "http://celinemarcelo.com:8004/v1/authors", 
			headers: {
				'Content-Type': 'application/json'
			},
			data: authorBody
		}).success(function (data, status) {
			console.log(data);
			authorId = data.id;

			console.log("authorId: " + authorId);
		});

		var checkCategory = $http({
			method: "POST",
			url: "http://celinemarcelo.com:8004/v1/categories", 
			headers: {
				'Content-Type': 'application/json'
			},
			data: categoryBody
		}).success(function (data, status) {
			console.log(data);
			categoryId = data.id;

			console.log("categoryId: " + categoryId);

		});

		var checkLanguage = $http({
			method: "POST",
			url: "http://celinemarcelo.com:8004/v1/languages", 
			headers: {
				'Content-Type': 'application/json'
			},
			data: languageBody
		}).success(function (data, status) {
			console.log(data);
			languageId = data.id;

			console.log("languageId: " + languageId);
		});
		

		$q.all([checkAuthor, checkCategory, checkLanguage]).then(function(){
			var bookBody =  {
				title: $scope.title,
				author: authorId,
				category: categoryId,
				language: languageId,
				releaseDate: $scope.releaseDate
			};

			$http({
				method: "POST",
				url: "http://celinemarcelo.com:8004/v1/books", 
				headers: {
					'Content-Type': 'application/json'
				},
				data: bookBody
			}).success(function (data, status) {
				console.log(data);
				bookId = data.id;

				console.log("bookId: " + bookId);

				console.log($scope.file);

				if ($scope.file != undefined && data.message === "success"){
					Upload.upload({
						url: 'http://celinemarcelo.com:8004/v1/upload/' + bookId, //webAPI exposed to upload the file
						data: {file: $scope.file, id: bookId} //pass file as data, should be user ng-model
					}).success(function (resp) { //upload function returns a promise
						console.log(resp);

						$scope.showSpinner = false;

						if(resp.message === "success"){ //validate success
						    $scope.coverSuccess = true;

						    $timeout(function() {
								$window.location.reload();
							}, 1000);
						} else {
							$scope.coverFail = true;

						}
					});
				} else if (data.errno === -1) {
					$scope.showSpinner = false;
					$scope.exists = true;

				} else if (data.message === "success") {
					$scope.showSpinner = false;
					$scope.success = true;

					
				} else if (data.errno === -5){
					$scope.showSpinner = false;
					$scope.fail = true;

				} else {
					$scope.showSpinner = false;

					$timeout(function() {
						$window.location.reload();
					}, 1000);
				}
			});
		});
	}

	$scope.showSpinnerTable = true;


	$http.get("http://celinemarcelo.com:8004/v1/books?count=7&orderby=title")
	.then(function (response) {
		$scope.showSpinnerTable = false;

		$scope.books = response.data.books[1];

	});

	$scope.pageChanged = function(currentPage) {
		$scope.showSpinnerTable = true;

		offset = (7 * currentPage) - 7;

		$http.get("http://celinemarcelo.com:8004/v1/books?orderby=title&offset=" + offset + "&limit=" + limit)
		.then(function (response) {
			

			$scope.showSpinnerTable = false;

			$scope.books = response.data.books[1];

		});
	};
});
