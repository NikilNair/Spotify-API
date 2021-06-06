const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const mysqlPool = require('../lib/mysqlPool');
/*
 * API sub-router for spotifylike collection endpoints.
 */

const router = require('express').Router();

const { validateAgainstSchema } = require('../lib/validation');
const {
  ReviewSchema,
  hasUserReviewedPlaylist,
  insertNewReview,
  getReviewById,
  replaceReviewById,
  deleteReviewById
} = require('../models/review');

/*
 * Route to create a new review.
 */
router.post('/', requireAuthentication, async (req, res) => {
  let counter = 0;
  const [ result ] = await mysqlPool.query(
    'SELECT admin FROM users WHERE id = ?',
    req.user
  );
  console.log(" --Typeofavriable:",typeof(result[0].admin));
  if (result[0].admin === 1) {
    counter = 1;
  }

  if (req.user !== parseInt(req.body.userid) && counter != 1) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
  else {
    if (validateAgainstSchema(req.body, ReviewSchema)) {
      try {
        /*
         * Make sure the user is not trying to review the same playlist twice.
         * If they're not, then insert their review into the DB.
         */
        const alreadyReviewed = await hasUserReviewedPlaylist(req.body.userid, req.body.id);
        if (alreadyReviewed) {
          res.status(403).send({
            error: "User has already posted a review of this playlist"
          });
        } else {
          const id = await insertNewReview(req.body);
          res.status(201).send({
            id: id,
            links: {
              review: `/reviews/${id}`,
              playlist: `/playlists/${req.body.id}`
            }
          });
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Error inserting review into DB.  Please try again later."
        });
      }
    } else {
      res.status(400).send({
        error: "Request body is not a valid review object."
      });
    }
  }

});

/*
 * Route to fetch info about a specific review.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const review = await getReviewById(parseInt(req.params.id));
    if (review) {
      res.status(200).send(review);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch review.  Please try again later."
    });
  }
});

/*
 * Route to update a review.
 */
router.put('/:id', requireAuthentication, async (req, res, next) => {
  let counter = 0;
  const [ result ] = await mysqlPool.query(
    'SELECT admin FROM users WHERE id = ?',
    req.user
  );
  console.log(" --Typeofavriable:",typeof(result[0].admin));
  if (result[0].admin === 1) {
    counter = 1;
  }

  if (req.user !== parseInt(req.body.userid) && counter != 1) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
  else {
    if (validateAgainstSchema(req.body, ReviewSchema)) {
      try {
        const id = parseInt(req.params.id);
        const existingReview = await getReviewById(id);
        if (existingReview) {
          if (req.body.id === existingReview.id && req.body.userid === existingReview.userid) {
            const updateSuccessful = await replaceReviewById(id, req.body);
            if (updateSuccessful) {
              res.status(200).send({
                links: {
                  playlist: `/playlists/${req.body.id}`,
                  review: `/reviews/${id}`
                }
              });
            } else {
              next();
            }
          } else {
            res.status(403).send({
              error: "Updated review must have the same playlistID and userID"
            });
          }
        } else {
          next();
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Unable to update review.  Please try again later."
        });
      }
    } else {
      res.status(400).send({
        error: "Request body is not a valid review object."
      });
    }
  }

});

/*
 * Route to delete a review.
 */
router.delete('/:id', requireAuthentication, async (req, res, next) => {
  let counter = 0;
  const [ result ] = await mysqlPool.query(
    'SELECT admin FROM users WHERE id = ?',
    req.user
  );
  console.log(" --Typeofavriable:",typeof(result[0].admin));
  if (result[0].admin === 1) {
    counter = 1;
  }

  if (req.user !== parseInt(req.body.userid) && counter != 1) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
  else {
    try {
      const deleteSuccessful = await deleteReviewById(parseInt(req.params.id));
      if (deleteSuccessful) {
        res.status(204).end();
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to delete review.  Please try again later."
      });
    }
  }

});

module.exports = router;
