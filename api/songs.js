const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const mysqlPool = require('../lib/mysqlPool');


const multer = require('multer');
const crypto = require('crypto');

/*
 * API sub-router for spotifylike collection endpoints.
 */

const router = require('express').Router();

const { validateAgainstSchema } = require('../lib/validation');
const {
  SongSchema,
  insertNewSong,
  getSongById,
  replaceSongById,
  deleteSongById
} = require('../models/song');
const { getUserById } = require('../models/user');

const acceptedFileTypes = {
  "audio/mpeg": "mp3",
  "audio/wav": "wav"
}

const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/../media`,
    filename: (req, file, callback) => {
      const filename = crypto.pseudoRandomBytes(16).toString('hex');
      const extension = acceptedFileTypes[file.mimetype];
      callback(null, `${filename}.${extension}`);
    }
  }),
  fileFilter: (req, file, callback) => {
    callback(null, !!acceptedFileTypes[file.mimetype])
  }
});

/*
 * Route to create a new song.
 */
router.post('/', upload.single('audio'), async (req, res) =>{
  console.log(req.file);
  // console.log(req.body.ownerid);

  // ensure data exists
  if(! req.body.ownerid || ! req.body.name){
    res.status(400).send({err: "must contain 'name' and 'ownerid'"})
    return;
  }
  exists = await getUserById(req.body.ownerid)
  if(! exists){
    res.status(403).send({err: "user doesn't exist"});
    return;
  }

  // todo verify user here

  let song = {
    name: req.body.name,
    length: req.file.size,
    path: req.file.filename,
    ownerid: req.body.ownerid
  }

  id = await insertNewSong(song);


  res.status(200).send({id: id});
});


// router.post('/', requireAuthentication, async (req, res) => {
//   let counter = 0;
//   const [ result ] = await mysqlPool.query(
//     'SELECT admin FROM users WHERE id = ?',
//     req.user
//   );
//   console.log(" --Typeofavriable:",typeof(result[0].admin));
//   if (result[0].admin === 1) {
//     counter = 1;
//   }

//   if (req.user !== parseInt(req.params.userid) && counter !== 1) {
//     res.status(403).send({
//       error: "Unauthorized to access the specified resource"
//     });
//   }
//   else {
//     if (validateAgainstSchema(req.body, SongSchema)) {
//       try {
//         const id = await insertNewSong(req.body);
//         res.status(201).send({
//           id: id,
//           links: {
//             song: `/songs/${id}`,
//             playlist: `/playlists/${req.body.id}`
//           }
//         });
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({
//           error: "Error inserting song into DB.  Please try again later."
//         });
//       }
//     } else {
//       res.status(400).send({
//         error: "Request body is not a valid song object"
//       });
//     }
//   }

// });

/*
 * Route to fetch info about a specific song.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const song = await getSongById(parseInt(req.params.id));
    if (song) {
      res.status(200).send(song);
      
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch song.  Please try again later."
    });
  }
});

/*
 * Route to update a song.
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

  if (req.user !== parseInt(req.params.userid) && counter !== 1) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
  else {
    if (validateAgainstSchema(req.body, SongSchema)) {
      try {
        const id = parseInt(req.params.id);
        const existingSong = await getSongById(id);
        if (existingSong) {
          if (req.body.playlistid === existingSong.playlistid && req.body.userid === existingSong.userid) {
            const updateSuccessful = await replaceSongById(id, req.body);
            if (updateSuccessful) {
              res.status(200).send({
                links: {
                  playlist: `/playlists/${req.body.playlistid}`,
                  song: `/songs/${id}`
                }
              });
            } else {
              next();
            }
          } else {
            res.status(403).send({
              error: "Updated song must have the same playlistID and userID"
            });
          }
        } else {
          next();
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Unable to update song.  Please try again later."
        });
      }
    } else {
      res.status(400).send({
        error: "Request body is not a valid song object."
      });
    }
  }

});

/*
 * Route to delete a song.
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

  if (req.user !== parseInt(req.params.userid) && counter !== 1) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
  else {
    try {
      const deleteSuccessful = await deleteSongById(parseInt(req.params.id));
      if (deleteSuccessful) {
        res.status(204).end();
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to delete song.  Please try again later."
      });
    }
  }

});

module.exports = router;
