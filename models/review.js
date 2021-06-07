
/*
 * Review schema and data accessor methods.
 */

const mysqlPool = require('../lib/mysqlPool');
const { extractValidFields } = require('../lib/validation');

/*
 * Schema describing required/optional fields of a review object.
 */
const ReviewSchema = {
  userid: { required: true },
  id: { required: true },
  stars: { required: true },
  review: { required: false }
};
exports.ReviewSchema = ReviewSchema;


/*
 * Executes a MySQL query to verfy whether a given user has already reviewed
 * a specified playlist.  Returns a Promise that resolves to true if the
 * specified user has already reviewed the specified playlist or false
 * otherwise.
 */
async function hasUserReviewedPlaylist(userid, playlistid) {
  const [ results ] = await mysqlPool.query(
    'SELECT COUNT(*) AS count FROM reviews WHERE userid = ? AND id = ?',
    [ userid, playlistid ]
  );
  return results[0].count > 0;
}
exports.hasUserReviewedPlaylist = hasUserReviewedPlaylist;

/*
 * Executes a MySQL query to insert a new review into the database.  Returns
 * a Promise that resolves to the ID of the newly-created review entry.
 */
async function insertNewReview(review) {
  review = extractValidFields(review, ReviewSchema);
  const [ result ] = await mysqlPool.query(
    'INSERT INTO reviews SET ?',
    review
  );
  return result.insertId;
}
exports.insertNewReview = insertNewReview;

/*
 * Executes a MySQL query to fetch a single specified review based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * review.  If no review with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getReviewById(id) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM reviews WHERE id = ?',
    [ id ]
  );
  return results[0];
}
exports.getReviewById = getReviewById;

/*
 * Executes a MySQL query to replace a specified review with new data.
 * Returns a Promise that resolves to true if the review specified by
 * `id` existed and was successfully updated or to false otherwise.
 */
async function replaceReviewById(id, review) {
  review = extractValidFields(review, ReviewSchema);
  const [ result ] = await mysqlPool.query(
    'UPDATE reviews SET ? WHERE id = ?',
    [ review, id ]
  );
  return result.affectedRows > 0;
}
exports.replaceReviewById = replaceReviewById;

/*
 * Executes a MySQL query to delete a review specified by its ID.  Returns
 * a Promise that resolves to true if the review specified by `id`
 * existed and was successfully deleted or to false otherwise.
 */
async function deleteReviewById(id) {
  const [ result ] = await mysqlPool.query(
    'DELETE FROM reviews WHERE id = ?',
    [ id ]
  );
  return result.affectedRows > 0;
}
exports.deleteReviewById = deleteReviewById;

/*
 * Executes a MySQL query to fetch all reviews for a specified playlist, based
 * on the playlist's ID.  Returns a Promise that resolves to an array
 * containing the requested reviews.  This array could be empty if the
 * specified playlist does not have any reviews.  This function does not verify
 * that the specified playlist ID corresponds to a valid playlist.
 */
async function getReviewsByPlaylistId(id) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM reviews WHERE id = ?',
    [ id ]
  );
  return results;
}
exports.getReviewsByPlaylistId = getReviewsByPlaylistId;

/*
 * Executes a MySQL query to fetch all reviews by a specified user, based on
 * on the user's ID.  Returns a Promise that resolves to an array containing
 * the requested reviews.  This array could be empty if the specified user
 * does not have any reviews.  This function does not verify that the specified
 * user ID corresponds to a valid user.
 */
async function getReviewsByUserId(id) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM reviews WHERE userid = ?',
    [ id ]
  );
  return results;
}
exports.getReviewsByUserId = getReviewsByUserId;
