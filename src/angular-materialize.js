(function() {
var scripts = document.getElementsByTagName("script");
var currentScriptPath = scripts[scripts.length-1].src;
var scriptNameIndex = currentScriptPath.indexOf('angular-materialize.js');
currentScriptPath = currentScriptPath.substring(0, scriptNameIndex);

angular.module('materialize', [])
	.directive('mtzUiRouter', ['$rootScope', function($rootScope) {
		return {
			restrict: 'A',
			link: function(scope, element, attr) {
				$rootScope.$on('$stateChangeSuccess', function() {
					$(".modal-overlay").remove();
					$("html").css("overflow", "");
				});
			}
		};
	}])
    .directive('mtzRange', [function() {
        return {
            restrict: 'A',
            scope: {
                rangeValue: "=",
                rangeMin: "=",
                rangeMax: "="
            },
            link: function(scope, element, attr) {
                var offset = 0;
                if (attr.rngZero)
                    offset = scope.rngMin;

                scope.$watch('rngMin', function() {
                    element.attr("min", scope.rngMin - offset);

                    if (attr.rngZero)
                        offset = scope.rngMin;
                });

                scope.$watch('rngMax', function() {
                    element.attr("max", scope.rngMax - offset);
                });

                scope.$watch('rngValue', function() {
                    element.val(scope.rngValue - offset);
                });

                element.on("change mousemove", function() {
                    scope.rngValue = parseInt(element.val()) + offset;
                });
            }
        };
    }]).directive('mtzSelect', ['$parse', function($parse) {
		var NG_OPTIONS_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?(?:\s+disable\s+when\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/;

        return {
            restrict: 'A',
            link: function(scope, element, attr) {
                element.material_select();

				var ngModel = attr.ngModel;
				var ngOptions = attr.ngOptions;

				if (ngModel) {
					scope.$watch(ngModel, function() {
	                    element.material_select();
	                });
				}

				if (ngOptions) {
					var match = ngOptions.match(NG_OPTIONS_REGEXP);

					if (match && match[8]) {
						scope.$watch(match[8], function() {
		                    element.material_select();
		                });
					}
				}
            }
        };
    }]).directive('mtzTextarea', [function() {
        return {
            restrict: 'A',
            scope: {
                ngModel: "="
            },
            link: function(scope, element, attr) {
                scope.$watch('ngModel', function() {
                    element.trigger('autoresize');
                });
            }
        };
    }]).directive('mtzModalPlus', [function() {
        return {
            restrict: 'A',
            scope: {
                trigger: "=modalTrigger",
				ready: "&modalReady",
				complete: "&modalComplete",
                watch: "=modalWatch",
                group: "@modalGroup",
                options: "=?modalOptions"
            },
            link: function(scope, element, attr) {
                scope.options = scope.options || {};
                scope.options.objectEquality = scope.options.objectEquality || false;

                var triggerDefaultValue = angular.copy(scope.trigger);
                var opened = false;

                element.modal({
                    ready: function() {
                        if (scope.ready)
                            scope.ready();
                    },
                    complete: function() {
                        opened = false;
                        if(scope.complete)
                            scope.complete();
                        scope.$apply(function() {
                            scope.trigger = triggerDefaultValue;
                        });
                    }
                });

				scope.$on(element[0].id + ':open', function(event) {
					opened = true;
                    element.modal('open');
				});

				scope.$on(element[0].id + ':close', function(event) {
                    element.modal('close');
				});

                scope.$watch('trigger', function() {
                    if (scope.trigger) {
                        if (opened)
                            return;

                        opened = true;

                        element.modal('open');
                    }
                    else {
                        if (!opened)
                            return;

                        element.modal('close');
                    }
                }, scope.options.objectEquality);

                scope.$watch('watch', function() {
                    if (scope.watch === undefined)
                        return;

                    if (scope.group !== undefined) {
                        $("[modal-group='" + scope.mdlGroup + "']").find('.modal-trigger').modal();
                    }
                    else {
                        element.find('.modal-trigger').modal();
                    }
                }, scope.options.objectEquality);
            }
        };
    }]).directive('mtzPagination', [function() {
        function computePages(scope) {
            var sw = Math.floor((scope.maxPages - 1) / 2);
            var beginPage = scope.page - sw;
            var endPage = scope.page + sw;

            var offset = 0;
            if (beginPage < 0) {
                offset = -beginPage;
            }
            else if (endPage >= scope.pages) {
                offset = scope.pages - endPage - 1;
            }

            beginPage += offset;
            endPage += offset;

            scope.pagesArray = [];
            for (var i = 0; i < scope.pages; i++) {
                if (i >= beginPage && i <= endPage)
                    scope.pagesArray.push(i);
            }
        }

        return {
            restrict: 'A',
            templateUrl: currentScriptPath + '/pagination.html',
            scope : {
                refresh: "=paginationRefresh",
                pageSize: "=?paginationPageSize",
                count: "=paginationCount",
                maxPages: "=?paginationMaxPages",
				page: "=?paginationPage"
            },
            link : function(scope, element, attr) {
                scope.page = 0;
                scope.pages = 1;
                scope.pagesArray = [1];
                scope.maxPages = scope.maxPages || 5;

                scope.$watch('count', function() {
                    scope.pages = Math.ceil(scope.count / scope.pageSize);

                    computePages(scope);

                    if (scope.page > scope.pages - 1)
                        scope.page = Math.max(scope.pages - 1, 0);

                    scope.refresh(scope.page, scope.pageSize);
                });
            },
            controller: ['$scope', function($scope) {
                $scope.prevPage = function() {
                    if ($scope.page <= 0)
                        return;

                    --$scope.page;

                    computePages($scope);

                    $scope.refresh($scope.page, $scope.pageSize);
                };

                $scope.nextPage = function() {
                    if ($scope.page >= $scope.pages - 1)
                        return;

                    ++$scope.page;

                    computePages($scope);

                    $scope.refresh($scope.page, $scope.pageSize);
                };

                $scope.gotoPage = function(pageIndex) {
                    $scope.page = pageIndex;

                    computePages($scope);

                    $scope.refresh($scope.page, $scope.pageSize);
                };
            }]
        };
    }]).directive('mtzDatePicker', ['$locale', function($locale) {
        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        return {
            restrict: 'A',
            scope: {
                date: "=datePickerDate",
                format: "@datePickerFormat",
                options: "=?datePickerOptions"
            },
            link: function(scope, element, attr) {
                scope.options = scope.options || {};

                var format = $locale.DATETIME_FORMATS[scope.format];

                for (var i = 0; i < format.length; i++)
                    format = format.replace('M', 'm');

                var susped = false;

                scope.options.format = format;
                scope.options.onSet = function(context) {
                    if (susped)
                        return;

                    if (!context.select)
                        return;

                    if (scope.date instanceof Date)
                        scope.date = new Date(context.select);
                    else
                        scope.date = context.select;
                };

                scope.options.monthsFull = [];
                for (i = 0; i < $locale.DATETIME_FORMATS.MONTH.length; i++)
                    scope.options.monthsFull[i] = capitalizeFirstLetter($locale.DATETIME_FORMATS.MONTH[i]);

                scope.options.monthsShort = [];
                for (i = 0; i < $locale.DATETIME_FORMATS.SHORTMONTH.length; i++)
                    scope.options.monthsShort[i] = capitalizeFirstLetter($locale.DATETIME_FORMATS.SHORTMONTH[i]);

                scope.options.weekdaysFull = [];
                for (i = 0; i < $locale.DATETIME_FORMATS.DAY.length; i++)
                    scope.options.weekdaysFull[i] = capitalizeFirstLetter($locale.DATETIME_FORMATS.DAY[i]);

                scope.options.weekdaysShort = [];
                for (i = 0; i < $locale.DATETIME_FORMATS.SHORTDAY.length; i++)
                    scope.options.weekdaysShort[i] = capitalizeFirstLetter($locale.DATETIME_FORMATS.SHORTDAY[i]);

                scope.options.onClose = function() {
                    $(document.activeElement).blur();
                };

                var picker = element.pickadate(scope.options).pickadate('picker');

                scope.$watch('date', function() {
                    susped = true;

                    picker.set('select', scope.date);

                    susped = false;
                });
            }
        };
    }]).directive('mtzToast', ['$interpolate', '$timeout', function($interpolate, $timeout) {
		return {
			restrict: 'A',
			scope: {
				duration: "@toastDuration",
				delay: "@toastDelay"
			},
			link: function(scope, element, attr) {
				scope.duration = scope.duration || 5000;
				scope.delay = scope.delay || 500;

				var template = element.html();
				element.html('');

				var rdy = true;
				var buffer = [];

				function showToast() {
					$timeout(function() {
						if (buffer.length === 0) {
							rdy = true;
							return;
						}

						var content = buffer.shift();

						var interpolated = $interpolate(template)(content);
						Materialize.toast(interpolated, scope.duration);

						showToast();
					}, scope.delay);
				}

				scope.$on(element[0].id + ':alert', function(event, content) {
					if (rdy) {
						rdy = false;
						buffer.push(content);
						showToast();
					}
					else {
						buffer.push(content);
					}
				});
			}
		};
	}]).directive('mtzLoader', ['$timeout', function($timeout) {
		return {
			restrict: 'A',
			scope: {
				inDelay: "@loaderInDelay",
				outDelay: "@loaderOutDelay",
			},
			template: '<div data-ng-if="count > 0" class="progress"><div class="indeterminate"></div></div>',
			link: function(scope, element, attr) {
				scope.inDelay = scope.inDelay === undefined ? 100 : scope.inDelay;
				scope.outDelay = scope.outDelay === undefined ? 1000 : scope.outDelay;

				scope.count = 0;
				var timeouts = { };
				var defaultTimeout;

				scope.$on(attr.id + ':show', function(event, id) {
					var timeout = {
						ringed: false
					};

					timeout.promise = $timeout(function() {
						timeout.ringed = true;
						scope.count++;
					}, scope.inDelay);

					if (id === undefined || id === null)
						defaultTimeout = timeout;
					else
						timeouts[id] = timeout;
				});

				scope.$on(attr.id + ':hide', function(event, id) {
					var timeout;
					if (id === undefined || id === null) {
						timeout = defaultTimeout;
					}
					else {
						timeout = timeouts[id];
						delete timeouts[id];
					}

					$timeout.cancel(timeout.promise);

					if (timeout.ringed) {
						$timeout(function () {
							scope.count--;
							if (scope.count < 0)
								scope.count = 0;
						}, scope.outDelay);
					}
				});

				scope.$on(attr.id + ':clear', function(event) {
					$timeout.cancel(defaultTimeout);
					for (var k in Object.keys(timeouts)) {
						$timeout.cancel(timeouts[k]);
						delete timeouts[k];
					}

					$timeout(function () {
						scope.count = 0;
					}, scope.outDelay);
				});
			}
		};
	}]).directive('mtzSideNav', [function() {
		return {
			restrict: 'A',
			scope: {
				closeOnClick: "@sideNavCloseOnClick",
			},
			link: function(scope, element, attr) {
				element.sideNav({
					closeOnClick: scope.closeOnClick !== undefined ? true : false
				});
			}
		};
	}]).directive('mtzDropdown', [function() {
		return {
			restrict: 'A',
			link: function(scope, element, attr) {
				element.dropdown();
			}
		};
	}]).directive('mtzCollapsible', [function() {
		return {
			restrict: 'A',
			link: function(scope, element, attr) {
				element.collapsible();
			}
		};
	}]).directive('mtzTabs', [function() {
		return {
			restrict: 'A',
			link: function(scope, element, attr) {
				element.tabs();
			}
		};
	}]).directive('mtzModal', [function() {
		return {
			restrict: 'A',
			link: function(scope, element, attr) {
				element.modal();
			}
		};
	}]).directive('mtzAutocomplete', ['$timeout', function($timeout) {
		return {
			restrict: 'A',
			scope: {
				autocompleteData: "=mtzAutocomplete",
			},
			require: '?ngModel',
			link: function(scope, element, attr, ngModelCtrl) {
				var data = { };

				if (ngModelCtrl) {
					element.on('keyup', function() {
						var ul = element.nextAll("ul.autocomplete-content");
						setTimeout(function() {
							var lis = ul.find("li");
							lis.on('click', function() {
								$timeout(function() {
									ngModelCtrl.$setViewValue(element.val(), "autocomplete");
								});
							});
						});
					});
				}

				scope.$watchCollection('autocompleteData', function(newVal) {
					var newData = { };

					if (newVal instanceof Array) {
						for (var j in newVal) {
							if (data[newVal[j]] !== undefined)
								continue;

							newData[newVal[j]] = null;
							data[newVal[j]] = null;
						}
					}
					else {
						for (var k in Object.keys(newVal)) {
							if (data[k] !== undefined)
								continue;

							newData[k] = newVal[k];
							data[k] = newVal[k];
						}
					}

					element.autocomplete({
						data: newData
					});
				});
			}
		};
	}]).directive('mtzInfiniteScroll', ['$timeout', '$window', function($timeout, $window) {
		return {
            scope: {
                handler: "&mtzInfiniteScroll",
                scrollThreshold: "@scrollThreshold",
                timeThreshold: "@timeThreshold",
            },
            link: function (scope, element, attr) {
                scope.scrollThreshold = parseInt(scope.scrollThreshold || 50);
                scope.timeThreshold = parseInt(scope.timeThreshold || 400);
                var windowScroll = attr.windowScroll !== undefined ? true : false;

                var promise = null;
                var lastRemaining = 9999;

                function onScroll(element) {
                    var remaining = element.scrollHeight - (element.clientHeight + element.scrollTop);

                    if (remaining < scope.scrollThreshold && (remaining - lastRemaining) < 0) {
                        if (promise !== null) {
                            $timeout.cancel(promise);
                        }

                        promise = $timeout(function () {
                            scope.handler();
                            promise = null;
                        }, scope.timeThreshold);
                    }

                    lastRemaining = remaining;
                }

                element.bind('scroll', function () {
                    onScroll(element[0]);
                });

                if (windowScroll) {
                    $window.addEventListener('scroll', function () {
                        onScroll(document.body);
                    });
                }
            }

        };
	}]).directive('mtzLoginForm', ['$timeout', function($timeout) {
		return {
			restrict: 'A',
			scope: {
				eventName: "@eventName",
				restoreDelay: "@restoreDelay"
			},
			link: function(scope, element, attr) {
				scope.restoreDelay = scope.restoreDelay || 100;

				scope.$on(scope.eventName, function(event) {
					element.hide();
					$timeout(function() {
						element.show();
					}, scope.restoreDelay);
				});
			}
		};
	}]).directive('mtzHourPicker', ['$timeout', function($timeout) {
        return {
            restrict: 'A',
            templateUrl: currentScriptPath + '/hourPicker.html',
            scope: {
                date: "=hourPickerDate",
                selectId: "@hourPickerId"
            },
            link: function (scope, element, attr) {
                $timeout(function () {
                    var select = $('#' + scope.selectId);
                    select.material_select();

                    scope.$watch('date', function() {
                        if (!scope.date)
                            return;

                        if (scope.date instanceof Date) {
                            select.val(scope.date.getHours());
                        }
                        else {
                            var d = new Date(scope.date);
                            select.val(d.getHours());
                        }

                        select.material_select();
                    });

                    select.change(function() {
                        if (scope.date instanceof Date) {
                            scope.date.setHours(select.val());
                        }
                        else {
                            var d = new Date(scope.date);
                            d.setHours(select.val());
                            scope.date = d.getTime();
                        }
                    });
                });
            }
        };
	}]).directive('mtzMinutePicker', ['$timeout', function($timeout) {
        function approximateMinutes(base, value) {
            return value - value % base;
        }

        return {
            restrict: 'A',
            templateUrl: currentScriptPath + 'minutePicker.html',
            scope: {
                date: "=minutePickerDate",
                selectId: "@minutePickerId",
                options: "=minutePickerOptions"
            },
            link: function (scope, element, attr) {
                scope.options = scope.options || {};

                scope.options.base = scope.options.base || 5;

                $timeout(function () {
                    var select = $('#' + scope.selectId);
                    select.material_select();

                    scope.$watch('date', function() {
                        if (!scope.date)
                            return;

                        if (scope.date instanceof Date) {
                            select.val(approximateMinutes(scope.options.base, scope.date.getMinutes()));
                        }
                        else {
                            var d = new Date(scope.date);
                            select.val(approximateMinutes(scope.options.base, d.getMinutes()));
                        }

                        select.material_select();
                    });

                    select.change(function() {
                        if (scope.date instanceof Date) {
                            scope.date.setMinutes(select.val());
                        }
                        else {
                            var d = new Date(scope.date);
                            d.setMinutes(select.val());
                            scope.date = d.getTime();
                        }
                    });
                });
            }
        };
    }]);
})();
