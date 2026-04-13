const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/chatbot.controller');
const { auth } = require('../middlewares/auth');

router.post('/consultar', auth, ChatbotController.consultar);

module.exports = router;
