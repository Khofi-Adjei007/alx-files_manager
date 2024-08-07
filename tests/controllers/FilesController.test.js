/* eslint-disable import/no-named-as-default */
import { tmpdir } from 'os';
import { join as joinPath } from 'path';
import { existsSync, readdirSync, unlinkSync, statSync } from 'fs';
import dbClient from '../../utils/db';

describe('+ FilesController', () => {
  const baseDir = `${process.env.FOLDER_PATH || ''}`.trim().length > 0
    ? process.env.FOLDER_PATH.trim()
    : joinPath(tmpdir(), DEFAULT_ROOT_FOLDER);
  const mockUser = {
    email: 'katakuri@bigmom.com',
    password: 'mochi_mochi_whole_cake',
  };
  /**
   * Example files setup
   * 1. File: manga_titles.txt
   * 2. Folder: One_Piece
   * 3. File within folder: chapter_titles.md
   */
  const mockFiles = [
    {
      name: 'manga_titles.txt',
      type: 'file',
      data: [
        '+ Darwin\'s Game',
        '+ One Piece',
        '+ My Hero Academia',
        '',
      ].join('\n'),
      b64Data() { return Buffer.from(this.data, 'utf-8').toString('base64'); },
    },
    {
      name: 'One_Piece',
      type: 'folder',
      data: '',
      b64Data() { return ''; },
    },
    {
      name: 'chapter_titles.md',
      type: 'file',
      data: [
        '+ Chapter 47: The skies above the capital',
        '+ Chapter 48: 20 years',
        '+ Chapter 49: The world you wish for',
        '+ Chapter 50: Honor',
        '+ Chapter 51: The shogun of Wano - Kozuki Momonosuke',
        '+ Chapter 52: New morning',
        '',
      ].join('\n'),
      b64Data() { return Buffer.from(this.data, 'utf-8').toString('base64'); },
    },
  ];
  let token = '';
  const clearFolder = (folderPath) => {
    if (!existsSync(folderPath)) {
      return;
    }
    for (const file of readdirSync(folderPath)) {
      const fullPath = joinPath(folderPath, file);
      if (statSync(fullPath).isFile) {
        unlinkSync(fullPath);
      } else {
        clearFolder(fullPath);
      }
    }
  };
  const clearDbCollections = (callback) => {
    Promise.all([dbClient.usersCollection(), dbClient.filesCollection()])
      .then(([usersCollection, filesCollection]) => {
        Promise.all([usersCollection.deleteMany({}), filesCollection.deleteMany({})])
          .then(() => {
            if (callback) {
              callback();
            }
          })
          .catch((deleteErr) => done(deleteErr));
      }).catch((connectErr) => done(connectErr));
  };
  const registerUser = (user, callback) => {
    request.post('/users')
      .send({ email: user.email, password: user.password })
      .expect(201)
      .end((requestErr, res) => {
        if (requestErr) {
          return callback ? callback(requestErr) : requestErr;
        }
        expect(res.body.email).to.eql(user.email);
        expect(res.body.id.length).to.be.greaterThan(0);
        if (callback) {
          callback();
        }
      });
  };
  const logInUser = (user, callback) => {
    request.get('/connect')
      .auth(user.email, user.password, { type: 'basic' })
      .expect(200)
      .end((requestErr, res) => {
        if (requestErr) {
          return callback ? callback(requestErr) : requestErr;
        }
        expect(res.body.token).to.exist;
        expect(res.body.token.length).to.be.greaterThan(0);
        token = res.body.token;
        if (callback) {
          callback();
        }
      });
  };

  before(function (done) {
    this.timeout(10000);
    clearDbCollections(() => registerUser(mockUser, () => logInUser(mockUser, done)));
    clearFolder(baseDir);
  });

  after(function (done) {
    this.timeout(10000);
    setTimeout(() => {
      clearDbCollections(done);
      clearFolder(baseDir);
    });
  });

  describe('+ POST: /files', () => {
    it('+ Should fail if "X-Token" header is missing', function (done) {
      request.post('/files')
        .expect(401)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('+ Should fail if user does not exist', function (done) {
      this.timeout(5000);
      request.post('/files')
        .set('X-Token', 'raboof')
        .expect(401)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('+ Should fail if "name" is not provided', function (done) {
      this.timeout(5000);
      request.post('/files')
        .set('X-Token', token)
        .send({})
        .expect(400)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ error: 'Missing name' });
          done();
        });
    });

    it('+ Should fail if "type" is not provided', function (done) {
      this.timeout(5000);
      request.post('/files')
        .set('X-Token', token)
        .send({ name: 'manga_titles.txt' })
        .expect(400)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ error: 'Missing type' });
          done();
        });
    });

    it('+ Should fail if "type" is given but unrecognized', function (done) {
      this.timeout(5000);
      request.post('/files')
        .set('X-Token', token)
        .send({ name: 'manga_titles.txt', type: 'nakamura' })
        .expect(400)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ error: 'Missing type' });
          done();
        });
    });

    it('+ Should fail if "data" is not provided and "type" is not "folder"', function (done) {
      this.timeout(5000);
      request.post('/files')
        .set('X-Token', token)
        .send({ name: mockFiles[0].name, type: mockFiles[0].type })
        .expect(400)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ error: 'Missing data' });
          done();
        });
    });

    it('+ Should fail if an invalid "parentId" is provided', function (done) {
      this.timeout(5000);
      request.post('/files')
        .set('X-Token', token)
        .send({
          name: mockFiles[0].name,
          type: mockFiles[0].type,
          data: mockFiles[0].b64Data(),
          parentId: 55,
        })
        .expect(400)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ error: 'Parent not found' });
          done();
        });
    });

    it('+ Should succeed with valid file data', function (done) {
      this.timeout(5000);
      request.post('/files')
        .set('X-Token', token)
        .send({
          name: mockFiles[0].name,
          type: mockFiles[0].type,
          data: mockFiles[0].b64Data(),
        })
        .expect(201)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body.id).to.exist;
          expect(res.body.userId).to.exist;
          expect(res.body.name).to.eql(mockFiles[0].name);
          expect(res.body.type).to.eql(mockFiles[0].type);
          expect(res.body.isPublic).to.eql(false);
          expect(res.body.parentId).to.eql(0);
          mockFiles[0].id = res.body.id;
          done();
        });
    });

    it('+ Should succeed with valid folder data', function (done) {
      this.timeout(5000);
      request.post('/files')
        .set('X-Token', token)
        .send({
          name: mockFiles[1].name,
          type: mockFiles[1].type,
          isPublic: true,
          parentId: 0,
        })
        .expect(201)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body.id).to.exist;
          expect(res.body.userId).to.exist;
          expect(res.body.name).to.eql(mockFiles[1].name);
          expect(res.body.type).to.eql(mockFiles[1].type);
          expect(res.body.isPublic).to.eql(true);
          expect(res.body.parentId).to.eql(0);
          mockFiles[1].id = res.body.id;
          done();
        });
    });

    it('+ Should fail if "parentId" is invalid (not a folder or 0)', function (done) {
      this.timeout(5000);
      request.post('/files')
        .set('X-Token', token)
        .send({
          name: mockFiles[0].name,
          type: mockFiles[0].type,
          data: mockFiles[0].b64Data(),
          parentId: mockFiles[0].id,
        })
        .expect(400)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ error: 'Parent not found' });
          done();
        });
    });

    it('+ Should succeed if "parentId" is a valid folder', function (done) {
      this.timeout(5000);
      request.post('/files')
        .set('X-Token', token)
        .send({
          name: mockFiles[2].name,
          type: mockFiles[2].type,
          data: mockFiles[2].b64Data(),
          parentId: mockFiles[1].id,
        })
        .expect(201)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body.id).to.exist;
          expect(res.body.userId).to.exist;
          expect(res.body.name).to.eql(mockFiles[2].name);
          expect(res.body.type).to.eql(mockFiles[2].type);
          expect(res.body.data).to.eql(mockFiles[2].b64Data());
          expect(res.body.isPublic).to.eql(false);
          expect(res.body.parentId).to.eql(mockFiles[1].id);
          mockFiles[2].id = res.body.id;
          done();
        });
    });
  });

  describe('+ GET: /files/:id', () => {
    it('+ Should fail if "X-Token" header is missing', function (done) {
      request.get(`/files/${mockFiles[0].id}`)
        .expect(401)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('+ Should fail if user does not exist', function (done) {
      this.timeout(5000);
      request.get(`/files/${mockFiles[0].id}`)
        .set('X-Token', 'raboof')
        .expect(401)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('+ Should fail if file does not belong to user', function (done) {
      this.timeout(5000);
      request.get(`/files/${mockFiles[0].id}`)
        .set('X-Token', token)
        .expect(404)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ error: 'File not found' });
          done();
        });
    });

    it('+ Should succeed if file belongs to user', function (done) {
      this.timeout(5000);
      request.get(`/files/${mockFiles[0].id}`)
        .set('X-Token', token)
        .expect(200)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body.name).to.eql(mockFiles[0].name);
          expect(res.body.type).to.eql(mockFiles[0].type);
          expect(res.body.data).to.eql(mockFiles[0].b64Data());
          expect(res.body.isPublic).to.eql(false);
          expect(res.body.parentId).to.eql(0);
          done();
        });
    });
  });

  describe('+ GET: /files', () => {
    it('+ Should fail if "X-Token" header is missing', function (done) {
      request.get('/files')
        .expect(401)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('+ Should fail if user does not exist', function (done) {
      this.timeout(5000);
      request.get('/files')
        .set('X-Token', 'raboof')
        .expect(401)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('+ Should retrieve first page of files when no page query is given', function (done) {
      this.timeout(5000);
      request.get('/files')
        .set('X-Token', token)
        .expect(200)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(2);
          expect(res.body[0].name).to.eql(mockFiles[0].name);
          expect(res.body[1].name).to.eql(mockFiles[1].name);
          done();
        });
    });

    it('+ Should retrieve files for a specific parent folder when no page query is given', function (done) {
      this.timeout(5000);
      request.get('/files')
        .set('X-Token', token)
        .query({ parentId: mockFiles[1].id })
        .expect(200)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(1);
          expect(res.body[0].name).to.eql(mockFiles[2].name);
          done();
        });
    });

    it('+ Should return an empty list for a non-existent page', function (done) {
      this.timeout(5000);
      request.get('/files')
        .set('X-Token', token)
        .query({ page: 5000 })
        .expect(200)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(0);
          done();
        });
    });

    it('+ Should return an empty list for a parent ID of a file', function (done) {
      this.timeout(5000);
      request.get('/files')
        .set('X-Token', token)
        .query({ parentId: mockFiles[0].id })
        .expect(200)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(0);
          done();
        });
    });

    it('+ Should return an empty list for an unknown parent ID', function (done) {
      this.timeout(5000);
      request.get('/files')
        .set('X-Token', token)
        .query({ parentId: 1000 })
        .expect(200)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(0);
          done();
        });
    });
  });

  describe('+ PUT: /files/:id/publish', () => {
    it('+ Should fail if "X-Token" header is missing', function (done) {
      request.put(`/files/${mockFiles[0].id}/publish`)
        .expect(401)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('+ Should fail if user does not exist', function (done) {
      this.timeout(5000);
      request.put(`/files/${mockFiles[0].id}/publish`)
        .set('X-Token', 'raboof')
        .expect(401)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('+ Should fail if file does not belong to user', function (done) {
      this.timeout(5000);
      request.put(`/files/${mockFiles[0].id}/publish`)
        .set('X-Token', token)
        .expect(404)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ error: 'File not found' });
          done();
        });
    });

    it('+ Should succeed in publishing a file', function (done) {
      this.timeout(5000);
      request.put(`/files/${mockFiles[2].id}/publish`)
        .set('X-Token', token)
        .expect(200)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ success: true });
          done();
        });
    });

    it('+ Should not return a published file if parentId is given', function (done) {
      this.timeout(5000);
      request.get('/files')
        .set('X-Token', token)
        .query({ parentId: mockFiles[1].id })
        .expect(200)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(0);
          done();
        });
    });

    it('+ Should return a published file if parentId is omitted', function (done) {
      this.timeout(5000);
      request.get('/files')
        .set('X-Token', token)
        .expect(200)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(3);
          done();
        });
    });
  });

  describe('+ DELETE: /files/:id', () => {
    it('+ Should fail if "X-Token" header is missing', function (done) {
      request.delete(`/files/${mockFiles[0].id}`)
        .expect(401)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('+ Should fail if user does not exist', function (done) {
      this.timeout(5000);
      request.delete(`/files/${mockFiles[0].id}`)
        .set('X-Token', 'raboof')
        .expect(401)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ error: 'Unauthorized' });
          done();
        });
    });

    it('+ Should fail if file does not belong to user', function (done) {
      this.timeout(5000);
      request.delete(`/files/${mockFiles[0].id}`)
        .set('X-Token', token)
        .expect(404)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ error: 'File not found' });
          done();
        });
    });

    it('+ Should succeed in removing a file', function (done) {
      this.timeout(5000);
      request.delete(`/files/${mockFiles[0].id}`)
        .set('X-Token', token)
        .expect(200)
        .end((requestErr, res) => {
          if (requestErr) {
            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ success: true });
          done();
        });
    });
  });
});
