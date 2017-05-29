var Nightmare = require('nightmare');
var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient,
  assert = require('assert');
var url = 'http://127.0.0.1:9000/#/pages/signup';
var nightmare = Nightmare({ show: true }).goto(url); // open browser
// mongo Connection URL  (confirm that the date is being saved)
var mongoUrl = "mongodb://mongo.internal:5000/sageaxcessdb";

// Use connect method to connect to the Server
describe("SingUp e2e tests", function () {
  this.timeout(120000); // Set timeout to 15 seconds, instead of the original 2 seconds

  // start at root before every test is run
  beforeEach(function (done) {
    nightmare.refresh().wait(500).then(function () {
      // clean database
      MongoClient.connect(mongoUrl, function (err, db) {
        if (err) {
          done(err)
          return
        }
        // drop db
        db.dropDatabase(function (err) {
          err && console.error(err);
          db.close();
          done();
        });
      });
    })
  });

  it("should show the sign-up path", function (done) {
    nightmare.evaluate(function () {
      return document.URL;
    }).then(function (result) {
      expect(result).to.equal(url);
      done();
    }).catch(function (error) {
      done(error);
    })
  });

  it('should show error when there is a bad  email', function (done) {
    nightmare.type('[ng-model="signUpCtrl.email"]', 'bad formated email')
      .type('[ng-model="signUpCtrl.OrganizationName"]', 'TestOrganization')
      .click('div.submit-button-wrapper.mb-lg button.btn.btn-primary')
      .evaluate(function () {
        return document.querySelector('[ng-model="signUpCtrl.email"]').className;
      }).then(function (result) {
        expect(result).to.contain("ng-invalid");
        done();
      }).catch(function (error) {
        done(error);
      })
  });

  it('Should save the user', function (done) {
    email = 'test@sageaxcess.com';
    nightmare.type('[ng-model="signUpCtrl.email"]', email)
      .type('[ng-model="signUpCtrl.OrganizationName"]', 'AegisTester')
      .click('div.submit-button-wrapper.mb-lg button.btn.btn-primary')
      .wait(function () {
        return document.querySelector('[ng-show="signUpCtrl.confirmation"]').className.indexOf('ng-hide') < 0;
      }).then(function (result) {
        // check if the user was created in the database
        MongoClient.connect(mongoUrl, function (err, db) {
          if (err) {
            done(err)
            return
          }
          // find new user
          db.collection('user').findOne({ Email: email }, function (err, result) {
            err && done(err);
            db.close();
            expect(result).to.not.be.null;
            done();
          });
        });
      }).catch(function (error) {
        done(error);
      })
  });

  it('should show error if the organization/email is already registered', function (done) {
    email = 'test@sageaxcess.com';
    nightmare.type('[ng-model="signUpCtrl.email"]', email)
      .type('[ng-model="signUpCtrl.OrganizationName"]', 'AegisTester')
      .click('div.submit-button-wrapper.mb-lg button.btn.btn-primary')
      .wait(function () {
        return document.querySelector('[ng-show="signUpCtrl.confirmation"]').className.indexOf('ng-hide') < 0;
      }).then(function () {
        return nightmare.refresh().wait(500)
      }).then(function () {
        return nightmare.type('[ng-model="signUpCtrl.email"]', email)
          .type('[ng-model="signUpCtrl.OrganizationName"]', 'AegisTester')
          .click('div.submit-button-wrapper.mb-lg button.btn.btn-primary').wait(500)
          .wait(function () {
            q = document.querySelector('div.alert-danger');
            return q && q.innerText.indexOf("Email already in use.") >= 0;
          })
      }).then(function (result) {
        done()
      })
      .catch(function (err) {
        done(err)
      })

  })

});
