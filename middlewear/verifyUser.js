import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import {
  accessTokenOptions,
  generateAccessAndRefreshToken,
  refreshTokenOptions,
} from "../controllers/userController.js";

export const verifyUser = async (req, res, next) => {
  try {
    const access = req.cookies.accessToken;
    const refresh = req.cookies.refreshToken;
    // console.log("Access Token:", access);
    // console.log("Refresh Token:", refresh);

    if (!access && !refresh) {
      return res.status(401).send("UnAuthorized request..");
    }

    if (!access) {
      const refreshTokenDetails = jwt.verify(
        refresh,
        process.env.REFRESH_TOKEN_SECRET
      );

      if (!refreshTokenDetails)
        return res.send(401).send("Invalid Refresh token...");

      const refreshTokenUser = await User.findById(refreshTokenDetails._id);
      // console.log("refreshTokenUser", refreshTokenUser);

      if (!refreshTokenUser) return res.status(404).send("No user found!");

      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        refreshTokenUser._id
      );

      // console.log("Access Token in refresh:", accessToken);
      // console.log("Refresh Token in refresh:", refreshToken);

      res.cookie("accessToken", accessToken, accessTokenOptions);
      res.cookie("refreshToken", refreshToken, refreshTokenOptions);

      req.valideUser = refreshTokenUser;
      next();
    }

    const accessTokenDetails = jwt.verify(
      access,
      process.env.ACCESS_TOKEN_SECRET
    );

    if (!accessTokenDetails)
      return res.status(401).send("Invalid Access token ...");

    const accessTokenUser = await User.findById(accessTokenDetails._id);
    // console.log("accessTokenUser", accessTokenUser)

    if (!accessTokenUser) return res.status(404).send("No user found!");

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      accessTokenUser._id
    );

    // console.log("Access Token in access:", accessToken);
    // console.log("Refresh Token in access:", refreshToken);
    res.cookie("accessToken", accessToken, accessTokenOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenOptions);
    req.valideUser = accessTokenUser;
    next();
  } catch (error) {
    console.error("Error in token verification:", error);
    return res
      .status(401)
      .send("Unauthorized request: Token verification failed.");
  }
};
