# Welcome to AI-Tools

## Getting Started

Install the JavaScript dependencies:

```bash
npm install
```

Set up the Python backend virtual environment:

```bash
npm run setup:backend
```

> 💡 This creates app/backend/.venv and installs the backend packages from app/backend/requirements.txt.

Compile for deployment:

```bash
npm run build
```

## Deployment

>[!WARNING]
>Make sure you followed all steps from ```Getting Started```before getting to deployment!

1) Launch the backend in one terminal:

```bash
npm run dev:backend:network
```

2) Run the development server from another terminal.

You can either run it:

- **locally only**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- **OR as a server**

```bash
npm run start:network
```

For other machines to connect, open ```http://000.000.000.000:3000``` (where you replace 000.000.000.000 with your IP address) in their browser, preferably a Chromium one.

To get your IP address and share it with other machines to connect to your network, run (in yet another terminal):

```bash
ipconfig getifaddr en0
```

<!-- 
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details. -->
