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
import Notification from "./Schema/Notification.js";
import Comment from "./Schema/Comment.js";

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

  let newMyfileName = new Date().getTime() + "." + myFileExt;

  // метод mv() помещает файл в папку public

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

app.post("/change-password", verifyJWT, (req, res) => {
  let { currentPassword, newPassword } = req.body;
  if (!currentPassword.length || !newPassword.length) {
    return res.status(403).json({ error: "Заполните все поля" });
  }
  if (
    !passwordRegex.test(currentPassword) ||
    !passwordRegex.test(newPassword)
  ) {
    return res.status(403).json({
      error:
        "Некорректный пароль. Пароль должен содеражать строчные и прописные буквы и содержать цифры",
    });
  }
  User.findOne({ _id: req.user })
    .then((user) => {
      if (user.google_auth) {
        return res
          .status(403)
          .json({ error: "Аккаунт создан через Гугл. Войдите через Гугл" });
      }
      bcryptjs.compare(
        currentPassword,
        user.personal_info.password,
        (err, result) => {
          if (err) {
            return res.status(403).json({ error: "Wrong password" });
          }
          if (!result) {
            return res.status(403).json({ error: "Wrong password" });
          }
          bcryptjs.hash(newPassword, 10, (err, hash) => {
            User.findOneAndUpdate(
              { _id: req.user },
              { "personal_info.password": hash }
            )
              .then((u) => {
                return res.status(200).json({ status: "Успешно изменен" });
              })
              .catch((err) => {
                console.log(err);
                return res.status(500).json({ status: "error", error: err });
              });
          });
        }
      );
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ status: "error", error: err });
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

app.post("/get-profile", async (req, res) => {
  let { username } = req.body;
  User.findOne({ "personal_info.username": username })
    .select("-personal_info.password -google_auth -updatedAt -blogs")
    .then((user) => {
      res.status(200).json(user);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err.message });
    });
});

