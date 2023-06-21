So this is the tree of my project:

```
torrinleonard.com
├─ .dockerignore
├─ apps
│  ├─ AresMarketMaster
│  │  ├─ main.py
│  │  ├─ README.md
│  │  ├─ requierments.txt
│  │  └─ src
│  └─ README.md
├─ backend
│  ├─ ApiRoutes.js
│  └─ index.js
├─ package-lock.json
├─ package.json
├─ Procfile
├─ public
│  └─ ...
├─ README.md
└─ src
   ├─ Api.jsx
   ├─ App.jsx
   ├─ components
   │  ├─ Collision
   │  │  ├─ Collision.jsx
   │  │  ├─ MouseBall.jsx
   │  │  └─ Objects.jsx
   │  ├─ ExperienceTimeline.jsx
   │  ├─ FloatingCard.jsx
   │  ├─ Footer.jsx
   │  ├─ Header.jsx
   │  └─ ModelViewer.jsx
   ├─ index.jsx
   ├─ pages
   │  ├─ AresMarketMaster.jsx
   │  ├─ ComingSoon.jsx
   │  ├─ Home.jsx
   │  ├─ NotFound.jsx
   │  └─ Test1.jsx
   ├─ Routes.jsx
   └─ Theme.jsx

```

As you can see I have a FastAPI Python application embedded within the monorepo of my main application.

The file /backend/ApiRoutes.js looks like this and the plan is to have it be the coordinator for all apps in the apps/folder.

/backend/ApiRoutes.js:
const express = require('express');
const router = express.Router();

router.get('/example/:param1/:param2', function (req, res) {
  const { param1, param2 } = req.params;

  // Replace this with your actual logic
  const data = {
    param1,
    param2,
  };

  res.json(data);
});

module.exports = router;

The app I'm working on is currnetly AresMarketMaster, here is the main.py file for it:
import os
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

Can you please create an example api endpoint that will be live on the FastAPI server, which will then be called by the Express API backend of the web application when the frontend React application calls the Express API Backend?

Here is AresMarketMaster.jsx:
import React, { useContext } from "react";
import { Grid, Typography } from "@mui/material";
import FloatingCard from "../components/FloatingCard";

import { ThemeContext, contentMargin } from "../Theme";

export const AresMarketMaster = () => {
    const { selectedPalette } = useContext(ThemeContext);
    
    return (
        <Grid container spacing={contentMargin} justifyContent="center">
            <FloatingCard type="invisible" size="medium">

            </FloatingCard>
        </Grid>
    );
};

export default AresMarketMaster;
