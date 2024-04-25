import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import Users from "./Schema/User.js";
import User from "./Schema/User.js";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";
import admin from "firebase-admin";
import serviceAccountKey from "./mern-blog-724b0-firebase-adminsdk-lvx2u-2581dc5138.json" assert { type: "json" };
import { getAuth } from "firebase-admin/auth";

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

const app = express();
dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

mongoose.connect("mongodb://localhost:27017/blogasdzen", {
  autoIndex: true,
});

mongoose.connection.on("connected", () => {
  console.log("Mongoose default connection open to blogasdzen");
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});
const generateUSername = async (email) => {
  let username = email.split("@")[0];
  let isUsernameNotUnique = await User.exists({
    "personal_info.username": username,
  }).then((result) => result);
  isUsernameNotUnique ? (username += nanoid().substring(0, 5)) : "";
  return username;
};

const formatDatatoSend = (user) => {
  const access_token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  return {
    access_token,
    _id: user._id,
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
  };
};

app.post("/signup", async (req, res) => {
  let { email, password, fullname } = req.body;
  if (fullname.length < 3) {
    res
      .status(400)
      .json({ error: "Полное имя должно быть больше трех символов" });
  }
  if (password.length < 6) {
    res
      .status(400)
      .json({ error: "Пароль должен быть больше шестей символов" });
  }
  if (!email.includes("@")) {
    res.status(400).json({ error: "Некорректный email" });
  }
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Некорректный email" });
  }
  if (!passwordRegex.test(password)) {
    res.status(400).json({
      error:
        "Некорректный пароль. Пароль должен быть больше шестей символов, содержать строчные и прописные буквы и содержать цифры ",
    });
  }
  let username = await generateUSername(email);
  try {
    const newUser = await Users.create({
      personal_info: {
        fullname,
        email,
        username,
        password: bcryptjs.hashSync(password, 10),
      },
    });

    res.status(201).json(formatDatatoSend(newUser));
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      res
        .status(400)
        .json({ error: "Пользователь с таким email уже существует" });
    }
    console.log(error);
  }
});

app.post("/signin", async (req, res) => {
  let { email, password } = req.body;
  User.findOne({ "personal_info.email": email })
    .then((user) => {
      if (!user) {
        return res.json({ status: "error", error: "User not found" });
      }
      if (!user.google_auth) {
        bcryptjs.compare(
          password,
          user.personal_info.password,
          (err, result) => {
            if (err) {
              return res.status(403).json({ status: "error", error: err });
            }
            if (!result) {
              return res.status(403).json({ error: "Wrong password" });
            } else {
              return res.status(200).json(formatDatatoSend(user));
            }
          }
        );
      } else {
        return res
          .status(403)
          .json({ error: "Аккаунт создан через Гугл. Войдите через Гугл" });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.json({ status: "error", error: "User not found" });
    });
});

app.post("/google-auth", async (req, res) => {
  let { access_token } = req.body;
  getAuth()
    .verifyIdToken(access_token)
    .then(async (decodedUser) => {
      let { email, name, picture } = decodedUser;
      picture = picture.replace("s96-c", "s384-c");
      let user = await User.findOne({ "personal_info.email": email })
        .select("personal_info.username personal_info.profile_img google_auth")
        .then((u) => {
          return u || null;
        })
        .catch((err) => {
          console.log(err);
        });
      if (user) {
        if (!user.google_auth) {
          return res.status(403).json({
            error:
              "Эта почта уже была зарегистрирована через Гугл. Войдите через пароль",
          });
        }
      } else {
        let username = await generateUSername(email);
        user = new User({
          personal_info: {
            fullname: name,
            email,
            username,
            profile_img: picture,
          },
          google_auth: true,
        });
        await user
          .save()
          .then((u) => {
            user = u;
          })
          .catch((err) => {
            console.log(err);
            return res.status(500).json({ error: err.message });
          });
      }
      return res.status(200).json(formatDatatoSend(user));
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.message });
    });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});