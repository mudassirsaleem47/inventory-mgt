const bcrypt = require('bcryptjs');
const prisma = require('../../lib/prisma');

const createUser = async (name, email, password) => {
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    }
  });

  return newUser;
};

const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: {
      email: email.toLowerCase()
    }
  });
};

const findUserById = async (id) => {
  return await prisma.user.findUnique({
    where: {
      id
    }
  });
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};
