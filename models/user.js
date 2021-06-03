const bcrypt = require('bcryptjs');
const mysqlPool = require('../lib/mysqlPool');
const { extractValidFields } = require('../lib/validation');

const UserSchema = {
  name: { required: true },
  email: { required: true },
  password: { required: true },
  admin: { required: true }
};
exports.UserSchema = UserSchema;

async function insertNewUser (user) {
  user = extractValidFields(user, UserSchema);
  console.log(" -- userToInsert before hashing:", user);
  user.password = await bcrypt.hash(user.password, 8);
  console.log(" -- userToInsert after hashing:", user);
  const [ result ] = await mysqlPool.query(
    'INSERT INTO users SET ?',
    user
  );
  return result.insertId;
}
exports.insertNewUser = insertNewUser;

async function getUserById (id) {
  const [ result ] = await mysqlPool.query(
    'SELECT * FROM users WHERE id = ?',
    [ id ]
  );
  return result[0];
}
exports.getUserById = getUserById;

async function validateUser(id, password) {
  const user = await getUserById(id);
  return user && await bcrypt.compare(password, user.password);

}
exports.validateUser = validateUser;
