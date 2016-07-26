app.controller('bookDetails', function($scope, $http, $stateParams, $uibModal, $q, jwtHelper, $window, $rootScope) {
	favoriteId = undefined;
	$scope.loadingReviews = true;
	$scope.currentPage = 1;
	$scope.currentPageComment = 1;

	$scope.maxSize = 5;
	var offset = 0;
	var limit = 5;

	$http.get("http://celinemarcelo.com:8004/v1/reviews/search?book=" + $stateParams.bookId)
		.success(function(data, status) {
			$scope.totalItems = data.reviews[0].count;
		});



	$http.get("http://celinemarcelo.com:8004/v1/books/" + $stateParams.bookId)
		.success(function(response) {

			$scope.title = response.book[0].title;
			$scope.releaseDate = response.book[0].releaseDate;

			$http.get("http://celinemarcelo.com:8004/v1/authors/" + response.book[0].author)
				.success(function(response) {
					$scope.firstName = response.author[0].firstName;
					$scope.lastName = response.author[0].lastName;

					$scope.authorName = response.author[0].firstName + " " + response.author[0].lastName;
				});

			$http.get("http://celinemarcelo.com:8004/v1/categories/" + response.book[0].category)
				.success(function(response) {

					$scope.categoryName = response.category[0].categoryName;
				});

			$http.get("http://celinemarcelo.com:8004/v1/languages/" + response.book[0].language)
				.success(function(response) {

					$scope.language = response.language[0].language;
				});
		});

	var payload = jwtHelper.decodeToken($window.localStorage.token);

	$http.get("http://celinemarcelo.com:8004/v1/favorites/search?user=" + payload.userId + "&book=" + $stateParams.bookId)
		.success(function(data, status) {


			if (data.errno === -2) {
				$scope.inFavorites = 'Favorite';


			} else {
				$scope.inFavorites = 'Unfavorite';
				favoriteId = data.favorites[1][0].favoriteId;
			}

		});

	$http.get("http://celinemarcelo.com:8004/v1/reviews/search?user=" + payload.userId + "&book=" + $stateParams.bookId)
		.success(function(data, status) {
			if (data.errno === -2) {
				$scope.makeReview = 'Write a review';
			} else {
				$scope.makeReview = 'Edit your review';
			}

		});

	$http.get("http://celinemarcelo.com:8004/v1/reviews/search?book=" + $stateParams.bookId + "&count=5")
		.success(function(data, status) {
			if (data.reviews) {



				$scope.loadingReviews = false;

				$scope.reviews = data.reviews[1];
			} else {
				$scope.loadingReviews = false;
			}
		});

	$scope.bookId = $stateParams.bookId;

	$scope.open = function() {

		var modalInstance = $uibModal.open({
			controller: 'modalPicCtrl',
			templateUrl: 'modalContent.htm',
			size: 'sm',
			resolve: {
				bookId: function() {
					return $scope.bookId;
				}
			},
			windowClass: 'imgModal'
		});
	}

	$scope.editBook = function() {

		var modalInstance = $uibModal.open({
			controller: 'editCtrl',
			templateUrl: 'editBook.htm',
			resolve: {
				bookDetails: function() {
					return {
						title: $scope.title,
						firstName: $scope.firstName,
						lastName: $scope.lastName,
						language: $scope.language,
						categoryName: $scope.categoryName,
						releaseDate: $scope.releaseDate
					};
				}
			},
			windowClass: 'imgModal'
		});
	}

	$scope.modalReview = function() {

		var modalInstance = $uibModal.open({
			controller: 'modalReviewCtrl',
			templateUrl: 'modalReview.htm',
			resolve: {
				title: function() {
					return $scope.title;
				},
				user: function() {
					return payload.userId;
				},
				book: function() {
					return $stateParams.bookId;
				},
				makeReview: function() {
					return $scope.makeReview;
				}
			},
			windowClass: 'imgModal'
		});
	}

	$scope.favorite = function() {
		$scope.favoriteLoading = true;


		if ($scope.inFavorites === 'Favorite') {

			$http({
				method: "POST",
				url: "http://celinemarcelo.com:8004/v1/favorites",
				data: {
					user: payload.userId,
					book: $stateParams.bookId
				}
			}).success(function(data, status) {

				if (data.message === "success") {
					$scope.inFavorites = 'Unfavorite';
					favoriteId = data.id;

					$scope.favoriteLoading = false;

				}
			});
		} else {


			$http.delete("http://celinemarcelo.com:8004/v1/favorites/" + favoriteId)
				.success(function(data, status) {

					if (data.message === "success") {
						$scope.inFavorites = 'Favorite';

						$scope.favoriteLoading = false;
					}
				});
		}


	}


	$scope.pageChanged = function(currentPage) {
		$scope.loadingReviews = true;

		offset = (5 * currentPage) - 5;

		$http.get("http://celinemarcelo.com:8004/v1/reviews/search?&offset=" + offset + "&limit=" + limit + "&book=" + $stateParams.bookId)
			.then(function(response) {


				$scope.loadingReviews = false;

				$scope.reviews = response.data.reviews[1];

			});
	};



	$scope.showComments = function() {

		var reviewId = this.x.reviewId;

		var modalInstance = $uibModal.open({
			controller: 'commentsCtrl',
			templateUrl: 'showComments.htm',
			resolve: {
				reviewId: function() {
					return reviewId;
				},
				userId: function() {
					return payload.userId;
				}
			},
			windowClass: 'imgModal'
		});
	}


});


