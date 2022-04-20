const helpers = require('../_helpers')
const { User, Tweet, Reply, Like } = require("../models")

const tweetController = {
  getTweets: async (req, res, next) => {
    try {
      const tweets = await Tweet.findAll({
        order: [['createdAt', 'DESC']],
        include: [{ model: User },
          { model: Reply },
          { model: Like }]
      })
      if (!tweets) return res.json([])
      const result = tweets.map(tweet => {
        return {
          TweetId: tweet.id,
          description: tweet.description,
          createdAt: tweet.createdAt,
          tweetUserId: tweet.User.id,
          tweetUserName: tweet.User.name,
          tweetUserAccount: tweet.User.account,
          avatar: tweet.User.avatar,
          repliedCount: tweet.Replies.length,
          likeCount: tweet.Likes.length,
          liked: req.user.LikedTweets ? req.user.LikedTweets.some(l => l.id === tweet.id) : false
        }
      })
      res.json(result)
    } catch (err) { next(err) }
  },

  getTweet: async (req, res, next) => {
    try {
      const tweet = await Tweet.findByPk(req.params.tweet_id, {
        order: [['createdAt', 'DESC']],
        include: [{ model: User },
          { model: Reply, include: User },
          { model: Like }]
        })
      if (!tweet) return res.json([])
      const reply = tweet.Replies
      const replyResult = reply.map(r => ({
        repliedComment: r.comment,
        createdAt: r.createdAt,
        repliedUser: r.User.id,
        repliedUserName: r.User.name,
        repliedUserAvatar: r.User.avatar
      }))
      const result = {
        TweetId: tweet.id,
        description: tweet.description,
        createdAt: tweet.createdAt,
        tweetUserName: tweet.User.name,
        tweetUserId: tweet.User.id,
        tweetUserAccount: tweet.User.account,
        avatar: tweet.User.avatar,
        repliedCount: reply.length,
        likeCount: tweet.Likes.length,
        liked: req.user.LikedTweets ? req.user.LikedTweets.some(l => l.id === tweet.id) : false,
        replyResult
      }
      res.json(result)
    } catch (err) { next(err) }
  },
  
  postTweet: async (req, res, next) => {
    try {
      const description = req.body.description.trim() || null
      const UserId = helpers.getUser(req).id
      await Tweet.create({
        description,
        UserId
      })
      res.json({ status: 'success' })
    } catch (err) { next(err) }
  },

  getReplies: async (req, res, next) => {
    try {
      const { tweet_id } = req.params;
      const tweet = await Tweet.findByPk(tweet_id, {
        include: [
          { model: Reply, other: ['createAt', 'DESC'], include: [{model: User, attributes: ['id', 'name', 'account', 'avatar']}]},
          { model: User }
        ],
      })
      if (!tweet) throw new Error("Tweet didn't exist!")
      const result = tweet.Replies.map(reply => {
        return {
          TweetId: reply.TweetId,
          tweetUserId: tweet.User.id,
          tweetUserAccount: tweet.User.account,
          commentId: reply.id,
          comment: reply.comment,
          createdAt: reply.createdAt,
          commentUser: reply.User
        }
      })
      res.json(result);
    } catch (err) { next(err) }
  },

  addLike: async (req, res, next) => {
    try {
      const UserId = helpers.getUser(req).id;
      const TweetId = req.params.tweet_id
      const tweet = await Tweet.findByPk(TweetId)
      const like = await Like.findOne({ where: { UserId, TweetId }})
      if (!tweet) throw new Error("Tweet didn't exist!")
      if (like) throw new Error("You have like this tweet!")
      Like.create({ UserId, TweetId })
      res.json({ status: 'success'})
    } catch(err) { next(err) }
  },

  removeLike: async (req, res, next) => {
    try {
      const UserId = helpers.getUser(req).id;
      const TweetId = req.params.tweet_id
      const like = await Like.findOne({ where: { UserId, TweetId }})
      if (!like) throw new Error("You haven't like this tweet!")
      like.destroy()
      res.json({ status: 'success'})
    } catch(err) { next(err) }
  }
}

module.exports = tweetController
