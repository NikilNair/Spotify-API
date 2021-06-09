/*
 * Playlist schema and data accessor methods;
 */

const mysqlPool = require('../lib/mysqlPool');
const { extractValidFields } = require('../lib/validation');
const { getReviewsByPlaylistId } = require('./review');
const { getSongsByPlaylistId } = require('./song');

/*
 * Schema describing required/optional fields of a Playlist object.
 */
const PlaylistSchema = {
  name: { required: true },
  description: { required: true },
  ownerid: { required: true }
};
exports.PlaylistSchema = PlaylistSchema;


/*
 * Executes a MySQL query to fetch the total number of playlists.  Returns
 * a Promise that resolves to this count.
 */
async function getPlaylistsCount() {
  const [ results ] = await mysqlPool.query(
    'SELECT COUNT(*) AS count FROM playlists'
  );
  return results[0].count;
}

/*
 * Executes a MySQL query to return a single page of playlists.  Returns a
 * Promise that resolves to an array containing the fetched page of playlists.
 */
async function getPlaylistsPage(page) {
  /*
   * Compute last page number and make sure page is within allowed bounds.
   * Compute offset into collection.
   */
  const count = await getPlaylistsCount();
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;

  const [ results ] = await mysqlPool.query(
    'SELECT * FROM playlists ORDER BY id LIMIT ?,?',
    [ offset, pageSize ]
  );

  return {
    playlists: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  };
}
exports.getPlaylistsPage = getPlaylistsPage;

/*
 * Executes a MySQL query to insert a new playlist into the database.  Returns
 * a Promise that resolves to the ID of the newly-created playlist entry.
 */
async function insertNewPlaylist(playlist) {
  playlist = extractValidFields(playlist, PlaylistSchema);
  const [ result ] = await mysqlPool.query(
    'INSERT INTO playlists SET ?',
    playlist
  );

  return result.insertId;
}
exports.insertNewPlaylist = insertNewPlaylist;

/*
 * Executes a MySQL query to fetch information about a single specified
 * playlist based on its ID.  Does not fetch song and review data for the
 * playlist.  Returns a Promise that resolves to an object containing
 * information about the requested playlist.  If no playlist with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getPlaylistById(id) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM playlists WHERE id = ?',
    [ id ]
  );
  return results[0];
}

/*
 * Executes a MySQL query to fetch detailed information about a single
 * specified playlist based on its ID, including song and review data for
 * the playlist.  Returns a Promise that resolves to an object containing
 * information about the requested playlist.  If no playlist with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getPlaylistDetailsById(id) {
  /*
   * Execute three sequential queries to get all of the info about the
   * specified playlist, including its reviews and songs.
   */
  const playlist = await getPlaylistById(id);
  if (playlist) {
    playlist.reviews = await getReviewsByPlaylistId(id);
    playlist.songs = await getSongsByPlaylistId(id);
  }
  return playlist;
}
exports.getPlaylistDetailsById = getPlaylistDetailsById;

/*
 * Executes a MySQL query to replace a specified playlist with new data.
 * Returns a Promise that resolves to true if the playlist specified by
 * `id` existed and was successfully updated or to false otherwise.
 */
async function replacePlaylistById(id, playlist) {
  playlist = extractValidFields(playlist, PlaylistSchema);
  const [ result ] = await mysqlPool.query(
    'UPDATE playlists SET ? WHERE id = ?',
    [ playlist, id ]
  );
  return result.affectedRows > 0;
}
exports.replacePlaylistById = replacePlaylistById;

/*
 * Executes a MySQL query to delete a playlist specified by its ID.  Returns
 * a Promise that resolves to true if the playlist specified by `id` existed
 * and was successfully deleted or to false otherwise.
 */
async function deletePlaylistById(id) {
  const [ result ] = await mysqlPool.query(
    'DELETE FROM playlists WHERE id = ?',
    [ id ]
  );
  return result.affectedRows > 0;
}
exports.deletePlaylistById = deletePlaylistById;

/*
 * Executes a MySQL query to fetch all playlists owned by a specified user,
 * based on on the user's ID.  Returns a Promise that resolves to an array
 * containing the requested playlists.  This array could be empty if the
 * specified user does not own any playlists.  This function does not verify
 * that the specified user ID corresponds to a valid user.
 */
async function getPlaylistsByOwnerId(id) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM playlists WHERE ownerid = ?',
    [ id ]
  );
  return results;
}
exports.getPlaylistsByOwnerId = getPlaylistsByOwnerId;

/*
 * Executes a MySQL query to add a song to a playlist 
*/
async function checkSongInPlaylist(playlistid, songid) {
  const [ result ] = await mysqlPool.query(
    'SELECT * from inPlaylist WHERE playlistid = ? and songid = ?',
    [playlistid, songid]
  );

  return result.length > 0;
}
exports.checkSongInPlaylist = checkSongInPlaylist;


/*
 * Executes a MySQL query to add a song to a playlist 
*/
async function addSongToPlaylist(playlistid, songid) {
  const data = {
    playlistid: playlistid,
    songid: songid
  }
  const [ result ] = await mysqlPool.query(
    'INSERT INTO inPlaylist SET ?',
    data
  );


  return result.affectedRows > 0;
}
exports.addSongToPlaylist = addSongToPlaylist;
