const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'Validation Error',
          errors,
        });
      }

      req[source] = result.data;
      next();
    } catch (error) {
      console.error('[VALIDATION] Error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Validation failed',
      });
    }
  };
};

module.exports = { validate };
