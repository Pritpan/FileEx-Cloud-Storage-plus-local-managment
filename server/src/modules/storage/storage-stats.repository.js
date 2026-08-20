import prisma from '../../config/prisma.js';

const create = async (data, db = prisma) => {
  return db.storageStats.create({ data });
};

const findByUserId = async (userId, db = prisma) => {
  return db.storageStats.findUnique({
    where: { userId },
  });
};

const update = async (userId, data, db = prisma) => {
  return db.storageStats.update({
    where: { userId },
    data,
  });
};

const incrementStorage = async (userId, bytes, db = prisma) => {
  return db.storageStats.update({
    where: { userId },
    data: {
      usedStorage: { increment: bytes },
    },
  });
};

const decrementStorage = async (userId, bytes, db = prisma) => {
  return db.storageStats.update({
    where: { userId },
    data: {
      usedStorage: { decrement: bytes },
    },
  });
};

const storageStatsRepository = {
  create,
  findByUserId,
  update,
  incrementStorage,
  decrementStorage,
};

export default storageStatsRepository;
