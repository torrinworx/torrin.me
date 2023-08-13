const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

router.get('/add/:param1/:param2', async function (req, res) {
  const { param1, param2 } = req.params;

  try {
    const response = await axios.get(`http://127.0.0.1:8000/add/${param1}/${param2}`);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error calling FastAPI");
  }
});

router.post('/fetchContactInfo', async (req, res) => {
  const captchaToken = req.body.captchaToken;

  // Verify reCAPTCHA token with Google
  const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;

  const response = await fetch(verificationURL, {
    method: 'POST',
  });

  const captchaVerification = await response.json();

  if (captchaVerification.success) {
    // If captcha is verified, send the contact information
    res.json({
      email: "torrin@worx4you.com",
      discord: "torrinleonard"
    });
  } else {
    // If captcha verification fails
    res.status(401).send("Captcha verification failed");
  }
});

module.exports = router;