app.controller('modalPicCtrl', function($scope, $uibModalInstance, bookId) {
	$scope.bookId = bookId;
});

app.controller('modalReviewCtrl', function($scope, $uibModalInstance, $http, $timeout, $window, $q, $stateParams, title, user, book, makeReview, jwtHelper) {
	var reviewId;
	$scope.deleteReviewAlert = false;

	var payload = jwtHelper.decodeToken($window.localStorage.token);
	$scope.title = title;
	$scope.makeReview = makeReview;
	$scope.user = user;


	if (makeReview === 'Edit your review') {
		$http.get("http://celinemarcelo.com:8004/v1/reviews/search?book=" + $stateParams.bookId + "&user=" + payload.userId)
			.success(function(data, status) {
				$scope.review = data.reviews[1][0].review;
				$scope.rating = data.reviews[1][0].rating;
				reviewId = data.reviews[1][0].reviewId;
			});

	}

	$scope.cancel = function() {
		$uibModalInstance.dismiss('cancel');
	};

	$scope.submit = function() {
		$scope.showSpinner = true;

		console.log(makeReview);


		if (makeReview === 'Write a review') {
			$http({
				method: "POST",
				url: "http://celinemarcelo.com:8004/v1/reviews",
				headers: {
					'Content-Type': 'application/json'
				},
				data: {
					user: user,
					book: book,
					rating: $scope.rating,
					review: $scope.review,
					timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')

				}
			}).success(function(data, status) {
				$scope.showSpinner = false;

				if (data.message === "success") {
					$scope.success = true;

					$timeout(function() {
						$window.location.reload();
					}, 1000);

				} else if (data.errno === -5) {
					$scope.fail = true;

				} else if (data.errno === -1) {
					$scope.exists = true;
				}

			});
		} else {
			$http({
				method: "PUT",
				url: "http://celinemarcelo.com:8004/v1/reviews/" + reviewId,
				headers: {
					'Content-Type': 'application/json'
				},
				data: {
					user: user,
					book: book,
					rating: $scope.rating,
					review: $scope.review
				}
			}).success(function(data, status) {
				$scope.showSpinner = false;

				if (data.message === "success") {
					$scope.success = true;

					$timeout(function() {
						$window.location.reload();
					}, 1000);

				} else if (data.errno === -5) {
					$scope.fail = true;

				}

			});
		}
	};

	$scope.deleteReview = function() {
		$scope.deleteReviewAlert = true;
	};

	$scope.yes = function() {
		$scope.showSpinner = true;
		$http({
			method: "DELETE",
			url: "http://celinemarcelo.com:8004/v1/reviews/" + reviewId,
		}).success(function (data, status){
			$scope.showSpinner = false;
			$scope.deleted = true;
			$scope.deleteReviewAlert = false;
			$timeout(function() {
				$window.location.reload();
			}, 1000);
		});
	};

	$scope.no = function() {
		$scope.deleteReviewAlert = false;
	};	


});


	
app.controller('commentsCtrl', function($scope, $http, $uibModalInstance, reviewId, userId) {
	var offsetComment = 0;
	var limitComments = 3;


	$scope.submittingComment = false;
	$scope.reviewId = reviewId;
	$scope.userId = userId;


	$http.get("http://celinemarcelo.com:8004/v1/reviewcomments/count?review=" + reviewId)
		.success(function(data, status) {
			$scope.totalComments = data[0].count;
		});

	$scope.showCommentSpinner = true;
	$http.get("http://celinemarcelo.com:8004/v1/reviewcomments/search?review=" + reviewId + "&count=3")
		.success(function(data, status) {

			if (data.reviewcomments) {

				$scope.showCommentSpinner = false;

				$scope.showPages = true;
				$scope.reviewComments = data.reviewcomments[1];
				$scope.currentPageComment = 1;
			} else {
				$scope.showCommentSpinner = false;


				$scope.reviewComments = undefined;
				$scope.showPages = false;
			}
		});

	$scope.pageChangedComment = function(currentPageComment) {

		$scope.showCommentSpinner = true;

		offsetComment = (3 * currentPageComment) - 3;


		$http.get("http://celinemarcelo.com:8004/v1/reviewComments/search?&offset=" + offsetComment + "&limit=" + limitComments + "&review=" + reviewId)
			.then(function(response) {



				if (response.data.reviewcomments) {

					$scope.reviewComments = response.data.reviewcomments[1];
					$scope.showCommentSpinner = false;

				} else {
					$scope.reviewComments = [];
					$scope.showCommentSpinner = false;
				}

				$scope.currentPageComment = currentPageComment;

			});

	};


	$scope.pagination = {
		current: 1
	};



	$scope.close = function() {
		$uibModalInstance.dismiss('cancel');
	};

	$scope.commentSubmit = function() {
		$scope.submittingComment = true;

		$http({
			method: "POST",
			url: "http://celinemarcelo.com:8004/v1/reviewcomments",
			data: {
				user: userId,
				review: reviewId,
				comment: $scope.comment,
				timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
			}
		}).success(function(data, status) {
			$scope.submittingComment = false;

			$http.get("http://celinemarcelo.com:8004/v1/reviewcomments/count?review=" + reviewId)
			.success(function(data, status) {
				$scope.totalComments = data[0].count;

				$scope.pageChangedComment(Math.ceil($scope.totalComments / 3));
				$scope.comment = "";
			});


		});
	};

	$scope.editComment = function() {
		$scope.editing = this.y.reviewCommentId;
		$scope.deleting = undefined;

		$scope.commentCopy = angular.copy(this.y.comment);
	};

	$scope.deleteComment = function() {
		$scope.deleting = this.y.reviewCommentId;

		$scope.editing = undefined;
	};


	$scope.cancelEdit = function() {
		$scope.editing = undefined;
	};

	$scope.submitCommentEdit = function() {
		$scope.editingComment = true;

		var reviewCommentId = this.y.reviewCommentId;
		var comment = this.commentCopy;

		console.log(reviewCommentId);

		$http({
			method: "PUT",
			url: "http://celinemarcelo.com:8004/v1/reviewcomments/" + reviewCommentId,
			headers: {
				'Content-Type': 'application/json'
			},
			data: {
				comment: comment
			}
		}).success(function (data, status){
			$scope.editing = undefined;
			$scope.editingComment = false;
			$scope.pageChangedComment($scope.currentPageComment);

		});


	};

	$scope.yes = function(){
		var reviewCommentId = this.y.reviewCommentId;
		$scope.deletingSpinner = true;
		$http({
			method: "DELETE",
			url: "http://celinemarcelo.com:8004/v1/reviewcomments/" + reviewCommentId,
		}).success(function (data, status){
			$scope.deleting = undefined;
			$http.get("http://celinemarcelo.com:8004/v1/reviewcomments/count?review=" + reviewId)
			.success(function(data, status) {
				$scope.totalComments = data[0].count;
				$scope.deletingSpinner = false;
				$scope.pageChangedComment($scope.currentPageComment);
			});
		});

	};

	$scope.no = function(){
		$scope.deleting = undefined;
	};
});

