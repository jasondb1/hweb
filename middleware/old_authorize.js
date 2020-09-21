const jwt = require('express-jwt');
//const db = require('_helpers/db');
const secret = process.env.JWT_SECRET;
const db = require('../models/Sequelize.js');




// authorize = async (req, res, next) => {
//     console.log ("authorizing...");
//     console.log(req);

//       let token = req.headers["x-access-token"];
//     //token = jwt({ secret, algorithms: ['HS256'] });

//   if (!token) {
//     return res.status(403).send({
//       message: "No token provided!"
//     });
//   }
    
//     // authenticate JWT token and attach decoded token to request as req.user
 

//             // get user with id from token 'sub' (subject) property
//             const user = await db.user.findByPk(req.user.sub);

//             // check user still exists
//             if (!user)
//                 return res.status(401).json({ message: 'Unauthorized' });

//                // authorization successful
//             req.user = user.get();
//             next();

//         // attach full user record to request object
     
 

//    return;
        
 


 
function authorize() {
    return [
        // authenticate JWT token and attach decoded token to request as req.user
        jwt({ secret, algorithms: ['HS256'] }),

        // attach full user record to request object
        async (req, res, next) => {
            // get user with id from token 'sub' (subject) property
            const user = await db.user.findByPk(req.user.sub);

            // check user still exists
            if (!user)
                return res.status(401).json({ message: 'Unauthorized' });

            // authorization successful
            req.user = user.get();
            next();
        }
    ];
}

module.exports = authorize;