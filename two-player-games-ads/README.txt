Two Player Games - Ready to Deploy

Files:
- server.js (Node.js backend)
- package.json
- /data (created by server at runtime)
- /public (static site)
  - index.html
  - account.html
  - leaderboard.html
  - /assets/styles.css
  - /games/*.html

Quick start:
1. npm install
2. node server.js
3. Open http://localhost:3000

Notes:
- Fill AdSense client ids in index.html before publishing.
- Set JWT_SECRET env var in production.
