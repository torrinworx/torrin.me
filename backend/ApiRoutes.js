const express = require('express');
const axios = require('axios');
const router = express.Router();

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

module.exports = router;