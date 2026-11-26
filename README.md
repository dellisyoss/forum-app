# Forum App

A public forum with a group chat layout. Posts and replies share one timeline, and signed-in users can start discussions, reply to posts, and delete their own messages.

## Run locally

Run these commands from the repository root.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The app uses React and Axios, and Vite proxies requests under `/api` to the forum backend.

## Preview a production build

```sh
npm run build
npm run preview
```
