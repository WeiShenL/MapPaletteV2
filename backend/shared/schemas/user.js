const { z } = require('zod');

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  birthday: z.string(),
  gender: z.string(),
  profilePicture: z.string().url().optional(),
});

const updateUserSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  profilePicture: z.string().url().optional(),
  isProfilePrivate: z.boolean().optional(),
  isPostPrivate: z.boolean().optional(),
  birthday: z.string().optional(),
  gender: z.string().optional(),
});

module.exports = { createUserSchema, updateUserSchema };
