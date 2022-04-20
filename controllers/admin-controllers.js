const { User, Tweet, Like } = require('../models')
const jwt = require("jsonwebtoken")

const adminController = {
  login: (req, res, next) => {
    try {
      const errData = req.user.data;
      if (!errData) {
        const userData = req.user.toJSON()
        if (userData.role === 'admin') {
          delete userData.password;
          const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: "30d" })
          res.json({
            status: "success",
            data: {
              token,
              user: userData,
            }
          })
        } else { 
          throw new Error("You are not admin!")
        }
      } else {
        res.json(errData);
      }
    } catch (err) { next(err) }
  },

  getUsers: async (req, res, next) => {
    try{
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        include: [
          { model: Tweet, attributes: ['id'], include: { model: Like, attributes: ['id'] } },
          { model: User, as: 'Followings', attributes: ['id'] },
          { model: User, as: 'Followers', attributes: ['id'] }
        ]
      })
      const result = users.map(u => ({...u.toJSON()}))
      result.forEach(r => {
        r.TweetsCount = r.Tweets.length
        r.FollowingsCount = r.Followings.length
        r.FollowersCount = r.Followers.length
        r.TweetsLikedCount = r.Tweets.reduce((acc, tweet) => acc + tweet.Likes.length, 0)
        delete r.Tweets
        delete r.Followings
        delete r.Followers
      })
      result.sort((a, b) => {
      if (a.TweetsCount === b.TweetsCount) return (a.id - b.id)
      return (b.TweetsCount - a.TweetsCount)
      })
      res.json(result)
    } catch (e) { next(e) }
  },

  deleteTweet: async (req, res, next) => {
    try{
      const tweet = await Tweet.findByPk(req.params.id)
      if (!tweet) throw new Error("Tweet didn't exist!")
      await tweet.destroy()
      res.json({ status: 'success'})
    } catch(e) { next(e) }
  }
};

module.exports = adminController;
