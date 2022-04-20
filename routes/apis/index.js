const express = require('express')
const router = express.Router()

const passport = require('../../config/passport')

const admin = require('./modules/admin')
const user = require('./modules/users')
const tweet = require('./modules/tweets')

const adminController = require('../../controllers/admin-controllers')
const userController = require('../../controllers/user-controllers')
const replyController = require('../../controllers/reply-contollers')

const { authenticated, authenticatedAdmin } = require('../../middleware/api-auth')

router.post('/users/signin', passport.authenticate('local', { session: false }), userController.login)
router.post('/admin/login', passport.authenticate('local', { session: false }), adminController.login)

router.post('/users', userController.signUp)

router.put('/replies/:reply_id', authenticated, replyController.putReply)
router.delete('replies/:reply_id', authenticated, replyController.deleteReply)

router.post('/followships', authenticated, userController.addFollow)
router.delete('/followships/:followingId', authenticated, userController.removeFollow)

router.use('/admin', authenticated, authenticatedAdmin, admin)
router.use('/users', authenticated, user)
router.use('/tweets', authenticated, tweet)

module.exports = router