angular.module('smartConnectionApp', ['ngAnimate', 'ngMaterial', 'ngMessages', 'smartConnectionRoutes', 'authService', 'mainCtrl', 'spCtrl', 'serviceProviderService', 'cCtrl', 'customerService', 'empCtrl', 'employeeService', 'lookupCtrl', 'lookupService','ui.grid','ngTouch','ui.grid.pagination','ngSanitize','toaster','ui.bootstrap'])
    .config(function($httpProvider) {
        $httpProvider.interceptors.push('AuthInterceptor');
    });

/*  .controller('mainController', function() {

      var scope = this;
      scope.bigMessage = 'This is main page';

  })
  .controller('serviceProviderController', function() {
      var scope = this;
      scope.bigMessage = 'This is service provider page';
  })
  .controller('loginController', function() {
      console.log('login page');
      var scope = this;
      scope.bigMessage = 'This is login page';
  });*/
