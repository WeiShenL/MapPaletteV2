const { z } = require('zod');

const waypointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  waypoints: z.array(waypointSchema).min(2),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  region: z.string().min(1),
  distance: z.number().positive(),
  imageUrl: z.string().url().optional(),
});

const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
});

module.exports = { createPostSchema, updatePostSchema };
