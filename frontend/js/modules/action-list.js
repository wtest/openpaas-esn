'use strict';

angular.module('esn.actionList', [])

  .directive('actionList', function($modal, $popover, screenSize) {
    var dialogOpened;

    return {
      restrict: 'A',
      controller: function($scope, $element, $attrs) {
        var self = this;
        var boundOpenFn, dialogLock;

        function isDialogOfThisScope() {
          return dialogOpened && dialogOpened.scope === $scope;
        }

        function isDialogOpened() {
          return isDialogOfThisScope() && dialogOpened.$isShown;
        }

        function handleWindowResizement() {
          if (isDialogOpened()) {
            boundOpenFn();
          }
        }

        function openForMobile() {
          self.hide();
          dialogOpened = $modal({
            scope: $scope,
            template: '<div class="action-list-container modal"><div class="modal-dialog modal-content" ng-include="\'' + $attrs.actionList + '\'"></div></div>',
            placement: 'center',
            prefixEvent: 'action-list'
          });

          dialogOpened.scope = $scope;
        }

        function openForDesktop() {
          self.hide();
          dialogOpened = $popover($element, {
            scope: $scope,
            trigger: 'manual',
            show: true,
            prefixEvent: 'action-list',
            autoClose: true,
            template: '<div class="action-list-container popover"><div class="popover-content" ng-include="\'' + $attrs.actionList + '\'"></div></div>',
            html: false,
            placement: 'bottom-right',
            animation: 'am-fade',
            container: $element
          });

          dialogOpened.scope = $scope;
        }

        self.open = function() {
          boundOpenFn = screenSize.is('xs, sm') ? openForMobile : openForDesktop;

          if (isDialogOpened()) {
            dialogOpened.hide();
          } else {
            boundOpenFn();
          }

          dialogLock = dialogOpened;

          screenSize.onChange(dialogLock.$scope, 'xs, sm', function(match) {
            if (match) {
              boundOpenFn = openForMobile;
              handleWindowResizement();
            } else {
              boundOpenFn = openForDesktop;
              handleWindowResizement();
            }
          });
        };

        self.hide = function() {
          dialogOpened && dialogOpened.hide();
        };

        self.destroy = function() {
          if (isDialogOfThisScope() && !dialogOpened.$isShown) {
            dialogOpened.destroy();
            dialogLock && dialogLock.destroy();
          }
        };
      },
      link: function(scope, element, attrs, controller) {
        if (!attrs.hasOwnProperty('actionListNoClick')) {
          element.click(function(event) {
            event.stopImmediatePropagation();
            event.preventDefault();

            controller.open();
          });
        }

        scope.$on('action-list.hide', controller.destroy);
        scope.$on('$destroy', controller.hide);
      }
    };
  });
