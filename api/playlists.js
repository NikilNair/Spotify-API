const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const mysqlPool = require('../lib/mysqlPool');
/*
 * API sub-router for spotifylike collection endpoints.
 */

const router = require('express').Router();

const { validateAgainstSchema } = require('../lib/validation');
const {
  PlaylistSchema,
  getPlaylistsPage,
  insertNewPlaylist,
  getPlaylistDetailsById,
  replacePlaylistById,
  deletePlaylistById,
  getPlaylistsByOwnerdId,
  addSongToPlaylist,
  checkSongInPlaylist
} = require('../models/playlist');
const { getSongsByPlaylistId, getSongById } = require('../models/song');

/*
 * Route to return a paginated list of playlists.
 */
router.get('/', async (req, res) => {
  try {
    /*
     * Fetch page info, generate HATEOAS links for surrounding pages and then
     * send response.
     */
    const playlistPage = await getPlaylistsPage(parseInt(req.query.page) || 1);
    playlistPage.links = {};
    if (playlistPage.page < playlistPage.totalPages) {
      playlistPage.links.nextPage = `/playlists?page=${playlistPage.page + 1}`;
      playlistPage.links.lastPage = `/playlists?page=${playlistPage.totalPages}`;
    }
    if (playlistPage.page > 1) {
      playlistPage.links.prevPage = `/playlists?page=${playlistPage.page - 1}`;
      playlistPage.links.firstPage = '/playlists?page=1';
    }
    res.status(200).send(playlistPage);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Error fetching playlists list.  Please try again later."
    });
  }
});

/*
 * Route to create a new playlist.
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

  if (req.user !== parseInt(req.params.ownerid) && counter !== 1) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
  else {
    if (validateAgainstSchema(req.body, PlaylistSchema)) {
      try {
        const id = await insertNewPlaylist(req.body);
        res.status(201).send({
          id: id,
          links: {
            playlist: `/playlists/${id}`
          }
        });
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Error inserting playlist into DB.  Please try again later."
        });
      }
    } else {
      res.status(400).send({
        error: "Request body is not a valid playlist object."
      });
    }
  }

});

/*
 * Route to fetch info about a specific playlist.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const playlist = await getPlaylistDetailsById(parseInt(req.params.id));
    if (playlist) {
      res.status(200).send(playlist);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch playlist.  Please try again later."
    });
  }
});

/*
 * Route to replace data for a playlist.
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


  if (req.user !== parseInt(req.params.ownerid) && counter !== 1) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
  else {
    if (validateAgainstSchema(req.body, PlaylistSchema)) {
      try {
        const id = parseInt(req.params.id)
        const updateSuccessful = await replacePlaylistById(id, req.body);
        if (updateSuccessful) {
          res.status(200).send({
            links: {
              playlist: `/playlists/${id}`
            }
          });
        } else {
          next();
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Unable to update specified playlist.  Please try again later."
        });
      }
    } else {
      res.status(400).send({
        error: "Request body is not a valid playlist object"
      });
    }
  }

});

router.post('/:id/add', async (req, res, next) => {
  let playlist = await getSongsByPlaylistId(parseInt(req.params.id));
  let song = await getSongById(parseInt(req.body.songid));

  if(! playlist){
    next();
  }
  if(! song){
    res.status(400).send({err: "song with id does not exist"});
    return;
  }

  let exists = await checkSongInPlaylist(parseInt(req.params.id), parseInt(req.body.songid));
  console.log(exists);
  if(exists){
    res.status(403).send({err: "you may only add a song to a playlist once!"});
    return;
  }

  //todo verify auth here

  const result = await addSongToPlaylist(parseInt(req.params.id), parseInt(req.body.songid));

  if(!! result){
    res.status(201).send();
  }
  else{
    res.status(500).send({err: "unable to add song to playlist."})
  }
});

/*
 * Route to delete a playlist.
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


  if (req.user !== parseInt(req.params.ownerid) && counter !== 1) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
  else {
    try {
      const deleteSuccessful = await deletePlaylistById(parseInt(req.params.id));
      if (deleteSuccessful) {
        res.status(204).end();
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to delete playlist.  Please try again later."
      });
    }
  }

});

module.exports = router;
