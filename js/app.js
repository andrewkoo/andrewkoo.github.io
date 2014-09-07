var portfolioApp = angular.module('portfolioApp', ['ngRoute', 'ngAnimate']);

portfolioApp.config(function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl : 'partials/cover.html',
            controller : 'MainCtrl'
        })
    
        .when('/projects', {
            templateUrl : 'partials/projects.html',
            controller : 'MainCtrl'
        })
    
        .when('/resume', {
            templateUrl : 'partials/resume.html',
            controller : 'MainCtrl'
        })
    
        .when('/about', {
            templateUrl : 'partials/about.html',
            controller : 'MainCtrl'
        });
});

portfolioApp.controller('MainCtrl', function ($scope, $location, $routeParams) {
    $scope.isActive = function (route) {
        if ($location.path() === '/') {
            return false;
        }
        return $location.path().indexOf(route) > -1;
    };
});

portfolioApp.directive('myScroll', function($rootScope, $anchorScroll) {
    return function(scope, element) {
        $rootScope.$on('$routeChangeStart', function() {
           $anchorScroll(); 
        });
    };
});

