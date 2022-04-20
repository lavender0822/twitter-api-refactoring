const helpers = require('../_helpers')
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken")

const { imgurFileHandler } = require('../helpers/file-helpers')
const { reporters } = require('mocha')
const { User, Tweet, Reply, Like, Followship } = require('../models')

const userController = {
  login: (req, res, next) => {
    const errData = req.user.data
    try {
      if (!errData) {
        const userData = req.user.toJSON()
        if (userData.role === 'user') {
          delete userData.password;
          const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: "30d" })
          res.json({
            status: "success",
            data: {
              token,
              user: userData,
            }
          });
        } else { 
          throw new Error('This is for normal user!')
        }
      } else {
        res.json(errData)
      }
    } catch (err) { next(err) }
  },
  
  signUp: async (req, res, next) => {
    try {
      const { account, password, name, email } = req.body
      const hash = bcrypt.hash(password, 10)
      await User.create({
        name,
        account,
        email,
        password: hash,
        isAdmin: false,
        role: 'user'
      })
      res.json({ status: 'success' })
    } catch (err) { next(err) }
  },

  editAccount: async (req, res, next) => {
    try {
      if (req.user.id !== Number(req.params.id)) throw new Error("You can't do this!")
      const user = await User.findByPk(req.params.id)
      const { account, password, name, email } = req.body
      const hash = bcrypt.hash(password, 10)
      await user.update({
        name: name,
        account: account,
        email: email,
        password: hash
      })
      res.json({ status: 'success' })
    } catch (err) { next(err) }
  },

  putUser: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id)
      const { name, introduction } = req.body
      if (helpers.getUser(req).id !== Number(req.params.id)) throw new Error("You can't do this!")
      const { files } = req
      if (files) {
        const avatar = files.avatar ? await imgurFileHandler(files.avatar[0]) : null
        const cover = files.cover ? await imgurFileHandler(files.cover[0]) : null
        await user.update({
          name,
          introduction,
          avatar: avatar || user.avatar,
          cover: cover || user.cover
        })
        res.json({ status: 'success' })
      } else {
        await user.update({
          name,
          introduction,
          avatar: user.avatar,
          cover: user.cover
        })
        res.json({ status: 'success' })
      }
    } catch (e) { next(e) }
  },

  getCurrentUser: async (req, res, next) => {
    const DEFAULT_COUNT = 0
    const count = {}
    try {
      const currentUser = helpers.getUser(req)
      const user = await User.findByPk(currentUser.id, {
        include: [
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' },
          { model: Like },
          { model: Tweet },
          { model: Reply }
        ]
      })
      count.tweetCount = user.Tweets.length || DEFAULT_COUNT
      count.likedCount = user.Likes.length || DEFAULT_COUNT
      count.repliedCount = user.Replies.length || DEFAULT_COUNT
      count.followerCount = user.Followers.length || DEFAULT_COUNT
      count.followingCount = user.Followings.length || DEFAULT_COUNT
      res.json({ status: 'success', user, count })
    } catch (e) { next(e) }
  },

  getUser: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id, {
        include: [
          { model: Tweet },
          { model: User, as: 'Followings' },
          { model: User, as: 'Followers' }
        ]
      })
      if (!user) throw new Error("User didn't exist!")
      const { account, name, email, introduction, avatar, cover } = user
      const isFollowing = user.Followers.some(f => f.id === req.user.id)
      return res.json({ 
        account,
        name,
        email,
        introduction,
        avatar,
        cover,
        tweetCount: user.Tweets.length,
        followingCount: user.Followings.length,
        followerCount: user.Followers.length,
        isFollowing
      })
    } catch (e) { next(e) }
  },

  getUserTweets: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id, {
        include: [
          { model: Tweet, include: [Reply, Like] }
        ]
      })
      if (!user) throw new Error("User didn't exist!")
      const result = user.Tweets.map(tweet => {
        return {
          tweetUserId: user.id,
          tweetUserAccount: user.account,
          tweetUserName: user.name,
          avatar: user.avatar,
          TweetId: tweet.id,
          description: tweet.description,
          createdAt: tweet.createdAt,
          repliedCount: tweet.Replies.length,
          likeCount: tweet.Likes.length,
          liked: req.user.LikedTweets ? req.user.LikedTweets.some(l => l.id === tweet.id) : false
        }
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      res.json(result)
    } catch (e) { next(e) }
  },

  getTopUsers: async (req, res, next) => {
    try {
      const users = await User.findAll({
        include: {
          model: User, as: 'Followers'
        }
      })
      const result = users.map(user => ({
          id: user.id,
          name: user.name,
          account: user.account,
          avatar: user.avatar,
          followerCount: user.Followers.length,
          isFollowing: req.user.Followings.some(f => f.id === user.id)
      }))
      .sort((a, b) => b.followerCount - a.followerCount)
      .slice(0, 10)
      res.json(result)
    } catch (e) { next(e) }
  },

  userFollowings: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id)
      if (!user) throw new Error("User didn't exist!")
      const targetUser = await User.findByPk(req.params.id,
        {
          include: [{ model: User, as: 'Followings' }]
        })
      const userFollowings = targetUser.Followings.map(following => {
        return {
          followingId: following.id,
          name: following.name,
          account: following.account,
          introduction: following.introduction,
          avatar: following.avatar,
          createdAt: following.createdAt,
          isFollowing: req.user.Followings ? req.user.Followings.some(f => f.id === following.id) : false
        }
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      if (userFollowings.length === 0) return res.json(userFollowings)
      res.json(userFollowings)
    } catch (e) { next(err) }
  },

  userFollowers: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id,
        {
          include: [{ model: User, as: 'Followers' }]
        })
      if (!user) throw new Error("User didn't exist!")
      const userFollowers = user.Followers.map(follower => {
        return {
          followerId: follower.id,
          name: follower.name,
          account: follower.account,
          introduction: follower.introduction,
          avatar: follower.avatar,
          createdAt: follower.createdAt,
          isFollowing: req.user.Followings ? req.user.Followings.some(f => f.id === follower.id) : false
        }
      })
      .sort((a, b) => b.createdAt - a.createdAt)

      res.json(userFollowers)
    } catch (e) { next(e) }
  },

  getReliedTweets: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id)
      if (!user) throw new Error("User didn't exist!")
      const replies = await Reply.findAll({
        where: { UserId: req.params.id },
        order: [['createdAt', 'DESC']],
        include: [
          { model: Tweet, include: User }
        ]
      })
      const result = replies.map(reply => {
        const repliedTweet = reply.Tweet
        return {
          commentId: reply.id,
          comment: reply.comment,
          tweetId: repliedTweet.id,
          description: repliedTweet.description,
          createdAt: repliedTweet.createdAt,
          tweetUserId: repliedTweet.User.id,
          tweetUserName: repliedTweet.User.name,
          tweetUserAccount: repliedTweet.User.account,
          tweetUserAvatar: repliedTweet.User.avatar,
          liked: req.user.LikedTweets ? req.user.LikedTweets.some(l => l.id === repliedTweet.id) : false,
          replyUserId: user.id,
          replyUserAccount: user.account,
          replyUserName: user.name,
          replyUserAvatar: user.avatar,
          replyTime: reply.createdAt
        }
      })
      res.json(result)
    } catch (e) { next(e) }
  },

  getLikes: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id)
      if (!user) throw new Error("User didn't exist!")
      const likes = await Like.findAll({
        where: { UserId: req.params.id },
        order: [['createdAt', 'DESC']],
        include: [{ model: Tweet, include: [User, Like, Reply] }]
      })
      const result = likes.map(like => {
        const tweet = like.Tweet
        return {
          likeCreatedAt: like.createdAt,
          TweetId: tweet.id,
          description: tweet.description,
          createdAt: tweet.createdAt,
          tweetUserId: tweet.User.id,
          tweetUserName: tweet.User.name,
          tweetUserAccount: tweet.User.account,
          avatar: tweet.User.avatar,
          repliedCount: tweet.Replies.length,
          likeCount: tweet.Likes.length,
          liked: req.user.LikedTweets ? req.user.LikedTweets.some(l => l.id === like.Tweet.id) : false
        }
      })
      res.json(result)
    } catch (e) { next(e) }
  },

  addFollow: async (req, res, next) => {
    try {
      const followerId = helpers.getUser(req).id
      const followingId = req.body.id
      const user = await User.findByPk(followingId)
      const followship = await Followship.findOne({ where: { followerId, followingId } })
      if (!user) throw new Error("User didn't exist!")
      if (followship) throw new Error('You are already following this user!')
      if (followerId == followingId) throw new Error("You can't follow yourself!")

      await Followship.create({
        followerId,
        followingId 
      })
      res.json({ status: 'success' })
    } catch (err) { next(err) }
  },

  removeFollow: async (req, res, next) => {
    try {
      const followingId = req.params.followingId
      const followerId = helpers.getUser(req).id
      const followship = await Followship.findOne({ where: { followerId, followingId } })
      if (!followship) throw new Error("You haven't followed this user!")
      await followship.destroy()
      res.json({ status: 'success' })
    } catch (err) { next(err) }
  }
}

module.exports = userController
