'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Scroll Angular module', function() {

  var subHeaderHasInjections, SUB_HEADER_HEIGHT_IN_PX = 47;

  beforeEach(angular.mock.module('esn.scroll', function($provide) {
    subHeaderHasInjections = false;

    $provide.decorator('$window', function($delegate) {
      $delegate.scrollTo = sinon.spy();

      return $delegate;
    });

    $provide.value('subHeaderService', {
      isVisible: function() {
        return subHeaderHasInjections;
      }
    });
    $provide.value('SUB_HEADER_HEIGHT_IN_PX', SUB_HEADER_HEIGHT_IN_PX);
  }));

  describe('The scrollListener directive', function() {

    var $scope, element;

    beforeEach(function() {
      module('esn.scroll');
    });

    beforeEach(inject(function($compile, $rootScope) {
      $scope = $rootScope.$new();
      $scope.setToDOM = true;

      element = $compile('<div scroll-listener ng-if="setToDOM" on-destroy="destroyed" on-scroll-top="onTop"></div>')($scope);
      $scope.$digest();
    }));

    it('should call on-destroy when the directive is removed from the DOM', function() {
      $scope.destroyed = sinon.spy();

      $scope.setToDOM = false;
      $scope.$digest();

      expect($scope.destroyed).to.have.been.calledOnce;
    });

  });

  describe('The keepScrollPosition directive', function() {
    var $location;
    var $timeout;
    var $scope;

    function doInject() {
      inject(function(_$location_, _$timeout_, $compile, $rootScope) {
        $location = _$location_;
        $timeout = _$timeout_;
        $scope = $rootScope.$new();
        $compile('<div keep-scroll-position></div>')($scope);
      });
    }

    it('should save scroll position on $locationChangeStart event', function(done) {
      var path = '/a/path/here';
      var position = 100;

      module('esn.scroll', function($provide) {
        $provide.decorator('$location', function($delegate) {
          $delegate.path = function() {
            return path;
          };
          return $delegate;
        });

        $provide.decorator('$document', function($delegate) {
          $delegate.scrollTop = function() {
            return position;
          };
          return $delegate;
        });

        $provide.decorator('$cacheFactory', function($delegate) {
          $delegate.get = function() {
            return {
              put: function(key, value) {
                expect(key).to.equal(path, position);
                done();
              }
            };
          };
          return $delegate;
        });
      });

      doInject();
      $scope.$digest();
      $scope.$emit('$locationChangeStart');
    });

    it('should scroll to saved position on viewRenderFinished event', function(done) {
      var path = '/a/path/here';
      var position = 100;

      module('esn.scroll', function($provide) {
        $provide.decorator('$location', function($delegate) {
          $delegate.path = function() {
            return path;
          };
          return $delegate;
        });

        $provide.decorator('$document', function($delegate) {
          $delegate.scrollTop = function(top) {
            expect(top).to.equal(position);
            done();
          };
          return $delegate;
        });

        $provide.decorator('$cacheFactory', function($delegate) {
          $delegate.get = function() {
            return {
              get: function(key) {
                expect(key).to.equal(path);
                return position;
              }
            };
          };
          return $delegate;
        });
      });

      doInject();
      $scope.$digest();
      $scope.$emit('viewRenderFinished');
      $timeout.flush();
    });

  });

  describe('The elementScrollService factory', function() {

    var $timeout, elementScrollService;

    beforeEach(inject(function(_$timeout_, _elementScrollService_) {
      $timeout = _$timeout_;
      elementScrollService = _elementScrollService_;
    }));

    describe('the autoScrollDown method with an element that has a scrollHeight attribute', function() {
      var element, scrollHeight, scrollTopSpy;
      beforeEach(function() {
        scrollTopSpy = sinon.spy();
        element = [{scrollHeight: scrollHeight}];
        element.scrollTop = scrollTopSpy;
      });

      it('should call the autoScrollDown method of the element passed as an argument', function() {
        elementScrollService.autoScrollDown(element);
        $timeout.flush(1);
        expect(scrollTopSpy).to.be.called;
      });

      it('should not call the autoScrollDown method when no element is passed as an argument', function() {
        elementScrollService.autoScrollDown();
        $timeout.flush(1);
        expect(scrollTopSpy).to.not.be.called;
      });
    });

    describe('the autoScrollDown method with an element that does not have a scrollHeight attribute', function() {
      var element, scrollTopSpy;
      beforeEach(function() {
        scrollTopSpy = sinon.spy();
        element = {
          scrollTop: scrollTopSpy
        };
      });

      it('should not call the autoScrollDown method', function() {
        elementScrollService.autoScrollDown(element);
        $timeout.flush(1);
        expect(scrollTopSpy).to.not.be.called;
      });
    });

    describe('The scrollDownToElement function', function() {

      var $window, elementScrollService;

      function elementWithOffset(offset) {
        return {
          offset: function() {
            return {
              top: offset
            };
          }
        };
      }

      beforeEach(inject(function(_$window_, _elementScrollService_) {
        $window = _$window_;
        elementScrollService = _elementScrollService_;
      }));

      it('should scroll to top, then down to the element offsetTop', function() {
        elementScrollService.scrollDownToElement(elementWithOffset(100));

        expect($window.scrollTo).to.have.been.calledWith(0, 0);
        expect($window.scrollTo).to.have.been.calledWith(0, 100);
      });

      it('should consider the subHeader, if injections are active', function() {
        subHeaderHasInjections = true;

        elementScrollService.scrollDownToElement(elementWithOffset(100));

        expect($window.scrollTo).to.have.been.calledWith(0, 0);
        expect($window.scrollTo).to.have.been.calledWith(0, 100 - SUB_HEADER_HEIGHT_IN_PX);
      });

    });

    describe('The scrollToTop function', function() {

      var $window, deviceDetector;

      beforeEach(inject(function(_$window_, _deviceDetector_) {
        $window = _$window_;
        deviceDetector = _deviceDetector_;
      }));

      it('should scroll to top with the "scrollTo" fn on mobile"', function() {
        deviceDetector.isMobile = sinon.stub().returns(true);
        $window.scrollTo = sinon.spy();

        elementScrollService.scrollToTop();

        expect(deviceDetector.isMobile).to.have.been.called;
        expect($window.scrollTo).to.have.been.calledWith(0, 0);
      });

      it('should scroll to top with a jquery animation on desktop"', function() {
        deviceDetector.isMobile = sinon.stub().returns(false);
        $window.scrollTo = sinon.spy();

        elementScrollService.scrollToTop();

        expect(deviceDetector.isMobile).to.have.been.called;
        expect($window.scrollTo).to.not.have.been.called;
      });
    });

  });

});
