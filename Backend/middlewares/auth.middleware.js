import jwt from "jsonwebtoken";
// import redisClient from "../services/redis.service.js";


export const authUser = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization.split(' ')[ 1 ];

        if (!token) {
            return res.status(401).send({ error: 'Unauthorized User trail 1' });
        }

        const isBlackListed = false;

        console.log("Blacklisted Token Check:", isBlackListed); // Debugging log


        if (isBlackListed) {

            res.cookie('token', '');

            return res.status(401).send({ error: 'Unauthorized User trial 2' });
        }

   jwt.verify(token, process.env.JWT_SECRET,(err, decoded)=>{
    if (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Session expired. Please log in again." });
        }
        return res.status(403).json({ message: "Invalid token." });
    }
        req.user = decoded;
        next();
   });
        
    } catch (error) {

        console.log(error);

        res.status(401).send({ error: 'Unauthorized User trial 3' });
    }
}