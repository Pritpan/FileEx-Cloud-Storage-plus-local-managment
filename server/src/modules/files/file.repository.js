import prisma from '../../config/prisma.js';

const create = async (data, db = prisma) => {
  return db.file.create({
    data,
  });
};

const findById = async (id, db = prisma) => {
  return db.file.findFirst({
    where: { 
      id,
      deletedAt: null,
    },
  });
};

const findDeletedById = async (id, db = prisma) => {
  return db.file.findFirst({
    where: {
      id,
      deletedAt: { not: null },
    },
  });
};

const findByStorageKey = async (storageKey, db = prisma) => {
  return db.file.findFirst({
    where: { 
      storageKey,
      deletedAt: null,
    },
  });
};

const findRootItems = async (ownerId, db = prisma) => {
  return db.file.findMany({
    where: {
      ownerId,
      parentId: null,
      deletedAt: null,
    },
    orderBy: [
      { type: 'desc' },
      { displayName: 'asc' },
    ],
  });
};

const findChildren = async (ownerId, parentId, db = prisma) => {
  return db.file.findMany({
    where: {
      ownerId,
      parentId,
      deletedAt: null,
    },
    orderBy: [
      { type: 'desc' },
      { displayName: 'asc' },
    ],
  });
};

const findActiveByName = async (ownerId, parentId, displayName, db = prisma) => {
  return db.file.findFirst({
    where: {
      ownerId,
      parentId,
      displayName,
      deletedAt: null,
    },
  });
};

const findTrash = async (ownerId, db = prisma) => {
  return db.file.findMany({
    where: {
      ownerId,
      deletedAt: { not: null },
    },
    orderBy: {
      deletedAt: 'desc',
    },
  });
};

const findDeletedChildren = async (ownerId, parentId, db = prisma) => {
  return db.file.findMany({
    where: {
      ownerId,
      parentId,
      deletedAt: { not: null },
    },
  });
};

const update = async (id, data, db = prisma) => {
  const existing = await findById(id, db);
  if (!existing) return null;

  return db.file.update({
    where: { id },
    data,
  });
};

const softDelete = async (id, deletedAt, db = prisma) => {
  const existing = await findById(id, db);
  if (!existing) return null;

  return db.file.update({
    where: { id },
    data: { deletedAt },
  });
};

const restore = async (id, db = prisma) => {
  const existing = await findDeletedById(id, db);
  if (!existing) return null;

  return db.file.update({
    where: { id },
    data: { deletedAt: null },
  });
};

const permanentlyDelete = async (id, db = prisma) => {
  const existing = await findDeletedById(id, db);
  if (!existing) return null;

  return db.file.delete({
    where: { id },
  });
};

const search = async (ownerId, query, parentId, db = prisma) => {
  const whereClause = {
    ownerId,
    deletedAt: null,
    displayName: {
      contains: query,
    },
  };

  if (parentId !== undefined) {
    whereClause.parentId = parentId;
  }

  return db.file.findMany({
    where: whereClause,
    orderBy: [
      { type: 'desc' },
      { displayName: 'asc' },
    ],
  });
};

const countByType = async (ownerId, type, db = prisma) => {
  return db.file.count({
    where: {
      ownerId,
      type,
      deletedAt: null,
    },
  });
};

const findRecent = async (ownerId, limit = 20, db = prisma) => {
  return db.file.findMany({
    where: {
      ownerId,
      type: 'FILE',
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

const fileRepository = {
  create,
  findById,
  findDeletedById,
  findByStorageKey,
  findRootItems,
  findChildren,
  findActiveByName,
  findTrash,
  findDeletedChildren,
  search,
  update,
  softDelete,
  restore,
  permanentlyDelete,
  countByType,
  findRecent,
};

export default fileRepository;
