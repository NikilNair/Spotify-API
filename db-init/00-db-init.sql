USE spotifylike;

CREATE TABLE users
(
  id INT NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  password varchar(255) NOT NULL,
  admin BOOLEAN DEFAULT false,
  PRIMARY KEY (id),
  UNIQUE (email)
);

CREATE TABLE playlists
(
  id INT NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  description TEXT,
  ownerid INT NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (ownerid) REFERENCES users(id)
);

CREATE TABLE songs
(
  id INT NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  length INT NOT NULL,
  path varchar(255) NOT NULL,
  ownerid INT NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (ownerid) REFERENCES users(id)
);

CREATE TABLE reviews
(
  id INT NOT NULL AUTO_INCREMENT,
  stars INT NOT NULL,
  review TEXT,
  userid INT NOT NULL,
  playlistid INT NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (userid) REFERENCES users(id),
  FOREIGN KEY (playlistid) REFERENCES playlists(id)
);

CREATE TABLE inPlaylist
(
  playlistid INT NOT NULL,
  songid INT NOT NULL,
  PRIMARY KEY (playlistid, songid),
  FOREIGN KEY (playlistid) REFERENCES playlists(id),
  FOREIGN KEY (songid) REFERENCES songs(id)
);

INSERT INTO `users` VALUES
  (1,'Admin','admin@businesses.com','$2a$08$Y00/JO/uN9n0dHKuudRX2eKksWMIHXDLzHWKuz/K67alAYsZRRike',1),
  (2,'Test-user','test-user1@email.com','$2a$08$Y2IHnr/PU9tzG5HKrHGJH.zH3HAvlR5i5puD5GZ1sHA/mVrHKci72',0),
  (3,'Another-Test-user','test-user2@email.com','$2a$08$bAKRXPs6fUPhqjZy55TIeO1e.aXud4LD81awrYncaCKJoMsg/s0c.',0);

INSERT INTO `playlists` VALUES
  (1,'Pop', 'This a playlist filled with pop music.', 1),
  (2,'Classical Rock', 'This is a playlist filled with classical rock music.', 2),
  (3,'EDM', 'This is a playlist filled with electronic dance music.', 2);


INSERT INTO `reviews` VALUES
  (1,3,'This was a pretty average playlist.',1,1),
  (2,4,'This was a good playlist.',1,2),
  (3,5,'This is one of the best playlists I have ever heard',2,3);

INSERT INTO `songs` VALUES (1,"default",2646308,"default.mp3",1);

INSERT INTO `inPlaylist` VALUES (1,1);