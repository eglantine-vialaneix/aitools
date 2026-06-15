# Welcome to AI-Tools

AI-Tools is a digital platform designed to introduce machine learning concepts to teenagers around 14 years old. In the application, students take on the role of archaeologists and follow the four main steps of a typical machine learning pipeline in order to train an algorithm to classify dinosaurs as either **Carnivores** or **Herbivores**.

The learning sequence is organized into four activities: **data labelling**, **feature selection**, **model training**, and **evaluation**. Through these activities, students progressively discover how training data is created, how relevant features are selected, how a model learns from data, and how its performance can be assessed.

AI-Tools also investigates the impact of making parts of the machine learning pipeline visible to learners. For this reason, the application contains two versions of the first three activities: a **black-box** version and a **white-box** version. The black-box version hides most of the internal mechanisms of the pipeline, while the white-box version makes selected steps more explicit and manipulable by students. Mor einformation can be found in my final report `AI Tools compressed.pdf`.

The suffixes ``BB`` and ``WB`` refer respectively to the **black-box** and **white-box** versions of an activity. This distinction was used during development to compare how much of the machine learning pipeline should be made visible to support students' understanding.

The application follows Next.js' App Router structure. Each learning activity is implemented as a route, while API endpoints handle model-related computations and experiment data collection.

The current repository is organized as follows:

```bash
.
├── app/                         # Next.js App Router directory
│   ├── api/                     # API routes
│   │   ├── evaluation/
│   │   │   └── predictions/
│   │   │       └── route.ts     # Stores or retrieves model predictions
│   │   ├── experiment/
│   │   │   └── collection/
│   │   │       └── route.ts     # Collects experimental data
│   │   └── modelling/
│   │       └── gini/
│   │           └── route.ts     # Computes Gini impurity for model training
│   │
│   ├── data_labelling/          # Step 1: data labelling activity
│   │   ├── page.tsx             # Main version
│   │   ├── pageBB.tsx           # Black-box version
│   │   └── pageWB.tsx           # White-box version
│   │
│   ├── feature_selection/       # Step 2: feature selection activity
│   │   ├── page.tsx             # Main version
│   │   ├── pageBB.tsx           # Black-box version
│   │   └── pageWB.tsx           # White-box version
│   │
│   ├── modelling/               # Step 3: model training activity
│   │   ├── page.tsx             # Main version
│   │   └── pageWB.tsx           # White-box version
│   │
│   ├── evaluation/              # Step 4: evaluation activity
│   │   ├── page.tsx             # Evaluation page
│   │   └── fin/
│   │       └── page.tsx         # Final screen
│   │
│   ├── backend/                 # Server-side logic and helper functions
│   ├── components/              # Reusable UI components
│   ├── lib/                     # Utility functions
│   ├── globals.css              # Global styles
│   └── page.tsx                 # Home page
│
├── data/                        # Dataset files used by the application
├── public/                      # Static assets such as images and csv files
├── scripts/                     # Utility scripts (for backend setup mainly)
├── package.json                 # Project dependencies and npm scripts
├── README.md                    # Repository documentation
└── AI Tools compressed.pdf      # Project final report
```

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
>Make sure you followed all steps from ```Getting Started``` before getting to deployment!

### 1) Launch the backend in one terminal

```bash
npm run dev:backend:network
```

### 2) Run the development server from another terminal

Once the backend is launched, you can either run the app:

- **locally only**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- **OR as a server**

```bash
npm run start:network
```

For other machines to connect, open ```http://XXX.XXX.XXX.XXX:3000``` (where you replace XXX.XXX.XXX.XXX with your IP address) in their browser, preferably a Chromium one.

To get your IP address and share it with other machines to connect to your network, run (in yet another terminal):

```bash
ipconfig getifaddr en0
```

### 3) Enter a set of user keys (setting the experiment condition)

To ensure data collection, a set of user keys was created in order to assigned the condition to the session state. We therefore defined three developper key sets to enter the app in each one of the preset conditions:

- C1 (Glass-Box): `C1devX` and `C1devY`
- C2 (Grey-Box): `C2devX` and `C2devY`
- C3 (Black-Box): `C3devX` and `C3devY`

The third user key is always optional.

## Acknowledgments

This project was made during the scope of my Semester Project in Pr. Francesco Mondada's lab: the MOBOTS Group where I was supervised by Valentina Ferraioli.

I, Eglantine Vialaneix, make the content of this repository available to the digital public under the [Creative Common BY-NC-SA-4.0 license](https://creativecommons.org/licenses/by-nc-sa/4.0/).

![CC BY-NC-SA-4.0](/public/Creative%20Commons%20NC%20SA.svg)

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