app.post("/search-blogs", async (req, res) => {
  let { tag, query, page, author, limit, eliminate_blog } = req.body;

  let findQuery;
  if (tag) {
    findQuery = { tags: tag, draft: false, blog_id: { $ne: eliminate_blog } };
  } else if (query) {
    findQuery = { draft: false, title: new RegExp(query, "i") };
  } else if (author) {
    findQuery = { author, draft: false };
  }
  let maxLimit = limit ? limit : 5;
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
  let { tag, query, author } = req.body;
  let findQuery;
  if (tag) {
    findQuery = { tags: tag, draft: false };
  } else if (query) {
    findQuery = { draft: false, title: new RegExp(query, "i") };
  } else if (author) {
    findQuery = { author, draft: false };
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

app.post("/get-blog", async (req, res) => {
  let { blog_id, draft, mode } = req.body;
  let incrementVal = mode !== "edit" ? 1 : 0;
  Blogs.findOneAndUpdate(
    { blog_id },
    { $inc: { "activity.total_reads": incrementVal } }
  )
    .populate(
      "author",
      "personal_info.fullname personal_info.username personal_info.profile_img"
    )
    .select(" title des content banner activity publishedAt blog_id tags ")
    .then((blog) => {
      User.findOneAndUpdate(
        {
          "personal_info.username": blog.author.personal_info.username,
        },
        {
          $inc: { "account_info.total_reads": incrementVal },
        }
      ).catch((err) => {
        res.status(500).json({ error: err.message });
      });

      if (blog.draft && !draft) {
        return res
          .status(500)
          .json({ error: "У вас нет доступа к черновикам" });
      }
      return res.status(200).json({ blog });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

app.post("/create-blog", verifyJWT, (req, res) => {
  let authorId = req.user;
  let { title, des, banner, tags, content, draft, id } = req.body;
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
    id ||
    translit(req.body.title)
      .replace(/[^a-zA-Z0-9]/g, " ")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .trim() + nanoid(3);
  if (id) {
    Blogs.findOneAndUpdate(
      { blog_id },
      { title, des, banner, content, tags, draft: draft ? draft : false }
    )
      .then(() => {
        return res.status(200).json({ id: blog_id });
      })
      .catch((err) => {
        return res
          .status(500)
          .json({ error: "Failed to update total posts number" });
      });
  } else {
    let blog = new Blogs({
      title,
      des,
      banner,
      content,
      tags,
      author: authorId,
      blog_id: blog_id.toLowerCase(),
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
  }
});

app.post("/like-blog", verifyJWT, (req, res) => {
  let user_id = req.user;

  let { _id, islikedByUser } = req.body;
  let incrementVal = !islikedByUser ? 1 : -1;
  Blogs.findOneAndUpdate(
    { _id },
    { $inc: { "activity.total_likes": incrementVal } }
  ).then((blog) => {
    if (!islikedByUser) {
      let like = new Notification({
        type: "like",
        blog: _id,
        notification_for: blog.author,
        user: user_id,
      });

      like.save().then((notification) => {
        return res.status(200).json({ liked_by_user: true });
      });
    } else {
      Notification.findOneAndDelete({
        user: user_id,
        blog: _id,
        type: "like",
      })
        .then((data) => {
          return res.status(200).json({ liked_by_user: false });
        })
        .catch((err) => {
          return res.status(500).json({ error: err.message });
        });
    }
  });
});

app.post("/isliked-by-user", verifyJWT, (req, res) => {
  let user_id = req.user;
  let { _id } = req.body;
  Notification.exists({ user: user_id, blog: _id, type: "like" })
    .then((result) => {
      return res.status(200).json({ result });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

app.post("/add-comment", verifyJWT, (req, res) => {
  let user_id = req.user;
  let { _id, comment, blog_author, replying_to, notification_id } = req.body;

  if (!comment.length) {
    return res.status(403).json({ error: "Комментарий не может быть пустым" });
  }

  let commentObj = {
    blog_id: _id,
    blog_author,
    comment,
    commented_by: user_id,
  };

  if (replying_to) {
    commentObj.parent = replying_to;
    commentObj.isReply = true;
  }

  new Comment(commentObj).save().then(async (commentFile) => {
    let { comment, commentedAt, children } = commentFile;

    Blogs.findOneAndUpdate(
      { _id },
      {
        $push: { comments: commentFile._id },
        $inc: {
          "activity.total_comments": 1,
          "activity.total_parent_comments": replying_to ? 0 : 1,
        },
      }
    )
      .then((blog) => {
        console.log(blog);
      })
      .catch((err) => {
        console.log(err);
      });
    let notificationObj = {
      type: replying_to ? "reply" : "comment",
      blog: _id,
      notification_for: blog_author,
      user: user_id,
      comment: commentFile._id,
    };

    if (replying_to) {
      notificationObj.replied_on_comment = replying_to;
      await Comment.findOneAndUpdate(
        { _id: replying_to },
        { $push: { children: commentFile._id } }
      ).then((replyingToCommentDoc) => {
        notificationObj.notification_for = replyingToCommentDoc.commented_by;
      });
      if (notification_id) {
        Notification.findOneAndUpdate(
          { _id: notification_id },
          { reply: commentFile._id }
        ).then((notification) => console.log("notification updated"));
      }
    }
    new Notification(notificationObj)
      .save()
      .then((notification) => {
        console.log("new notification");
      })
      .catch((err) => {
        console.log(err);
      });
    return res.status(200).json({
      comment,
      commentedAt,
      _id: commentFile._id,
      user_id,
      children,
    });
  });
});

app.post("/get-blog-comments", (req, res) => {
  let { blog_id, skip } = req.body;

  let maxLimit = 5;

  Comment.find({ blog_id, isReply: false })
    .populate(
      "commented_by",
      "personal_info.username personal_info.fullname personal_info.profile_img"
    )
    .skip(skip)
    .limit(maxLimit)
    .sort({ commentedAt: -1 })
    .then((comment) => {
      return res.status(200).json(comment);
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

app.post("/get-replies", (req, res) => {
  let { _id, skip } = req.body;

  let maxLimit = 5;
  Comment.findOne({ _id })
    .populate({
      path: "children",
      option: {
        limit: maxLimit,
        skip: skip,
        sort: { commentedAt: -1 },
      },
      populate: {
        path: "commented_by",
        select:
          "personal_info.profile_img personal_info.username personal_info.fullname",
      },
      select: "-blog_id -updatedAt",
    })
    .select("children")
    .then((doc) => {
      console.log(doc);
      return res.status(200).json({ replies: doc.children });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

const deleteComments = (_id) => {
  Comment.findOneAndDelete({ _id })
    .then((comment) => {
      if (comment.parent) {
        Comment.findOneAndUpdate(
          { _id: comment.parent },
          { $pull: { children: _id } }
        )
          .then((data) => console.log("comment delete from parent"))
          .catch((err) => console.log(err));
      }
      Notification.findOneAndDelete({ comment: _id }).then((notification) =>
        console.log("comment notification deleted")
      );
      Notification.findOneAndDelete({ reply: _id }).then((notification) => {
        console.log("reply notification deleted");
      });
      Blogs.findOneAndUpdate(
        { _id: comment.blog_id },
        {
          $pull: { comments: _id },
          $inc: {
            "activity.total_comments": -1,
            "activity.total_parent_comments": comment.parent ? 0 : -1,
          },
        }
      ).then((comment) => {
        if (comment.children?.length) {
          comment.children.map((replies) => {
            deleteComments(replies);
          });
        }
      });
      if (comment.children?.length) {
        comment.children.map((replies) => {
          deleteComments(replies);
        });
      }
    })
    .catch((err) => console.log(err));
};

app.post("/delete-comment", verifyJWT, (req, res) => {
  let user_id = req.user;
  let { _id } = req.body;
  Comment.findOne({ _id }).then((comment) => {
    if (user_id == comment.commented_by || user_id == comment.blog_author) {
      deleteComments(_id);
      return res.status(200).json({ success: "Комментарий удален" });
    } else {
      return res.status(403).json({ error: "Невозможно удалить комментарий" });
    }
  });
});

app.post("/update-profile", verifyJWT, (req, res) => {
  let { username, bio, social_links } = req.body;
  let bioLimit = 200;
  if (username.length < 3) {
    return res
      .status(403)
      .json({ error: "Имя пользователя должно содержать не менее 3 символов" });
  }
  if (bio.length > bioLimit) {
    return res
      .status(403)
      .json({ error: "Поле О себе должно содержать не более 200 символов" });
  }
  let socialLinksArr = Object.keys(social_links);

  try {
    for (let i = 0; i < socialLinksArr.length; i++) {
      if (social_links[socialLinksArr[i]].length) {
        let hostname = new URL(social_links[socialLinksArr[i]]).hostname;
        if (
          !hostname.includes(`${socialLinksArr[i]}.com`) &&
          socialLinksArr[i] !== "website"
        ) {
          return res
            .status(403)
            .json({ error: "Неверная ссылка" + socialLinksArr[i] });
        }
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
  let updateObj = {
    "personal_info.username": username,
    "personal_info.bio": bio,
    social_links,
  };
  User.findOneAndUpdate({ _id: req.user }, updateObj, {
    runValidators: true,
  })
    .then(() => {
      return res.status(200).json({ username });
    })
    .catch((err) => {
      if (err.code == 11000) {
        return res
          .status(403)
          .json({ error: "Такое имя пользователя уже существует" });
      }
      return res.status(500).json({ error: err.message });
    });
});

app.post("/update-profile-img", verifyJWT, (req, res) => {
  let { url } = req.body;
  User.findOneAndUpdate({ _id: req.user }, { "personal_info.profile_img": url })
    .then(() => {
      return res.status(200).json({ profile_img: url });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

app.get("/new-notification", verifyJWT, (req, res) => {
  let user_id = req.user;
  Notification.exists({
    notification_for: user_id,
    seen: false,
    user: { $ne: user_id },
  })
    .then((result) => {
      if (result) {
        return res.status(200).json({ new_notification_available: true });
      } else {
        return res.status(200).json({ new_notification_available: false });
      }
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

app.post("/notifications", verifyJWT, (req, res) => {
  let user_id = req.user;
  let { page, filter, deletedDocCount } = req.body;
  let maxLimit = 10;

  let findQuery = { notification_for: user_id, user: { $ne: user_id } };
  let skipDocs = (page - 1) * maxLimit;

  if (filter !== "Все") {
    findQuery.type = filter;
  }
  if (filter == "Лайки") {
    findQuery.type = "like";
  }
  if (filter == "Комментарии") {
    findQuery.type = "comment";
  }
  if (filter == "Ответы") {
    findQuery.type = "reply";
  }
  if (deletedDocCount) {
    skipDocs = deletedDocCount;
  }

  Notification.find(findQuery)
    .skip(skipDocs)
    .limit(maxLimit)
    .populate("blog", "title blog_id")
    .populate(
      "user",
      "personal_info.fullname personal_info.username personal_info.profile_img"
    )
    .populate("comment", "comment")
    .populate("replied_on_comment", "comment")
    .populate("reply", "comment")
    .sort({ created_at: -1 })
    .select("createdAt type seen reply")
    .then((notifications) => {
      return res.status(200).json({ notifications });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

app.post("/all-notifications-count", verifyJWT, (req, res) => {
  let user_id = req.user;
  console.log(user_id);
  let { filter } = req.body;
  let findQuery = { notification_for: user_id, user: { $ne: user_id } };
  if (filter !== "Все") {
    findQuery.type = filter;
  }
  if (filter == "Лайки") {
    findQuery.type = "like";
  }
  if (filter == "Комментарии") {
    findQuery.type = "comment";
  }
  if (filter == "Ответы") {
    findQuery.type = "reply";
  }
  Notification.countDocuments(findQuery)
    .then((count) => {
      console.log(count);
      return res.status(200).json({ totalDocs: count });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
