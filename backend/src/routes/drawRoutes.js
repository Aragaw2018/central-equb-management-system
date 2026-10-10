// src/routes/drawRoutes.js
const express = require('express');
const router  = express.Router();
const { startDraw, getDrawResults, confirmGuarantor } = require('../controllers/drawController');

// Organizer triggers the draw
router.post('/:groupId/start', startDraw);

// Get past draw results for a group
router.get('/:groupId/results', getDrawResults);

// Winner confirms guarantor
router.patch('/result/:resultId/guarantor', confirmGuarantor);

module.exports = router;
