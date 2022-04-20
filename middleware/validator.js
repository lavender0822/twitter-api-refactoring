const { User, Tweet, Reply } = require('../models')

const postReplyCheck = async (req, res, next) => {
    try{
        const { tweet_id } = req.params
        const comment = req.body?.comment?.trim() || null
        const userId = helpers.getUser(req).id
        const user = await User.findByPk(userId)
        const tweet = await Tweet.findByPk(tweet_id)
        if (!user) throw new Error("User didn't exist!")
        if (!tweet) throw new Error("Tweet didn't exist!")
        if (!comment) throw new Error("Comment is required!")
        if (comment.length > 140) throw new Error("Comment is too long!")
    } catch(e) { next(e) } 
    next()
}

const putReplyCheck = async (req, res, next) => {
    try {
        const replyId = req.params.reply_id
        const comment = req.body?.comment?.trim() || null
        const reply = await Reply.findByPk(replyId)
        if (!reply) throw new Error("Reply didn't exist!")
        if (!comment) throw new Error("Comment is required!")
        if (comment.length > 140) throw new Error("Comment is too long!")
        if (helpers.getUser(req).id !== Number(reply.UserId)) throw new Error("You can't do this!")
    } catch (err) { next(err) }
    next()
}

const tweetCheck = async (req, res, next) => {
    try {
        const description = req.body?.description?.trim() || null
        const UserId = helpers.getUser(req).id
        if (!description) throw new Error('Description is required!')
        if (description.length > 140) throw new Error('Tweet text must be less than 140 characters!')
    } catch (err) { next(err) }
    next()
}

module.exports = {
    postReplyCheck,
    putReplyCheck,
    tweetCheck
}