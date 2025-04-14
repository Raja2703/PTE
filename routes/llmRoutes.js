const express = require('express');
const llmController = require('./../controllers/llmController');

const router = express.Router();

router.route('/summary/evaluate').post(llmController.evaluateSummary);
router.route('/voice/evaluate').post(llmController.evaluateReadingSkill);

module.exports = router;
