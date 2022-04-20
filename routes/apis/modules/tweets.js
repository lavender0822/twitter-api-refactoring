const express = require('express')
const router = express.Router()

const tweetController = require('../../../controllers/tweet-controllers')
const replyController = require('../../../controllers/reply-controllers')
const { postReplyCheck, tweetCheck } = require('../../../middleware/validator')

router.get('/:tweet_id/replies', tweetController.getReplies)
router.post('/:tweet_id/replies', postReplyCheck, replyController.postReply)
router.post('/:tweet_id/like', tweetController.addLike)
router.post('/:tweet_id/unlike', tweetController.removeLike)
router.get('/:tweet_id', tweetController.getTweet)
router.get('/', tweetController.getTweets)
router.post('/', tweetCheck, tweetController.postTweet)

module.exports = router