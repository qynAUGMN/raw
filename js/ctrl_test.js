'use strict';

/* Controllers */

// var raw = require('../lib/raw').raw;

angular.module('raw.controllers', [])

  .controller('RawCtrl', function ($rootScope, $scope, dataService, $http, $timeout, $location) {
    dataService.loadUser()
    .then(function(data) {
      $rootScope.user = data;
    });
  })
