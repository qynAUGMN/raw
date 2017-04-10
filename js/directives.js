'use strict';

/* Directives */

var raw = require('../lib/raw').raw;

angular.module('raw.directives', [])

  .directive('jsonViewer', function (dataService) {
    return {
      scope : {
        json : "=",
        onSelect : "="
      },

      link: function postLink(scope, element, attrs) {

        scope.$watch('json', function(json){
          update();
        })

        function update(){

          d3.select(element[0]).selectAll("*").remove();

          var tree = d3.select(element[0])
            .append("div")
            .classed("json-node","true")

          var j = scope.json;

          explore(j, tree);

          function explore(m, el){


            if ( el === tree && is.object(m) && is.not.array(m) && is.not.empty(m) ) {

              el.append("div")
              //  .classed("json-node","true")
                .text(function(d){
                  return "{";
              })

            }


            var n = el === tree && is.array(m) && is.not.empty(m) ? [m] : m;

            for (var c in n) {

              var cel = el.append("div")
                .datum(n[c])//function(d){console.log(el === tree, n); return el === tree ? {tree:n} : n[c]})
                .classed("json-node","true")

              if ( is.array(n[c]) && is.not.empty(n[c])) {

                cel.classed("json-closed", function(d){ return el === tree ? "false" : "true"})

                cel.classed("json-array", function(d){ return el === tree ? "false" : "true"})

                //data-toggle="tooltip"
                //data-title="Clear all"

                cel.append("i")
                .classed("json-icon fa fa-plus-square-o pull-left","true")
                .on("click", function(d){
                  d3.event.stopPropagation();
                  d3.select(this.parentNode).classed("json-closed", function(){
                    return !d3.select(this).classed("json-closed");
                  })
                  d3.select(this).classed("fa-plus-square-o", d3.select(this.parentNode).classed("json-closed"))
                  d3.select(this).classed("fa-minus-square-o", !d3.select(this.parentNode).classed("json-closed"))
                })
              }

              cel.append("div")
              .html(function(d){
                  var pre = is.array(n) ? "" : "<b>"+c + "</b> : ";
                  var text = is.array(n[c]) ? "[" : is.object(n[c]) ? "{" : n[c];
                  text += is.array(n[c]) && !n[c].length ? "]" : is.object(n[c]) && is.empty(n[c]) ? "}" : "";
                  return pre + text;
                })

              if (is.object(n[c])) explore(n[c], cel);
            }

            if (is.array(n) && el !== tree) {

              el.select('div')
              .attr("data-toggle","tooltip")
              .attr("data-title", function(d){
                return "Load " + d.length + " records";
              })
              .on("mouseover", function(d){
                d3.event.stopPropagation();
                d3.select(this.parentNode).classed("json-hover", true)
              })
              .on("mouseout", function(d){
                d3.event.stopPropagation();
                d3.select(this.parentNode).classed("json-hover", false)
              })
              .on("click", function(d){
                d3.event.stopPropagation();
                scope.onSelect(d);
              })
            }

            if ( is.object(n) && is.not.empty(n) ) {

              if (is.array(n) && el === tree) return;

              el.append("div")
              //  .classed("json-node","true")
                .text(function(d){
                  var text = is.array(n) ? "]" : "}";
                  return text;
              })
            }

            $('[data-toggle="tooltip"]').tooltip({animation:false});

          }


        }


      }
    };
  })

  .directive('chart', function ($rootScope, dataService) {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {

        function update() {
          $('*[data-toggle="tooltip"]').tooltip({ container:'body' });

          d3.select(element[0]).select("*").remove();

          if (!scope.chart || !scope.data.length) return;
          if (!scope.model.isValid()) return;

          d3.select(element[0])
            .append("svg")
            .datum(scope.data)
            .call(
              scope.chart
                .on('startDrawing', function(){
                  if(!scope.$$phase) {
                        scope.chart.isDrawing(true)
                        scope.$apply()
                  }
                })
                .on('endDrawing', function(){
                  $rootScope.$broadcast("completeGraph");
                  if(!scope.$$phase) {
                        scope.chart.isDrawing(false)
                        scope.$apply()
                  }
                })
            )

          scope.svgCode = d3.select(element[0])
              .select('svg')
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .node().parentNode.innerHTML;

          $rootScope.$broadcast("completeGraph");

        }

        scope.delayUpdate = dataService.debounce(update, 300, false);

        scope.$watch('chart', function(){ console.log("> chart"); update(); });
        scope.$on('update', function(){ console.log("> update"); update(); });
        //scope.$watch('data', update)
        scope.$watch(function() {
          if (scope.model) {
            var _dimensionLabels = [];
            scope.model.dimensions().forEach(function(index, d) {
              _dimensionLabels.push($.extend({}, d.value[0], {name: index}));
            });
            scope.dimensionLabels = _dimensionLabels;
            return scope.model(scope.data);
          }
        }, update, true);
        scope.$watch(function() {
          if (scope.chart) {
            if (d3.select("#chart > svg").node()) {
              var html = d3.select("#chart > svg")
                .node().parentNode.innerHTML;

              if (!html) return;

              var content = d3.select("body").append("canvas")
                .attr("id", "canvas")
                .style("display", "none")

              var image = new Image;
              image.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(html)));

              var canvas = document.getElementById("canvas");

              var context = canvas.getContext("2d");

              image.onload = function() {
                canvas.width = image.width;
                canvas.height = image.height;
                context.drawImage(image, 0, 0);

                $('.graph-url').text(canvas.toDataURL("image/png;base64"));
              };
            }
            
            return scope.chart.options().map(function (d) {
              return d.value;
            });
          }
        }, scope.delayUpdate, true);
      }
    };
  })

  .directive('chartOption', function () {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {

        var firstTime = false;

        element.find('.option-fit').click(function(){
          scope.$apply(fitWidth);
        });

        scope.$watch('chart', fitWidth);

        function fitWidth(chart, old) {
          if (chart == old) return;
          if(!scope.option.fitToWidth || !scope.option.fitToWidth()) return;
          scope.option.value = $('.col-lg-9').width();
        }

        $(document).ready(fitWidth);

      }
    };
  })

  .directive('colors', function ($rootScope) {
    return {
      restrict: 'A',
      templateUrl : 'templates/colors.html',
      link: function postLink(scope, element, attrs) {

        scope.scales = [

          {
            type : 'Ordinal (categories)',
            value : d3.scale.ordinal().range(raw.divergingRange(1)),
            reset : function(domain){ this.value.range(raw.divergingRange(domain.length || 1)); },
            update : ordinalUpdate
          },
          /*{
            type : 'Ordinal (max 20 categories)',
            value : d3.scale.category20(),
            reset : function(){ this.value.range(d3.scale.category20().range().map(function (d){ return d; })); },
            update : ordinalUpdate
          },
          {
            type : 'Ordinal B (max 20 categories)',
            value : d3.scale.category20b(),
            reset : function(){ this.value.range(d3.scale.category20b().range().map(function (d){ return d; })); },
            update : ordinalUpdate
          },
          {
            type : 'Ordinal C (max 20 categories)',
            value : d3.scale.category20c(),
            reset : function(){ this.value.range(d3.scale.category20c().range().map(function (d){ return d; })); },
            update : ordinalUpdate
          },
          {
            type : 'Ordinal (max 10 categories)',
            value : d3.scale.category10(),
            reset : function(){ this.value.range(d3.scale.category10().range().map(function (d){ return d; })); },
            update : ordinalUpdate
          },*/
          {
            type : 'Linear (numeric)',
            value : d3.scale.linear().range(["#f7fbff", "#08306b"]),
            reset : function(){ this.value.range(["#f7fbff", "#08306b"]); },
            update : linearUpdate
          }
        ];

        function ordinalUpdate(domain) {
          if (!domain.length) domain = [null];
          this.value.domain(domain);
          listColors();
        }

        function linearUpdate(domain) {
          domain = d3.extent(domain, function (d){return +d; });
          if (domain[0]==domain[1]) domain = [null];
          this.value.domain(domain).interpolate(d3.interpolateLab);
          listColors();
        }

        scope.setScale = function(){
          scope.option.value = scope.colorScale.value;
          scope.colorScale.reset(scope.colorScale.value.domain());
          $rootScope.$broadcast("update");
        }

        function addListener(){
          scope.colorScale.reset(scope.colorScale.value.domain());
          scope.option.on('change', function (domain){
            scope.option.value = scope.colorScale.value;
            scope.colorScale.update(domain);
          })
        }

        scope.colorScale = scope.scales[0];

        scope.$watch('chart', addListener)
        scope.$watch('colorScale.value.domain()',function (domain){
          scope.colorScale.reset(domain);
          listColors();
        }, true);

        function listColors(){
          scope.colors = scope.colorScale.value.domain().map(function (d){
            return { key: d, value: scope.colorScale.value(d).charAt(0) == '#' ? scope.colorScale.value(d) : '#' + scope.colorScale.value(d) }
          }).sort(function (a,b){
            if (raw.isNumber(a.key) && raw.isNumber(b.key)) return a.key - b.key;
            return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
          })
        }

        scope.setColor = function(key, color) {
          var domain = scope.colorScale.value.domain(),
              index = domain.indexOf(key),
              range = scope.colorScale.value.range();
          range[index] = color;
          scope.option.value.range(range);
          $rootScope.$broadcast("update");
        }

        scope.foreground = function(color){
          return d3.hsl(color).l > .5 ? "#000000" : "#ffffff";
        }

        scope.$watch('option.value', function (value){
          if(!value) scope.setScale();
        })

      }
    };
  })

  .directive('sortable', function ($rootScope) {
    return {
      restrict: 'A',
      scope : {
        title : "=",
        value : "=",
        types : "=",
        multiple : "="
      },
      template:'<div class="msg">{{messageText}}</div>',
      link: function postLink(scope, element, attrs) {

        var removeLast = false;

        element.sortable({
          items : '> li',
          connectWith: '.dimensions-container',
          placeholder:'drop',
          start: onStart,
          update: onUpdate,
          receive : onReceive,
          remove: onRemove,
          over: over,
          tolerance:'intersect'
        })

        function over(e,ui) {debugger;
          var dimension = ui.item.data().dimension,
              html = isValidType(dimension) ? '<i class="fa fa-arrow-circle-down breath-right"></i>Drop here' : '<i class="fa fa-times-circle breath-right"></i>Don\'t drop here'
          element.find('.drop').html(html);
        }

        function onStart(e,ui) {
          var dimension = ui.item.data().dimension,
              html = isValidType(dimension) ? '<i class="fa fa-arrow-circle-down breath-right"></i>Drop here' : '<i class="fa fa-times-circle breath-right"></i>Don\'t drop here'
          element.find('.drop').html(html);
          element.parent().css("overflow","visible");
          angular.element(element).scope().open=false;
        }

        function onUpdate(e,ui) {
          ui.item.find('.dimension-icon').remove();

          if (ui.item.find('span.remove').length == 0) {
            ui.item.append("<span class='remove pull-right'>&times;</span>");
          }
          ui.item.find('span.remove').click(function(){ ui.item.remove(); onRemove(); });

          if (removeLast) {
            ui.item.remove();
            removeLast = false;
          }

          scope.value = values();
          scope.$apply();

          element.parent().css("overflow", "hidden");

          var dimension = ui.item.data().dimension;
          ui.item.toggleClass("invalid", !isValidType(dimension));
          message();

          $rootScope.$broadcast("update");
        }

        scope.$watch('value', function (value) {
          if (!value.length) {
            element.find('li').remove();
          }
          message();
        })

        function onReceive(e, ui) {
          var dimension = ui.item.data().dimension;

          removeLast = hasValue(dimension);

          if (!scope.multiple && scope.value.length) {
            var found = false;
            element.find('li').each(function (i, d) {
              if ($(d).data().dimension.key == scope.value[0].key && !found) {
                $(d).remove();
                found = true;
                removeLast = false;
              }
            });
          }
          scope.value = values();
          ui.item.find('span.remove').click(function(){  ui.item.remove(); onRemove(); })
        }

        function onRemove(e, ui) {
          scope.value = values();
          scope.$apply();
          $rootScope.$broadcast("update");
        }

        function values() {
          if (!element.find('li').length) return [];
          var v = [];
          element.find('li').map(function (i, d) {
            v.push($(d).data().dimension);
          });
          return v;
        }

        function hasValue(dimension) {
          for (var i = 0; i < scope.value.length; i++) {
            if (scope.value[i].key == dimension.key) {
              return true;
            }
          }
          return false;
        }

        function isValidType(dimension) {
          if (!dimension) return;
          return scope.types.map(function (d){ return d.name; }).indexOf(dimension.type) != -1;
        }

        function message() {
          var hasInvalidType = values().filter(function (d){ return !isValidType(d); }).length > 0;
          scope.messageText = hasInvalidType
            ? "You should only use " + scope.types.map(function (d){ return d.name.toLowerCase() + "s"; }).join(" or ") + " here"
            : "Drag " + scope.types.map(function (d){ return d.name.toLowerCase() + "s"; }).join(", ") + " here";
          //element.parent().find('.msg').html(messageText);
        }

      }
    }
  })

  .directive('draggable', function () {
    return {
      restrict: 'A',
      scope:false,
    //  templateUrl : 'templates/dimensions.html',
      link: function postLink(scope, element, attrs) {

        scope.$watch('metadata', function(metadata){
          if(metadata && !metadata.length) element.find('li').remove();
          element.find('li').draggable({
            connectToSortable:'.dimensions-container',
            helper : 'clone',
            revert: 'invalid',
            start : onStart
          })
        })

        function onStart(e,ui){
          ui.helper.width($(e.currentTarget).width())
          ui.helper.css('z-index','100000');
        }

      }
    }
  })

  .directive('group', function () {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        scope.$watch(attrs.watch, function (watch){
          var last = element;
          element.children().each(function(i, o){
            if( (i) && (i) % attrs.every == 0) {
              var oldLast = last;
              last = element.clone().empty();
              last.insertAfter(oldLast);
            }
            $(o).appendTo(last)
          })

        },true)

      }
    };
  })

  .directive('rawTable', function () {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {

        var sortBy,
            descending = true;

        function update(){

          d3.select(element[0]).selectAll("*").remove();

          if(!scope.data|| !scope.data.length) {
            d3.select(element[0]).append("span").text("Please, review your data")
            return;
          }

          var table = d3.select(element[0])
            .append('table')
            .attr("class","table table-striped table-condensed")

          if (!sortBy) sortBy = scope.metadata[0].key;

          var headers = table.append("thead")
            .append("tr")
            .selectAll("th")
            .data(scope.metadata)
            .enter().append("th")
              .text( function(d){ return d.key; } )
              .on('click', function (d){
                descending = sortBy == d.key ? !descending : descending;
                sortBy = d.key;
                update();
              })

          headers.append("i")
            .attr("class", function (d){ return descending ? "fa fa-sort-desc pull-right" : "fa fa-sort-asc pull-right"})
            .style("opacity", function (d){ return d.key == sortBy ? 1 : 0; })

          var rows = table.append("tbody")
            .selectAll("tr")
            .data(scope.data.sort(sort))
            .enter().append("tr");

          var cells = rows.selectAll("td")
            .data(d3.values)
            .enter().append("td");
            cells.text(String);

        }

        function sort(a,b) {
          if (raw.isNumber(a[sortBy]) && raw.isNumber(b[sortBy])) return descending ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy];
          return descending ? a[sortBy] < b[sortBy] ? -1 : a[sortBy] > b[sortBy] ? 1 : 0 : a[sortBy] < b[sortBy] ? 1 : a[sortBy] > b[sortBy] ? -1 : 0;
        }

        scope.$watch('data', update);
        scope.$watch('metadata', function(){
          sortBy = null;
          update();
        });

      }
    };
  })

  .directive('copyButton', function () {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {

        ZeroClipboard.config({ moviePath: "bower_components/zeroclipboard/ZeroClipboard.swf" });

        var client = new ZeroClipboard( element );

        client.on( "load", function (client) {
          client.on( "complete", function (client, args) {
            element.tooltip('destroy');
            element.tooltip({ title:'Copied!'});
            element.tooltip('show')
          } );
        });

        client.on( 'mouseover', function ( client, args ) {
          element.tooltip({title:'Copy to clipboard'});
          element.tooltip('show');
        });

        client.on( 'mouseout', function ( client, args ) {
          element.tooltip('destroy');
        });

      }
    };
  })

  .directive('coder', function () {
    return {
      restrict: 'EA',
      template :  '<textarea id="source" readonly class="source-area" rows="4" ng-model="svgCode"></textarea>',
      link: function postLink(scope, element, attrs) {

        scope.$on('completeGraph',function(){

          var svgCode = d3.select('#chart > svg')
            .attr("version", 1.1)
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .node().parentNode.innerHTML;

          element.find('textarea').val(svgCode)
        })

        /*function asHTML(){
          if (!$('#chart > svg').length) return "";
          return d3.select('#chart > svg')
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .node().parentNode.innerHTML;
        }

        scope.$watch(asHTML, function(){
          scope.html = asHTML();
        },true)
        scope.$on('update', function(){
          scope.html = asHTML();
        })*/
      }
    };
  })

  .directive('downloader', function () {
    return {
      restrict: 'E',
      replace: true,
      template: '<div class="row">' +
                  '<form class="form-search col-lg-12">' +
                    '<button bs-select class="btn btn-default" placeholder="Choose type" ng-model="mode" ng-options="m.label for m in modes">' +
                    'Select <span class="caret"></span>' +
                    '</button><br>' +
                    '<input class="form-control col-lg-12" ng-show="mode.label !== \'Email\'" placeholder="文件名称" type="text" ng-model="filename">' +
                    '<button bs-select class="btn btn-default clearfix" ng-show="mode.label === \'Email\'" placeholder="发送频率" ng-model="emailRange" ng-options="m.label for m in ranges">' +
                    'Select <span class="caret"></span>' +
                    '</button><br>' +
                    '<button bs-select class="btn btn-default clearfix" ng-show="emailRange.label === \'每周\'" placeholder="日期" ng-model="detailRange" ng-options="m.label for m in weekRange">' +
                    'Select <span class="caret"></span>' +
                    '</button>' +
                    '<button bs-select class="btn btn-default clearfix" ng-show="emailRange.label === \'每月\'" placeholder="日期" ng-model="detailRange" ng-options="m.label for m in monthRange">' +
                    'Select <span class="caret"></span>' +
                    '</button>' +
                    '<input class="form-control col-lg-12" ng-show="mode.label === \'Email\'" placeholder="发送时间" ng-model="emailTime" type="text" onfocus="(this.type=\'time\')">' +
                    '<input class="form-control col-lg-12" ng-show="mode.label === \'Email\'" placeholder="邮件名称" ng-model="emailSubject" type="text">' +
                    '<input class="form-control col-lg-12" ng-show="mode.label === \'Email\'" placeholder="邮件收件人" ng-model="emailReceiver" type="text">' +
                    '<button class="btn btn-success form-control" ng-class="{disabled:!mode.label}" ng-click="mode.download()">Download</button>' +
                  '</form>' +
                '</div>',

      link: function postLink(scope, element, attrs) {

        var source = "#chart > svg";

        var getBlob = function() {
            return window.Blob || window.WebKitBlob || window.MozBlob;
          }

        // Removing HTML entities from svg
        function decodeHtml(html) {
          /*var txt = document.createElement("textarea");
          txt.innerHTML = html;
          return txt.value;*/
          return html.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
             return '&#'+i.charCodeAt(0)+';';
          });
        }

        function downloadSvg(){
          var BB = getBlob();

          var html = d3.select(source)
            .attr("version", 1.1)
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .node().parentNode.innerHTML;

          //html = he.encode(html);

          var isSafari = (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1);

          if (isSafari) {
            var img = "data:image/svg+xml;utf8," + html;
            var newWindow = window.open(img, 'download');
          } else {
            var blob = new BB([html], { type: "data:image/svg+xml" });
            saveAs(blob, (element.find('input').val() || element.find('input').attr("placeholder")) + ".svg")
          }

        }

        function downloadPng() {

          var content = d3.select("body").append("canvas")
            .attr("id", "canvas")
            .style("display", "none")

          var html = d3.select(source)
            .node().parentNode.innerHTML;

          var image = new Image;
          image.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(html)));

          var canvas = document.getElementById("canvas");

          var context = canvas.getContext("2d");

          image.onload = function() {

            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0);

            var isSafari = (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1);

            if (isSafari) {
              var img = canvas.toDataURL("image/png;base64");
              var newWindow = window.open(img, 'download');
              window.location = img;
            } else {
              var a = document.createElement("a");
              a.download = (scope.filename || element.find('input').attr("placeholder")) + ".png";
              a.href = canvas.toDataURL("image/png;base64");
              var event = document.createEvent("MouseEvents");
              event.initMouseEvent(
                "click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null
              );
              a.dispatchEvent(event);
            }
          };
          d3.select("#canvas").remove();

        }

        var downloadData = function() {
          var json = JSON.stringify(scope.model(scope.data));
          var blob = new Blob([json], { type: "data:text/json;charset=utf-8" });
          saveAs(blob, (scope.filename || element.find('input').attr("placeholder")) + ".json")
        }

        var email = function() {
          var content = d3.select("body").append("canvas")
            .attr("id", "canvas")
            .style("display", "none")

          var html = d3.select(source)
            .node().parentNode.innerHTML;

          var image = new Image;
          image.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(html)));

          var canvas = document.getElementById("canvas");

          var context = canvas.getContext("2d");

          image.onload = function() {

            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0);

            if (!scope.emailRange) {
              alert('发送频率不能为空');
              return;
            }

            if (scope.emailRange.value === 2 || scope.emailRange.value === 3) {
              if (!scope.detailRange) {
                alert('日期不能为空');
                return;
              }
            }

            if (!scope.emailTime) {
              alert('发送时间不能为空');
              return;
            }

            if (!scope.emailSubject) {
              alert('邮件名称不能为空');
              return;
            }

            if (!scope.emailReceiver) {
              alert('邮件收件人不能为空');
              return;
            }

            if (!scope.emailReceiver.match(/@ele.me$/)) {
              alert('邮件收件人只能是ele.me');
              return;
            }

            scope.submit(canvas.toDataURL("image/png;base64"));
          }
          
        }

        scope.modes = [
          { label: 'Vector graphics (svg)', download: downloadSvg },
          { label: 'Image (png)', download: downloadPng },
          { label: 'Email', download: email},
          { label: 'Data model (json)', download: downloadData }
        ]

        scope.ranges = [
          { label: '每天', value: 1 },
          { label: '每周', value: 2 },
          { label: '每月', value: 3 }
        ]

        scope.weekRange = [
          { label: '周一', value: 1 },
          { label: '周二', value: 2 },
          { label: '周三', value: 3 },
          { label: '周四', value: 4 },
          { label: '周五', value: 5 },
          { label: '周六', value: 6 },
          { label: '周日', value: 7 }
        ]

        scope.monthRange = [
          { label: '1', value: 1 },
          { label: '2', value: 2 },
          { label: '3', value: 3 },
          { label: '4', value: 4 },
          { label: '5', value: 5 },
          { label: '6', value: 6 },
          { label: '7', value: 7 },
          { label: '8', value: 8 },
          { label: '9', value: 9 },
          { label: '10', value: 10 },
          { label: '11', value: 11 },
          { label: '12', value: 12 },
          { label: '13', value: 13 },
          { label: '14', value: 14 },
          { label: '15', value: 15 },
          { label: '16', value: 16 },
          { label: '17', value: 17 },
          { label: '18', value: 18 },
          { label: '19', value: 19 },
          { label: '20', value: 20 },
          { label: '21', value: 21 },
          { label: '22', value: 22 },
          { label: '23', value: 23 },
          { label: '24', value: 24 },
          { label: '25', value: 25 },
          { label: '26', value: 26 },
          { label: '27', value: 27 },
          { label: '28', value: 28 },
          { label: '29', value: 29 },
          { label: '30', value: 30 },
          { label: '31', value: 31 }
        ]
        //scope.mode = scope.modes[0]
      }
    };
  });
