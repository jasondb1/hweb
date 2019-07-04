const	express = require('express');
const	usersRouter = new express.Router();
const	usersCtrl = require('../controllers/users.js');
const	verifyToken = require('../serverAuth.js').verifyToken;

usersRouter.route('/')
	.get(usersCtrl.index)
	.post(usersCtrl.create);

usersRouter.post('/authenticate', usersCtrl.authenticate);


usersRouter.use(verifyToken);
usersRouter.route('/:id')
	.get(usersCtrl.show)
	.patch(usersCtrl.update)
	.delete(usersCtrl.destroy);

module.exports = usersRouter;
