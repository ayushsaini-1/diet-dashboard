const express = require('express');
const { updateProfile, getProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/:id', protect, getProfile);
router.put('/:id', protect, updateProfile);

module.exports = router;
