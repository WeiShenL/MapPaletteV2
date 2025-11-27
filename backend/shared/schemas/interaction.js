const { z } = require('zod');

const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
});

module.exports = { createCommentSchema };
