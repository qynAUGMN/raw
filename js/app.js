'use strict';

require('../charts/scatterPlot');
require('../charts/parallelCoordinates');
require('../charts/barChart');
require('../charts/pieChart');
require('../charts/gantt');
require('../charts/smallMultiplesArea');

angular.module('edv', [
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  'raw.filters',
  'raw.services',
  'raw.directives',
  'raw.controllers',
  'mgcrea.ngStrap',
  'ui',
  'colorpicker.module',
  'ngFileUpload',
  'ui-notification'
])

.config(['$routeProvider', '$locationProvider', '$httpProvider', function ($routeProvider, $locationProvider, $httpProvider) {
  $routeProvider.when('/', {templateUrl: 'partials/main.html', controller: 'RawCtrl'});
  $routeProvider.otherwise({redirectTo: '/'});
  $locationProvider.html5Mode(true);
  $httpProvider.defaults.withCredentials = true;
}]);

require('./services');
require('./controllers');
// require('./ctrl_test');
require('./filters');
require('./directives');
