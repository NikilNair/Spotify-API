const router = require('express').Router();
const { getPlaylistsByOwnerId } = require('../models/playlist');
const { getReviewsByUserId } = require('../models/review');
const { getSongsByUserId } = require('../models/song');
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const mysqlPool = require('../lib/mysqlPool');

/*
 * Route to list all of a user's playlists.
 */

const { validateAgainstSchema } = require('../lib/validation');
const {
  UserSchema,
  insertNewUser,
  getUserById,
  validateUser
} = require('../models/user');

router.post('/', requireAuthentication, async(req, res, next) => {
  let counter = 0;
  const [ result ] = await mysqlPool.query(
    'SELECT admin FROM users WHERE id = ?',
    req.user
  );

  if (result[0].admin === 1) {
    counter = 1;
  }

  if(counter === 0 && req.body.admin === 1 ) {
    res.status(401).send({
      err: "You dont have porper authorization to create an admin account."
    });
  }
  else {
    console.log("   -Requestbody:", req.body);
    if (validateAgainstSchema(req.body, UserSchema)) {
      try {
        const id = await insertNewUser(req.body);
        res.status(201).send({ user: id });
        }
      catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Unable to fetch users.  Please try again later."
        });
      }
    }
    else {
      res.status(400).send({
        error: "Request body is not a valid user object."
      });
    }
  }


});

router.post('/login', async(req, res, next) => {
  console.log(" -- requestbody:", req.body)
  console.log("  -- userid:", req.body.id)
  console.log("  -- userpassword:", req.body.password)
  if (req.body && String(req.body.id) && req.body.password) {
    try {
      const authenticated = await validateUser(req.body.id, req.body.password);
      if (authenticated) {
        res.status(200).send({
          token: generateAuthToken(req.body.id)
        });
      }
      else {
        res.status(401).send({
            error: "Invalid authentication credentials."
        });
      }
    }
    catch (err) {
      console.error("  --error:", err);
      res.status(500).send({
        error: "Error logging in. Try again later."
      })
    }
  }
  else {
    res.status(400).send({
      error: "Request body needs 'id' and 'password'."
    })
  }
});


router.get('/:id', requireAuthentication, async(req, res, next) => {
  let counter = 0;
  const [ result ] = await mysqlPool.query(
    'SELECT admin FROM users WHERE id = ?',
    req.user
  );
  console.log(" --Typeofavriable:",typeof(result[0].admin));
  if (result[0].admin === 1) {
    counter = 1;
  }

  console.log("   --Admin value from query: ",result[0].admin);


  if (req.user !== parseInt(req.params.id) && counter !== 1) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
  else {
    try {
      const users = await getUserById(parseInt(req.params.id));
      // console.log(users.admin);
      users.password = 0;
      if (users) {
        res.status(200).send({ users: users });
      } else {
        next();
      }
    }
    catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to fetch users.  Please try again later."
      });
    }
  }

});




router.get('/:id/playlists', requireAuthentication, async (req, res, next) => {
  let counter = 0;
  const [ result ] = await mysqlPool.query(
    'SELECT admin FROM users WHERE id = ?',
    req.user
  );
  console.log(" --Typeofavriable:",typeof(result[0].admin));
  if (result[0].admin === 1) {
    counter = 1;
  }

  console.log("   --Admin value from query: ",result[0].admin);

  if (req.user !== parseInt(req.params.id) && counter !== 1) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
  else {
    try {
      const playlists = await getPlaylistsByOwnerId(parseInt(req.params.id));
      if (playlists) {
        res.status(200).send({ playlists: playlists });
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to fetch playlists.  Please try again later."
      });
    }
  }

});

/*
 * Route to list all of a user's reviews.
 */
router.get('/:id/reviews', requireAuthentication, async (req, res, next) => {
  let counter = 0;
  const [ result ] = await mysqlPool.query(
    'SELECT admin FROM users WHERE id = ?',
    req.user
  );
  console.log(" --Typeofavriable:",typeof(result[0].admin));
  if (result[0].admin === 1) {
    counter = 1;
  }

  console.log("   --Admin value from query: ",result[0].admin);

  if (req.user !== parseInt(req.params.id) && counter !== 1) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
  else {
    try {
      const reviews = await getReviewsByUserId(parseInt(req.params.id));
      if (reviews) {
        res.status(200).send({ reviews: reviews });
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to fetch reviews.  Please try again later."
      });
    }
  }

});

/*
 * Route to list all of a user's songs.
 */
router.get('/:id/songs', requireAuthentication, async (req, res, next) => {
  let counter = 0;
  const [ result ] = await mysqlPool.query(
    'SELECT admin FROM users WHERE id = ?',
    req.user
  );
  console.log(" --Typeofavriable:",typeof(result[0].admin));
  if (result[0].admin === 1) {
    counter = 1;
  }

  console.log("   --Admin value from query: ",result[0].admin);

  if (req.user !== parseInt(req.params.id) && counter !== 1) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
  else {
    try {
      const songs = await getSongsByUserId(parseInt(req.params.id));
      if (songs) {
        res.status(200).send({ songs: songs });
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to fetch songs.  Please try again later."
      });
    }
  }

});

module.exports = router;
