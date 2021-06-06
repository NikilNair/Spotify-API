const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const mysqlPool = require('../lib/mysqlPool');

const fs = require('fs');

const { getSongById } = require('../models/song');
/*
 * API sub-router for spotifylike collection endpoints.
 */

const router = require('express').Router();

router.get('/songs/:id', async (req, res) => {
    try {
        const song = await getSongById(parseInt(req.params.id));
        if (song) {
          var filePath = `${__dirname}/../media/${song.path}`;
          
          if(req.headers.range){
            console.log(req.get('Range'));    
            ranges = req.range(song.length);

            console.log(ranges);
            console.log(ranges.type);

            console.log(ranges.length)

            console.log(ranges[0])

            if(ranges.type != 'bytes'){
                res.status(400).send({err: "invalid range"});
                return;
            }

            console.log(ranges.length);

            if(ranges.length == 1){
    
                // setup info
                var start = ranges[0].start;
                var end = ranges[0].end;
                var readStream = fs.createReadStream(filePath, ranges[0]);
                var chunksize = (end - start) + 1;

                // send header
                res.writeHead(206, {
                    'Content-Range': 'bytes ' + start + '-' + end + '/' + song.length,
                    'Accept-Ranges': 'bytes', 'Content-Length': chunksize,
                    'Content-Type': 'audio/mpeg'
                  });
                // send parital file data
                readStream.pipe(res);
                return;
            }

            res.status(500).send({err:"miltipart headers not supported"});
          }
          else{
            console.log(song.length);
            res.writeHead(200, { "Accept-Ranges": "bytes", 'Content-Length': song.length,  'Content-Type': 'audio/mpeg' });
            fs.createReadStream(filePath).pipe(res);
          }
          
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

module.exports = router;
