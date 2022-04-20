const express = require('express')
const router = express.Router()

const userController = require('../../../controllers/user-controllers')

const upload = require('../../../middleware/multer')

const { signUpCheck } = require('../../../middleware/validator')

router.get('/get_current_user', userController.getCurrentUser)
router.get('/top', userController.getTopUsers)
router.get('/:id/followings', userController.userFollowings)
router.get('/:id/followers', userController.userFollowers)
router.get('/:id/tweets', userController.getUserTweets)
router.get('/:id/replied_tweets', userController.getReliedTweets)
router.get('/:id/likes', userController.getLikes)
router.get('/:id', userController.getUser)
router.put('/:id/edit', signUpCheck, userController.editAccount)
router.put('/:id', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), userController.putUser)

module.exports = router