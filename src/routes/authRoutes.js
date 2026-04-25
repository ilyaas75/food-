const express = require('express');
const router = express.Router();
const { registerUser, loginUser, registerValidation, loginValidation } = require('../controllers/authController');
const validate = require('../middlewares/validateMiddleware');

router.post('/register', validate(registerValidation), registerUser);
router.post('/login', validate(loginValidation), loginUser);

module.exports = router;