app.controller('editCtrl', function($scope, $http, $q, Upload, $window, $timeout, $stateParams, bookDetails){
	$scope.title = bookDetails.title;
	$scope.firstName = bookDetails.firstName;
	$scope.lastName = bookDetails.lastName;
	$scope.categoryName = bookDetails.categoryName;
	$scope.language = bookDetails.language;
	$scope.releaseDate = new Date(Date.parse(bookDetails.releaseDate));


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
			authorId = data.id;
		});

		var checkCategory = $http({
			method: "POST",
			url: "http://celinemarcelo.com:8004/v1/categories", 
			headers: {
				'Content-Type': 'application/json'
			},
			data: categoryBody
		}).success(function (data, status) {
			categoryId = data.id;
		});

		var checkLanguage = $http({
			method: "POST",
			url: "http://celinemarcelo.com:8004/v1/languages", 
			headers: {
				'Content-Type': 'application/json'
			},
			data: languageBody
		}).success(function (data, status) {
			languageId = data.id;
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
				method: "PUT",
				url: "http://celinemarcelo.com:8004/v1/books/" + $stateParams.bookId, 
				headers: {
					'Content-Type': 'application/json'
				},
				data: bookBody
			}).success(function (data, status) {
				if ($scope.file != undefined && data.message === "success"){
					Upload.upload({
						url: 'http://celinemarcelo.com:8004/v1/upload/' + $stateParams.bookId, //webAPI exposed to upload the file
						data: {file: $scope.file, id: $stateParams.bookId} //pass file as data, should be user ng-model
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
							$timeout(function() {
								$window.location.reload();
							}, 1000);

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

});