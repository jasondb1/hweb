const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;
const db = require("../models/Sequelize.js");
const User = db.User;

verifyToken = (req, res, next) => {

    //console.log("verify token");
    //console.log(req.headers);
    //let token = req.headers["x-access-token"];
    let token = req.headers.token;
    //console.log(token);

    if (!token) {
        return res.status(403).json({ message: 'No Token Provided' }); 
    }

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(401).send({
                message: "Unauthorized!"
            });
        }
        req.userId = decoded.id;
        console.log("[Need to add additional check here - decoded id");
        console.log (decoded);

        User.findByPk(decoded.id, (err, user) => {
            // if no user, deny access
            if (!user) return res.json({success: false, message: "Invalid token."});
            console.log("User");
            console.log(user);
            // otherwise, add user to req object
            req.user = user;
            // go on to process the route:
            next();
        })


        //TODO: check if user exists?
        next();
    });
};


//TODO: rework this for admin
isAdmin = (req, res, next) => {
    //   User.findByPk(req.userId).then(user => {
    //     user.getRoles().then(roles => {
    //       for (let i = 0; i < roles.length; i++) {
    //         if (roles[i].name === "admin") {
    //           next();
    //           return;
    //         }
    //   User.findByPk(req.userId).then(user => {
    //     user.getRoles().then(roles => {
    //       for (let i = 0; i < roles.length; i++) {
    //         if (roles[i].name === "admin") {
    next();
    return;
    //     }

    //   }

    //  res.status(403).send({
    //         message: "Require Admin Role!"
    //       });
    //       return;
    //     });
    //   });
};

//TODO: rework this for moderator
isModerator = (req, res, next) => {
    User.findByPk(req.userId).then(user => {
        user.getRoles().then(roles => {
            for (let i = 0; i < roles.length; i++) {
                if (roles[i].name === "moderator") {
                    next();
                    return;
                }
            }

            res.status(403).send({
                message: "Require Moderator Role!"
            });
        });
    });
};

isModeratorOrAdmin = (req, res, next) => {
    User.findByPk(req.userId).then(user => {
        user.getRoles().then(roles => {
            for (let i = 0; i < roles.length; i++) {
                if (roles[i].name === "moderator") {
                    next();
                    return;
                }

                if (roles[i].name === "admin") {
                    next();
                    return;
                }
            }

            res.status(403).send({
                message: "Require Moderator or Admin Role!"
            });
        });
    });
};

const authJwt = {
    verifyToken: verifyToken,
    isAdmin: isAdmin,
    isModerator: isModerator,
    isModeratorOrAdmin: isModeratorOrAdmin
};
module.exports = authJwt;