const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function hashPassword(pw) {
  return bcrypt.hashSync(pw, 10);
}
function verifyPassword(pw, hash) {
  try { return bcrypt.compareSync(pw, hash); } catch { return false; }
}
function newSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}
function sha256Hex(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}
function newPublicId() {
  return crypto.randomBytes(10).toString('hex');
}
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
function cleanStr(v, max = 500) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

module.exports = { hashPassword, verifyPassword, newSessionToken, sha256Hex, newPublicId, isValidEmail, cleanStr };
