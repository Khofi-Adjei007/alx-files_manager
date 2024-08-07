/* eslint-disable import/no-named-as-default */
import dbClient from '../../utils/db';

describe('AuthController Tests', () => {
  const mockUser = {
    email: 'kaido@beast.com',
    password: 'hyakuju_no_kaido_wano',
  };
  let token = '';

  before(function (done) {
    this.timeout(10000);

    dbClient.usersCollection()
      .then((usersCollection) => {
        // Clean up any existing user with the mock email
        usersCollection.deleteMany({ email: mockUser.email })
          .then(() => {
            // Create a new user
            request.post('/users')
              .send({
                email: mockUser.email,
                password: mockUser.password,
              })
              .expect(201)
              .end((err, res) => {
                if (err) return done(err);
                expect(res.body.email).to.eql(mockUser.email);
                expect(res.body.id.length).to.be.greaterThan(0);
                done();
              });
          })
          .catch(done);
      })
      .catch(done);
  });

  describe('GET /connect', () => {
    it('should fail with no "Authorization" header', function (done) {
      this.timeout(5000);

      request.get('/connect')
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('should fail for a non-existent user', function (done) {
      this.timeout(5000);

      request.get('/connect')
        .auth('foo@bar.com', 'raboof', { type: 'basic' })
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('should fail with a valid email and wrong password', function (done) {
      this.timeout(5000);

      request.get('/connect')
        .auth(mockUser.email, 'raboof', { type: 'basic' })
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('should fail with an invalid email and valid password', function (done) {
      this.timeout(5000);

      request.get('/connect')
        .auth('zoro@strawhat.com', mockUser.password, { type: 'basic' })
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('should succeed for an existing user', function (done) {
      this.timeout(5000);

      request.get('/connect')
        .auth(mockUser.email, mockUser.password, { type: 'basic' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.token).to.exist;
          expect(res.body.token.length).to.be.greaterThan(0);
          token = res.body.token;
          done();
        });
    });
  });

  describe('GET /disconnect', () => {
    it('should fail with no "X-Token" header', function (done) {
      this.timeout(5000);

      request.get('/disconnect')
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('should fail for a non-existent user', function (done) {
      this.timeout(5000);

      request.get('/disconnect')
        .set('X-Token', 'raboof')
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('should succeed with a valid "X-Token" field', function (done) {
      request.get('/disconnect')
        .set('X-Token', token)
        .expect(204)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.deep.eql({});
          expect(res.text).to.eql('');
          expect(res.headers['content-type']).to.not.exist;
          expect(res.headers['content-length']).to.not.exist;
          done();
        });
    });
  });
});
