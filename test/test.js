var assert = require('assert'),
  conekta = require('../lib/conekta.js'),
  base64 = require('../lib/base64.js'),
  fs = require('fs');

const LOCALE = 'en',
  TEST_KEY = 'key_eYvWV7gSDkNYXsmr',
  API_VERSION = '2.0.0',
  PRODUCTION_KEY = '9YxqfRnx4sMQDnRsqdYn';

var createOrder = function(callback) {
  conekta.Order.create({
    currency: 'MXN',
    customer_info: {
      name: 'Jul Ceballos',
      phone: '+5215555555555',
      email: 'jul@conekta.io'
    },
    line_items: [{
      name: 'Box of Cohiba S1s',
      description: 'Imported From Mex.',
      unit_price: 35000,
      quantity: 1,
      tags: ['food', 'mexican food'],
    }]
  }, callback);
}

describe('Conekta wrapper', function() {

  describe('with api key empty', function() {
    it('should return error code api_key_required', function(done) {
      conekta.api_version = API_VERSION;
      createOrder(function(err, order) {
        assert(err.code == 'api_key_required', true);
        done();
      });


    });
  });

  describe('request with bad arguments', function() {
    it('should return error code with empty argument', function(done) {
      this.timeout(60000);
      conekta.api_key = TEST_KEY;
      conekta.locale = LOCALE;
      conekta.api_version = API_VERSION;
      conekta.Order.create({
        currency: 'MXN',
        line_items: [{
          name: 'Box of Cohiba S1s',
          description: 'Imported From Mex.',
          quantity: 1,
          tags: ['food', 'mexican food']
        }]
      }, function(err) {
        assert(err.type == 'parameter_validation_error', true);
        done();
      });
    });
  });

  describe('request with errors', function() {
    it('should return message_to_purchaser on error response', function(done) {
      this.timeout(60000);
      conekta.api_key = TEST_KEY;
      conekta.locale = LOCALE;
      conekta.api_version = API_VERSION;
      conekta.Order.create({
        currency: 'MXN',
        details: {
          name: 'Wolverine',
          email: 'mauricio@conekta.io',
          phone: '403-342-0642',
          line_items: [{
            name: 'Box of Cohiba S1s',
            description: 'Imported From Mex.',
            unit_price: 20000,
            quantity: 1,
          }]
        }
      }, function(err) {
        assert(err.details[0].hasOwnProperty('message'), true);
        done();
      });
    });
  });

  describe('request with not found object', function() {
    it('should return error with http_code 404', function(done) {
      this.timeout(60000);
      conekta.api_key = TEST_KEY;
      conekta.locale = LOCALE;
      conekta.api_version = API_VERSION;
      conekta.Order.find('123', function(err) {
        assert(err.http_code == 404, true);
        done();
      });
    });
  });

  describe('api version unsupported', function() {
    it('should return error ', function(done) {
      this.timeout(60000);
      conekta.api_key = TEST_KEY;
      conekta.api_version = '1.0.0';
      conekta.locale = LOCALE;
      conekta.Order.find('123', function(err) {
        assert(err.code == 'api_version_unsupported', true);
        done();
      });
    });
  });

});

