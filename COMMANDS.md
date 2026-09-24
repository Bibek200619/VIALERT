# Commands

These commands are a suggested starting point. Update them after the repository is created.

## Frontend

```bash
npm create vite@latest vialert -- --template react
cd vialert
npm install
npm run dev
```

## Backend

```bash
mkdir server
cd server
npm init -y
npm install express cors
node index.js
```

## Full Project

Suggested scripts for `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "vite",
    "dev:server": "node server/index.js",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## Demo Checklist

```text
1. Start local server
2. Open dashboard
3. Start emergency
4. Add accident
5. Show rerouting
6. Show green corridor
7. Show metrics
```

