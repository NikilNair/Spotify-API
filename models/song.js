/*
 * Song schema and data accessor methods.
 */

const mysqlPool = require('../lib/mysqlPool');
const { extractValidFields } = require('../lib/validation');

/*
 * Schema describing required/optional fields of a song object.
 */
const SongSchema = {
  name: { required: true },
  length: { required: true },
  path: { required: true },
  ownerid: { required: true }
};
exports.SongSchema = SongSchema;

/*
 * Executes a MySQL query to insert a new song into the database.  Returns
 * a Promise that resolves to the ID of the newly-created song entry.
 */
async function insertNewSong(song) {
  song = extractValidFields(song, SongSchema);
  const [ result ] = await mysqlPool.query(
    'INSERT INTO songs SET ?',
    song
  );
  return result.insertId;
}
exports.insertNewSong = insertNewSong;

/*
 * Executes a MySQL query to fetch a single specified song based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * song.  If no song with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getSongById(id) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM songs WHERE id = ?',
    [ id ]
  );
  return results[0];
}
exports.getSongById = getSongById;

/*
 * Executes a MySQL query to replace a specified song with new data.
 * Returns a Promise that resolves to true if the song specified by
 * `id` existed and was successfully updated or to false otherwise.
 */
async function replaceSongById(id, song) {
  song = extractValidFields(song, SongSchema);
  const [ result ] = await mysqlPool.query(
    'UPDATE songs SET ? WHERE id = ?',
    [ song, id ]
  );
  return result.affectedRows > 0;
}
exports.replaceSongById = replaceSongById;



async function getSongsCount() {
  const [ results ] = await mysqlPool.query(
    'SELECT COUNT(*) AS count FROM songs'
  );
  return results[0].count;
}

async function getAllSongs(page) {
  const count = await getSongsCount();
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;

  const [ results ] = await mysqlPool.query(
    'SELECT * FROM songs ORDER BY id LIMIT ?,?',
    [ offset, pageSize ]
  );

  return {
    songs: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  };
}
exports.getAllSongs = getAllSongs;


/*
 * Executes a MySQL query to delete a song specified by its ID.  Returns
 * a Promise that resolves to true if the song specified by `id`
 * existed and was successfully deleted or to false otherwise.
 */
async function deleteSongById(id) {
  const [ result ] = await mysqlPool.query(
    'DELETE FROM songs WHERE id = ?',
    [ id ]
  );
  return result.affectedRows > 0;
}
exports.deleteSongById = deleteSongById;

/*
 * Executes a MySQL query to fetch all songs for a specified playlist, based
 * on the playlist's ID.  Returns a Promise that resolves to an array
 * containing the requested songs.  This array could be empty if the
 * specified playlist does not have any songs.  This function does not verify
 * that the specified playlist ID corresponds to a valid playlist.
 */
async function getSongsByPlaylistId(id) {
  const [ results ] = await mysqlPool.query(
    'SELECT songs.id, songs.name, songs.ownerid FROM songs INNER JOIN inPlaylist ON songs.id=inPlaylist.songid WHERE inPlaylist.playlistid = ?;',
    [ id ]
  );
  return results;
}
exports.getSongsByPlaylistId = getSongsByPlaylistId;

/*
 * Executes a MySQL query to fetch all songs by a specified user, based on
 * on the user's ID.  Returns a Promise that resolves to an array containing
 * the requested songs.  This array could be empty if the specified user
 * does not have any songs.  This function does not verify that the specified
 * user ID corresponds to a valid user.
 */
async function getSongsByUserId(id) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM songs WHERE userid = ?',
    [ id ]
  );
  return results;
}
exports.getSongsByUserId = getSongsByUserId;
