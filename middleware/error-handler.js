const generalErrorHandler = (err, req, res, next) => {
    if (err instanceof Error) {
        req.flash('error_messages', `${err.name}: ${err.message}`)
    } else {
        req.flash('error_messages', `${err}`)
    }
    res.redirect('back')
    next(err)
}

const apiErrorHandler = (err, req, res, next) => {
    if (err instanceof Error) {
        res.status(300).json({
            status: 'error',
            message: `${err.name}: ${err.message}`
            })
        } else {
            res.status(400).json({
                status: 'error',
                message: `${err}`
            })
        }
    next(err)
}


module.exports = {
    generalErrorHandler,
    apiErrorHandler
}