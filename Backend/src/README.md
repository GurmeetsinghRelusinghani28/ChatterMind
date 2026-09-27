# New Backend Structure

This folder is a starter production-oriented backend layout for the next migration step.

## Suggested structure

```text
src/
  app/
    app.js
    server.js
  config/
    env.js
    logger.js
  common/
    errors/
      AppError.js
    middleware/
      error.middleware.js
    utils/
      asyncHandler.js
  modules/
    projects/
      project.controller.js
      project.repository.js
      project.routes.js
      project.service.js
    ai/
      ai.job.producer.js
```

These files are starter templates only. They are not wired into the legacy backend yet.
