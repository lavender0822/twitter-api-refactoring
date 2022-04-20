const { User, Tweet, Reply } = require('../models')

const helpers = require('../_helpers')

// try{} catch(e) { next(e) }

const replyController = {
    postReply: async (req, res, next) => {
        try{
            const { tweet_id } = req.params
            const comment = req.body?.comment?.trim() || null
            const userId = helpers.getUser(req).id
            const newReply = await Reply.create({
                comment,
                TweetId: tweet_id,
                UserId: userId
            })
            res.json({ status: 'success'})
        } catch(e) { next(e) }
    },

    putReply: async (req, res, next) => {
        try {
            const replyId = req.params.reply_id
            const comment = req.body?.comment?.trim() || null
            const reply = await Reply.findByPk(replyId)
            reply.update({ comment })
            res.json({ status: 'success' })
        } catch (err) { next(err) }
    },

    deleteReply: async (req, res, next) => {
        try {
            const replyId = req.params.reply_id
            const reply = await Reply.findByPk(replyId)
            if (!reply) throw new Error("Reply didn't exist!")
            if (helpers.getUser(req).id !== Number(reply.UserId)) throw new Error("You can't do this!")
            reply.destroy()
            res.json({ status: 'success'})
        } catch (err) { next(err) }
    }
}

module.exports = replyController