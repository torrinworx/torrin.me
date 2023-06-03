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