describe('Order', function() {

  describe('next page', function() {

    it('should return something', function(done) {
      this.timeout(10000);

      var mFile = fs.readFileSync(__dirname + '/../lib/orders.json');

      var ord = conekta.Order;
      ord._json = JSON.parse(mFile);
      conekta.api_key = TEST_KEY;
      conekta.locale = LOCALE;
      conekta.api_version = API_VERSION;
      ord.nextPage(function(err, res) {
        assert(res.hasOwnProperty('next_page_url'), true)
        done();
      });

    });

  });


  describe('create', function() {
    it('should return instance object with id', function(done) {
      this.timeout(10000);
      conekta.api_key = TEST_KEY;
      conekta.locale = LOCALE;
      conekta.api_version = API_VERSION;
      createOrder(function(err, res) {
        assert((res.toObject().hasOwnProperty('id')), true);
        done();
      });
    });
  });

  describe('update', function() {
    it('should return instance object', function(done) {
      this.timeout(6000);
      conekta.api_key = TEST_KEY;
      conekta.api_version = API_VERSION;
      conekta.locale = LOCALE;
      createOrder(function(err, res) {
        var order = res.toObject().id;
        res.update({
          payment_status: "created",
          currency: 'USD'
        }, function(err, res) {
          assert(res.toObject().currency, 'USD')
          done();
        });
      });
    });
  });

  describe('capture order', function() {
    it('should return instance object', function(done) {
      this.timeout(10000);
      conekta.api_key = TEST_KEY;
      conekta.api_version = API_VERSION;
      conekta.locale = LOCALE;

      conekta.Order.create({
        customer_info: {
          name: 'Jul Ceballos',
          phone: '+5215555555555',
          email: 'jul@conekta.io'
        },
        line_items: [{
          name: 'Box of Cohiba S1s',
          description: 'Imported From Mex.',
          unit_price: 35000,
          quantity: 1,
          tags: ['food', 'mexican food']
        }],
        charges: [{
          payment_method: {
            type: 'card',
            token_id: 'tok_test_visa_4242'
          }
        }],
        pre_authorize: true,
        currency: 'MXN'
      }, function(err, order) {
        order.capture(function(err, res) {
          assert.equal(res.hasOwnProperty('id'), true);
          done();
        });
      });
    });
  });

  describe('shipping contact', function () {

    describe('create', function () {

      it('should return instance object', function(done) {
        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        createOrder(function (err, order) {
          order.createShippingContact({
            address: {
              street1: "250 Alexis St",
              city: "Red Deer",
              state: "Alberta",
              country: "CA",
              postal_code: "T4N 0B8"
            }
          }, function (err, shippingContact) {
            assert(shippingContact.object, 'shipping_contact');
            done();
          });
        });
      });

    });
  });

  describe('Line Items', function() {

    var createLineItem = function(callback) {
      createOrder(function(err, res) {
        res.createLineItem({
          name: 'Box of Cohiba S2s',
          description: 'Imported From Mex.',
          unit_price: 36000,
          quantity: 1,
          sku: 'cohb_s2',
          tags: ['food', 'mexican food'],
          brand: 'Nike',
          metadata: {
            random_key: 'random value'
          }
        }, callback);
      });
    }

    describe('next page', function () {
      it('should return instance object with id', function (done) {
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        this.timeout(6000);

        createLineItem(function (err, res) {
          conekta.Order.find(res.parent_id, function (err, order) {
            order.line_items.nextPage(function (err, res) {
              assert(err.details[0].param, 'next_page_url');
              done();
            });
          });
        });
      });
    });

    describe('create', function() {

      it('should return instance object with id', function(done) {
        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        createLineItem(function(err, lineItem) {
          assert(lineItem.hasOwnProperty('id'), true);
          done();
        });
      });

    });

    describe('update', function() {

      it('should return instance object with id', function(done) {
        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        createLineItem(function(err, res) {
          conekta.Order.find(res.parent_id, function(err, ord) {
            ord.line_items.get(1).update({
              name: 'Tie Fighter',
              description: "Imported From the Galactic Empire.",
              unit_price: 36000,
              tags: ['ship']
            }, function(err, res) {
              assert(res.name, 'Tie Fighter');
              done();
            });
          });
        });
      });
    });

    describe('delete', function () {

      it('should return instance object with id', function(done) {
        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        createLineItem(function(err, res) {
          conekta.Order.find(res.parent_id, function (err, order) {
            order.line_items.get(0).delete(function (err, lineItems) {
              assert(lineItems.deleted, true);
              done();
            });
          });
        });
      });

    });


  });

  describe('Tax Line', function() {

    var createTaxLine = function(callback) {
      createOrder(function(err, order) {
        order.createTaxLine({
          description: 'IVA',
          amount: 600,
          metadata: {
            random_key: 'random_value'
          }
        }, callback);
      });
    };

    describe('next page', function () {
      it('should return instance object with id', function (done) {
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        this.timeout(6000);

        createTaxLine(function (err, res) {
          conekta.Order.find(res.parent_id, function (err, order) {
            order.tax_lines.nextPage(function (err, res) {
              assert(err.details[0].param, 'next_page_url');
              done();
            });
          });
        });
      });
    });

    describe('create', function() {

      it('should return instance object with id', function(done) {

        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        createTaxLine(function(err, order) {
          assert(order.hasOwnProperty('id'), true);
          done();
        });

      });
    });

    describe('update', function() {

      it('should return instance object with id', function(done) {

        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        createTaxLine(function(err, order) {
          conekta.Order.find(order.parent_id, function(err, ord) {
            ord.tax_lines.get(0).update({
              amount: 1000
            }, function(err, res) {
              assert(res.amount, 1000);
              done();
            });
          });
        });

      });
    });

    describe('delete', function () {

      it('should return instance object with id', function(done) {
        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        createTaxLine(function(err, order) {
          conekta.Order.find(order.parent_id, function(err, ord) {
            ord.tax_lines.get(0).delete(function (err, taxLine) {
              assert(taxLine.deleted, true);
              done();
            });
          });
        });
      });

    });

  });

  describe('Shipping Line', function() {

    var createShippingLine = function(callback) {
      createOrder(function(err, order) {
        order.createShippingLine({
          amount: 0,
          tracking_number: 'TRACK123',
          carrier: 'USPS',
          method: 'Train',
          metadata: {
            random_key: 'random_value'
          }
        }, callback);
      });
    }

    describe('next page', function () {
      it('should return instance object with id', function (done) {
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        this.timeout(6000);

        createShippingLine(function (err, res) {
          conekta.Order.find(res.parent_id, function (err, order) {
            order.shipping_lines.nextPage(function (err, res) {
              assert(err.details[0].param, 'next_page_url');
              done();
            });
          });
        });
      });
    });

    describe('create', function() {

      it('should return instance object with id', function(done) {

        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        createShippingLine(function(err, order) {
          assert(order.hasOwnProperty('id'), true);
          done();
        });

      });

    });

    describe('update', function() {

      it('should return instance object with id', function(done) {

        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        createShippingLine(function(err, order) {
          conekta.Order.find(order.parent_id, function(err, ord) {
            ord.shipping_lines.get(0).update({
              tracking_number: 'TRACK456',
              carrier: 'Mandalorian Express'
            }, function(err, res) {
              assert(res.tracking_number, 'TRACK456');
              done();
            });
          });
        });

      });
    });

    describe('delete', function () {

      it('should return instance object with id', function(done) {

        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        createShippingLine(function(err, order) {
          conekta.Order.find(order.parent_id, function (err, ord) {
            ord.shipping_lines.get(0).delete(function (err, res) {
              assert.equal(res.deleted, true);
              done();
            });
          });
        });

      });

    });

  });

  describe('Discount Line', function() {

    var createDiscountLine = function(callback) {
      createOrder(function(err, order) {
        order.createDiscountLine({
          code: 'Cupón de descuento',
          type: 'loyalty',
          amount: 600
        }, callback);
      });
    }

    describe('next page', function () {
      it('should return instance object with id', function (done) {
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        this.timeout(6000);

        createDiscountLine(function (err, res) {
          conekta.Order.find(res.parent_id, function (err, order) {
            order.discount_lines.nextPage(function (err, res) {
              assert(err.details[0].param, 'next_page_url');
              done();
            });
          });
        });
      });
    });

    describe('create', function() {

      it('should return instance object with id', function(done) {

        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.local = LOCALE;
        conekta.api_version = API_VERSION;
        createDiscountLine(function(err, order) {
          assert(order.hasOwnProperty('id'), true);
          done();
        });

      });

    });

    describe('update', function() {

      it('should return instance object with id', function(done) {

        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        createDiscountLine(function(err, order) {
          conekta.Order.find(order.parent_id, function(err, ord) {
            ord.discount_lines.get(0).update({
              amount: 700
            }, function(err, res) {
              assert(res.amount, 700);
              done();
            });
          });
        });

      });
    });

    describe('delete', function () {
      it('should return instance object with id', function(done) {
        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        createDiscountLine(function(err, order) {
          conekta.Order.find(order.parent_id, function(err, ord) {
            ord.discount_lines.get(0).delete(function(err, res) {
              assert(res.deleted, true);
              done();
            });
          });
        });
      });
    });

  });

  describe('Charges', function() {

    var createCharge = function(callback) {
      createOrder(function(err, order) {
        order.createCharge({
          payment_method: {
            type: 'oxxo_cash',
            expires_at: 1513036800
          },
          amount: 35000
        }, callback);
      });
    }

    describe('create', function() {

      it('should return instance object with id', function(done) {

        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        createCharge(function(err, order) {
          assert(order.hasOwnProperty('id'), true);
          done();
        });

      });

    });

    describe('next page', function () {
      it('should return instance object with id', function (done) {
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        this.timeout(6000);

        createCharge(function (err, res) {
          conekta.Order.find(res.order_id, function (err, order) {
            order.charges.nextPage(function (err, res) {
              assert(err.details[0].param, 'next_page_url');
              done();
            });
          });
        });
      });
    });

  });

  describe('Refunds', function() {

    var createRefund = function(callback) {
      conekta.Order.create({
        currency: 'MXN',
        customer_info: {
          name: 'Jul Ceballos',
          phone: '+5215555555555',
          email: 'jul@conekta.io'
        },
        line_items: [{
          name: 'Box of Cohiba S1s',
          description: 'Imported From Mex.',
          unit_price: 35000,
          quantity: 1,
          tags: ['food', 'mexican food'],
          type: 'physical'
        }],
        charges: [{
          payment_method: {
            type: 'card',
            token_id: 'tok_test_visa_4242'
          }
        }]
      }, function(err, order) {
        order.createRefund({
          amount: 35000
        }, callback);
      });

    };


    describe('create', function() {

      it('should return instance object with id', function(done) {

        this.timeout(15000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        createRefund(function(err, order) {
          assert(order.hasOwnProperty('id'), true);
          done();
        });

      });

    });

  });

});


describe('Event', function() {
  describe('where', function() {
    it('should return array', function(done) {
      this.timeout(60000);
      conekta.api_key = TEST_KEY;
      conekta.api_version = API_VERSION;
      conekta.locale = LOCALE;
      conekta.Event.where({}, function(err, res) {
        assert(res.toArray() instanceof Array, true);
        done();
      });
    });
  });
});

describe('Customer', function() {

  var customer = '';

  describe('create without plan', function() {
    it('should return an object instance with id', function(done) {
      this.timeout(60000);
      conekta.api_key = TEST_KEY;
      conekta.api_version = API_VERSION;
      conekta.locale = LOCALE;
      conekta.Customer.create({
        name: 'James Howlett',
        email: 'james.howlett@forces.gov'
      }, function(err, res) {
        res = res.toObject();
        customer = res.id;
        assert(res.hasOwnProperty('id'), true);
        done();
      });
    });
  });

  describe('create with plan', function() {
    it('should return an object instance with id', function(done) {
      this.timeout(60000);
      conekta.api_key = TEST_KEY;
      conekta.api_version = API_VERSION;
      conekta.locale = LOCALE;
      conekta.Customer.create({
        name: 'James Howlett',
        email: 'james.howlett@forces.gov',
        plan_id: 'gold-plan',
        corporate: true,
        payment_sources: [{
          token_id: 'tok_test_visa_4242',
          type: 'card'
        }]
      }, function(err, customer) {
        res = customer.toObject();
        assert(res.hasOwnProperty('id'), true);
        done();
      });
    });
  });

  describe('update', function() {
    it('should return an object instance with id', function(done) {
      this.timeout(60000);
      conekta.api_key = TEST_KEY;
      conekta.api_version = API_VERSION;
      conekta.locale = LOCALE;
      conekta.Customer.find(customer, function(err, res) {
        res.update({
          name: 'Thane Kyrell',
          email: 'thane@jelucan.org'
        }, function(err, res) {
          assert(res.toObject().hasOwnProperty('id'), true);
          done();
        });
      });
    });
  });

  describe('where', function() {
    it('should return an array', function(done) {
      this.timeout(60000);
      conekta.api_key = TEST_KEY;
      conekta.api_version = API_VERSION;
      conekta.locale = LOCALE;
      conekta.Customer.where({}, function(err, res) {
        assert(res.toArray() instanceof Array, true);
        done();
      });
    });

    it('should return an array (just callback)', function(done) {
      this.timeout(60000);
      conekta.api_key = TEST_KEY;
      conekta.api_version = API_VERSION;
      conekta.locale = LOCALE;
      conekta.Customer.where(function(err, res) {
        assert(res.toArray() instanceof Array, true);
        done();
      });
    });
  });

  describe('find', function() {
    it('should return an object instance with id attribute', function(done) {
      this.timeout(60000);
      conekta.api_key = TEST_KEY;
      conekta.api_version = API_VERSION;
      conekta.locale = LOCALE;
      conekta.Customer.find(customer, function(err, res) {
        assert(res.toObject().hasOwnProperty('id'), true);
        done();
      });
    });
  });

  describe('createcard', function() {
    it('should return an object instance with id attribute', function(done) {
      this.timeout(60000);
      conekta.api_key = TEST_KEY;
      conekta.api_version = API_VERSION;
      conekta.locale = LOCALE;
      conekta.Customer.find(customer, function(err, res) {
        res.createCard({
          token_id: 'tok_test_visa_4242',
          type: 'card'
        }, function(err, res) {
          assert(res.hasOwnProperty('id'), true);
          done();
        });
      });
    });
  });

  describe('createsubscription', function() {
    it('should return an object instance with id attribute', function(done) {
      this.timeout(60000);
      conekta.api_key = TEST_KEY;
      conekta.api_version = API_VERSION;
      conekta.locale = LOCALE;
      conekta.Customer.find(customer, function(err, res) {
        res.createSubscription({
          plan: 'gold-plan'
        }, function(err, res) {
          assert(res.hasOwnProperty('id'), true);
          done();
        });
      });
    });
  });

  describe('createPaymentSources', function () {
    it('should return an object instance with id attribute', function(done) {
      this.timeout(60000);
      conekta.api_key = TEST_KEY;
      conekta.api_version = API_VERSION;
      conekta.locale = LOCALE;
      conekta.Customer.find(customer, function(err, res) {
        res.createPaymentSource({
          type: "card",
          token_id: "tok_test_visa_4242"
        }, function(err, res) {
          assert(res.hasOwnProperty('id'), true);
          done();
        });
      });
    });
  });

  describe('delete', function() {
    it('should return an object instance with id attribute', function(done) {
      this.timeout(60000);
      conekta.api_key = TEST_KEY;
      conekta.api_version = API_VERSION;
      conekta.locale = LOCALE;
      conekta.Customer.find(customer, function(err, res) {
        res.delete(function(err, res) {
          assert(res.toObject().hasOwnProperty('id'), true);
          done();
        });
      });
    });
  });

  describe('Shipping Contact', function() {

    var shippingContact = '';

    describe('create', function() {

      it('should return instance object with id', function(done) {

        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        conekta.Customer.create({
          name: 'James Howlett',
          email: 'james.howlett@forces.gov',
          plan_id: 'gold-plan',
          corporate: true,
          payment_sources: [{
            token_id: 'tok_test_visa_4242',
            type: 'card'
          }]
        }, function(err, customer) {
          customer.createShippingContact({
            phone: '+5215555555555',
            receiver: 'Marvin Fuller',
            between_streets: 'Ackerman Crescent',
            address: {
              street1: '250 Alexis St',
              street2: '',
              city: 'Red Deer',
              state: 'Alberta',
              country: 'CA',
              postal_code: 'T4N 0B8',
              residential: true
            }
          }, function(err, shipping) {
            shippingContact = shipping;
            assert(shipping.hasOwnProperty('id'), true);
            done();
          });

        });
      });

    });

    describe('update', function() {

      it('should return instance object with id', function(done) {

        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;

        conekta.Customer.find(shippingContact.parent_id, function(err, cust) {
          cust.shipping_contacts.get(0).update({
            phone: '+5215555555999',
            receiver: 'Marvin Fuller',
            between_streets: 'Ackerman Null',
            address: {
              street1: '250 Alexis St',
              street2: '',
              city: 'Red Deer',
              state: 'Alberta',
              country: 'CA',
              postal_code: 'T4N 0B8',
              residential: true
            }
          }, function(err, ship) {
            assert(ship.hasOwnProperty('id'), true);
            done();
          });

        });

      });
    });

    describe('delete', function() {

      it('should return instance object with id', function(done) {

        this.timeout(6000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.local = LOCALE;
        conekta.Customer.find(shippingContact.parent_id, function(err, cust) {
          cust.shipping_contacts.get(0).delete(function(err, res) {
            assert(res.hasOwnProperty('id'), true);
            done();
          });
        });

      });

    });

  });


  describe('Card', function() {

    describe('update', function() {
      it('should return an object instance with id attribute', function(done) {
        this.timeout(60000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.locale = LOCALE;
        conekta.Customer.create({
          name: 'James Howlett',
          email: 'james.howlett@forces.gov',
          plan_id: 'gold-plan',
          corporate: true,
          payment_sources: [{
            token_id: 'tok_test_visa_4242',
            type: 'card'
          }]
        }, function(err, customer) {
          customer.find(customer._id, function(err, customerObj) {
            customerObj.payment_sources.get(0).update({
              name: 'Emiliano Cabrera',
              exp_month: '12',
              exp_year: '20',
              address: {
                street1: 'Tamesis',
                street2: '114',
                city: 'Monterrey',
                state: 'Nuevo Leon',
                country: 'MX',
                postal_code: '64700'
              }
            }, function(err, res) {
              assert(res.hasOwnProperty('id'), true);
              done();
            });
          });
        });
      });
    });

    describe('delete', function() {
      it('should return an object instance with id attribute', function(done) {
        this.timeout(60000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.locale = LOCALE;
        conekta.Customer.create({
          name: 'James Howlett',
          email: 'james.howlett@forces.gov',
          plan_id: 'gold-plan',
          corporate: true,
          payment_sources: [{
            token_id: 'tok_test_visa_4242',
            type: 'card'
          }]
        }, function(err, customer) {
          customer.payment_sources.get(0).delete(function(err, res) {
            assert(res.hasOwnProperty('id'), true);
            done();

          });

        });
      });
    });

  });

  describe('Customer Subscription', function() {

    var customerSubscribed = '';

    describe('update subscription plan', function() {
      it('should return an object instance with id attribute', function(done) {
        this.timeout(60000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.locale = LOCALE;
        conekta.Customer.create({
          name: 'James Howlett',
          phone: "+5215544443333",
          email: 'james.howlett@forces.gov',
          corporate: true,
          plan_id: 'gold-plan',
          payment_sources: [{
            token_id: 'tok_test_visa_4242',
            type: 'card'
          }]
        }, function(err, customer) {
          customerSubscribed = customer;
          customerSubscribed.subscription.update({
            plan: 'opal-plan'
          }, function(err, res) {
            assert(res.hasOwnProperty('id'), true);
            done();
          });
        });
      });
    });

    describe('pause', function() {
      it('should return and object instance with id attribute', function(done) {
        this.timeout(60000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.locale = LOCALE;
        conekta.Customer.find(customerSubscribed._id, function (err, customer) {
          customer.subscription.pause(function(err, res) {
            assert((res.status == 'paused' || res.status == 'in_trial'), true);
            done();
          });
        });
      });
    });

    describe('resume', function() {
      it('should return and object instance with id attribute', function(done) {
        this.timeout(60000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.locale = LOCALE;
        conekta.Customer.find(customerSubscribed._id, function(err, customer) {
          customerSubscribed.subscription.update({
            plan_id: 'gold-plan'
          }, function(err, res) {
            customer.subscription.resume(function(err, res) {
              assert((res.status == 'active' || res.status == 'in_trial'), true);
              done();
            });
          });
        });
      });
    });

    describe('cancel', function() {
      it('should return and object instance with id attribute', function(done) {
        this.timeout(60000);
        conekta.api_key = TEST_KEY;
        conekta.api_version = API_VERSION;
        conekta.locale = LOCALE;
        customerSubscribed.subscription.cancel(function(err, res) {
          assert(res.status == 'canceled', true);
          done();
        });
      });
    });

  });
});