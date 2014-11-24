'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The notification pubsub module', function() {

  beforeEach(function() {
    var mongoose = {
      model: function() {
      }
    };
    mockery.registerMock('mongoose', mongoose);
  });

  it('should subscribe to community:join', function() {
    var localstub = {};
    this.helpers.mock.pubsub('../pubsub', localstub, {});
    mockery.registerMock('./usernotification', {});

    var module = require(this.testEnv.basePath + '/backend/core/notification/pubsub');
    module.init();
    expect(localstub.topics['community:join'].handler).to.be.a.function;
  });

  describe('communityJoinHandler method', function() {

    it('should save a augmented usernotification then forward it into global usernotification:created', function(done) {
      var globalstub = {};
      var datastub = {};
      var data = {
        author: '123',
        target: '456',
        community: '789',
        actor: 'manager'
      };
      var usernotificationMocked = {
        create: function(data, callback) {
          datastub = data;
          callback(null, 'saved');
        }
      };

      this.helpers.mock.pubsub('../pubsub', {}, globalstub);
      mockery.registerMock('./usernotification', usernotificationMocked);

      var module = require(this.testEnv.basePath + '/backend/core/notification/pubsub');
      module.communityJoinHandler(data, function(err) {
        if (err) {
          return done(err);
        }
        expect(datastub).to.deep.equal({
          subject: {objectType: 'user', id: '123'},
          verb: {label: 'ESN_MEMBERSHIP_ACCEPTED', text: 'accepted your request to join'},
          complement: {objectType: 'community', id: '789'},
          context: null,
          description: null,
          icon: {objectType: 'icon', id: 'fa-users'},
          category: 'community:membership:accepted',
          read: false,
          interactive: false,
          target: data.target
        });
        expect(globalstub.topics['usernotification:created'].data[0]).to.equal('saved');
        done();
      });
    });

  });

  describe('membershipInviteHandler method', function() {

    it('should save a augmented usernotification then forward it into global usernotification:created', function(done) {
      var globalstub = {};
      var datastub = {};
      var data = {
        author: '123',
        target: '456',
        community: '789'
      };
      var usernotificationMocked = {
        create: function(data, callback) {
          datastub = data;
          callback(null, 'saved');
        }
      };

      this.helpers.mock.pubsub('../pubsub', {}, globalstub);
      mockery.registerMock('./usernotification', usernotificationMocked);

      var module = require(this.testEnv.basePath + '/backend/core/notification/pubsub');
      module.membershipInviteHandler(data, function(err) {
        if (err) {
          return done(err);
        }
        expect(datastub).to.deep.equal({
          subject: {objectType: 'user', id: '123'},
          verb: {label: 'ESN_MEMBERSHIP_INVITE', text: 'has invited you in'},
          complement: {objectType: 'community', id: '789'},
          context: null,
          description: null,
          icon: {objectType: 'icon', id: 'fa-users'},
          category: 'community:membership:invite',
          interactive: true,
          target: data.target
        });
        expect(globalstub.topics['usernotification:created'].data[0]).to.equal('saved');
        done();
      });
    });

  });

  describe('membershipRequestHandler method', function() {

    it('should save an augmented usernotification then forward it into global usernotification:created', function(done) {
      var globalstub = {};
      var datastub = {};
      var data = {
        author: '123',
        target: '456',
        community: {_id: '789'}
      };
      var usernotificationMocked = {
        create: function(data, callback) {
          datastub = data;
          callback(null, 'saved');
        }
      };
      mockery.registerMock('./usernotification', usernotificationMocked);

      this.helpers.mock.pubsub('../pubsub', {}, globalstub);

      var managerId = 'managerId';
      var communityModuleMock = {
        getManagers: function(community, opts, callback) {
          expect(community).to.deep.equal(data.community);
          callback(null, [{_id: managerId}]);
        }
      };
      mockery.registerMock('../community', communityModuleMock);

      var module = require(this.testEnv.basePath + '/backend/core/notification/pubsub');
      module.membershipRequestHandler(data, function(err) {
        if (err) {
          return done(err);
        }
        expect(datastub).to.deep.equal({
          subject: {objectType: 'user', id: '123'},
          verb: {label: 'ESN_MEMBERSHIP_REQUEST', text: 'requested membership on'},
          complement: {objectType: 'community', id: '789'},
          context: null,
          description: null,
          icon: {objectType: 'icon', id: 'fa-users'},
          category: 'community:membership:request',
          interactive: true,
          target: managerId
        });
        expect(globalstub.topics['usernotification:created'].data[0]).to.equal('saved');
        done();
      });
    });

  });
});