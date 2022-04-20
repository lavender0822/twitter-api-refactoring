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

const signUpCheck = async (req, res, next) => {
    try {
        const account = req.body?.account?.trim() || null
        const password = req.body?.password?.trim() || null
        const checkPassword = req.body?.checkPassword?.trim() || null
        const name = req.body?.name?.trim() || null
        const email = req.body?.email?.trim() || null
        const userEmail = await User.findOne({ where: { email } })
        const userAccount = await User.findOne({ where: { account } })
        if (!account || !password || !checkPassword || !name || !email) throw new Error('All fields are required!')
        if (name.length > 50) throw new Error('Name is too long!')
        if (password !== checkPassword) throw new Error('Passwords do not match!')
        if (userEmail) throw new Error('Email already existed!')
        if (userAccount) throw new Error('Account already existed!')
    } catch (err) { next(err) }
    next()
}

//throw new Error('introduction must be less than 160 characters!')
const putUserCheck = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id)
        const { name, introduction } = req.body 
        if (!user) throw new Error("User didn't exist!")
        if (!name) throw new Error('Name is required!')
        if (name.length > 50) throw new Error('Name must be less than 50 characters!')
        if (introduction.length > 160) throw new Error('introduction must be less than 160 characters!')
    } catch (err) { next(err) }
    next()
}

module.exports = {
    postReplyCheck,
    putReplyCheck,
    tweetCheck,
    signUpCheck,
    putUserCheck,
}