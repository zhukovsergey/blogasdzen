import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import Users from "./Schema/User.js";
import User from "./Schema/User.js";
import Blogs from "./Schema/Blog.js";
import { nanoid } from "nanoid";
import fs from "fs";
import jwt from "jsonwebtoken";
import cors from "cors";
import admin from "firebase-admin";
import serviceAccountKey from "./mern-blog-724b0-firebase-adminsdk-lvx2u-2581dc5138.json" assert { type: "json" };
import { getAuth } from "firebase-admin/auth";
import path from "path";
import fileUpload from "express-fileupload";
import { translit } from "./utils/translit.js";

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

const app = express();
dotenv.config();
app.use(express.json({ limit: "50mb" }));
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
//app.use("/uploads", express.static("uploads"));
app.use(express.static("uploads"));
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

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null)
    return res.status(401).json({ error: "No token provided" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user.id;
    next();
  });
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

app.post("/deletephoto", (req, res) => {
  console.log(req.body.path);
  fs.unlink(`./uploads/${req.body.path}`, (err) => {
    if (err) {
      return res.status(500).send({ msg: "Error occured" });
    } else {
      return res.status(200).send({ msg: "Photo deleted" });
    }
  });
});

app.post("/upload", (req, res) => {
  if (!req.files) {
    return res.status(500).send({ msg: "file is not found" });
  }

  const myFile = req.files.image;
  let myFileName = myFile.name.slice(0, myFile.name.lastIndexOf("."));
  const myFileExt = myFile.name.slice(myFile.name.lastIndexOf(".") + 1);
  console.log(myFileExt);
  let newMyfileName = new Date().getTime() + "." + myFileExt;

  // метод mv() помещает файл в папку public
  console.log(req.files.image);
  myFile.mv(`./uploads/${new Date().getMonth()}/${newMyfileName}`, (err) => {
    if (err) {
      console.log(err);
      return res.status(500).send({ msg: "Error occured" });
    }
  });
  return res.status(200).json({
    fileName: newMyfileName,
    path: "/" + new Date().getMonth() + "/" + newMyfileName,
  });
});

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

app.post("/search-users", async (req, res) => {
  let { query } = req.body;
  User.find({ "personal_info.username": new RegExp(query, "i") })
    .limit(50)
    .select(
      "personal_info.fullname personal_info.username personal_info.profile_img -_id"
    )
    .then((users) => {
      return res.status(200).json({ users });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.message });
    });
});

app.post("/search-blogs", async (req, res) => {
  let { tag, query, page } = req.body;

  let findQuery;
  if (tag) {
    findQuery = { tags: tag, draft: false };
  } else if (query) {
    findQuery = { draft: false, title: new RegExp(query, "i") };
  }
  let maxLimit = 5;
  Blogs.find(findQuery)
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id"
    )
    .sort({ publishedAt: -1 })
    .select("blog_id title banner des activity tags publishedAt -_id")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then((blogs) => {
      console.log(blogs);
      return res.status(200).json({ blogs });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

app.get("/trending-blogs", async (req, res) => {
  Blogs.find({ draft: false })
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id"
    )
    .sort({
      "activity.total_read": -1,
      "activity.total_likes": -1,
      publishedAt: -1,
    })
    .select("blog_id activity title publishedAt -_id")
    .limit(5)
    .then((blogs) => {
      return res.status(200).json({ blogs });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

app.post("/latest-blogs", async (req, res) => {
  let { page } = req.body;
  let maxLimit = 5;
  Blogs.find({ draft: false })
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id"
    )
    .sort({ publishedAt: -1 })
    .select("blog_id title banner des activity tags publishedAt -_id")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then((blogs) => {
      return res.status(200).json({ blogs });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

app.post("/all-latest-blogs-count", async (req, res) => {
  Blogs.countDocuments({ draft: false })
    .then((count) => {
      return res.status(200).json({ totalDocs: count });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.message });
    });
});

app.post("/search-blogs-count", async (req, res) => {
  let { tag, query } = req.body;
  let findQuery;
  if (tag) {
    findQuery = { tags: tag, draft: false };
  } else if (query) {
    findQuery = { draft: false, title: new RegExp(query, "i") };
  }
  Blogs.countDocuments(findQuery)
    .then((count) => {
      return res.status(200).json({ totalDocs: count });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.message });
    });
});

app.post("/create-blog", verifyJWT, (req, res) => {
  let authorId = req.user;
  let { title, des, banner, tags, content, draft } = req.body;
  if (!title.length) {
    return res.status(403).json({ error: "Заголовок не может быть пустым" });
  }

  if (!draft) {
    if (!des.length || des.length > 200) {
      return res.status(403).json({
        error: "Описание не может быть пустым или больше 200 символов",
      });
    }
    if (!banner.length) {
      return res.status(403).json({ error: "Главное  не может быть пустым" });
    }
    if (!content.blocks.length) {
      return res.status(403).jsob({ error: "Контент не может быть пустым" });
    }
    if (!tags.length || tags.length > 10) {
      return res
        .status(403)
        .json({ error: "Добавьте хоть 1 тег. Тегов не должно быть больше 10" });
    }
  }

  tags = tags.map((tag) => tag.toLowerCase());
  let blog_id =
    translit(req.body.title)
      .replace(/[^a-zA-Z0-9]/g, " ")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .trim() + nanoid(3);

  let blog = new Blogs({
    title,
    des,
    banner,
    content,
    tags,
    author: authorId,
    blog_id,
    draft: Boolean(draft),
  });

  blog
    .save()
    .then((blog) => {
      let incrementVal = draft ? 0 : 1;
      User.findOneAndUpdate(
        { _id: authorId },
        {
          $inc: { "account_info.total_posts": incrementVal },
          $push: { blogs: blog._id },
        }
      )
        .then((user) => {
          return res.status(200).json({ id: blog.blog_id });
        })
        .catch((err) => {
          res.status(500).json({ error: err.message });
        });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
