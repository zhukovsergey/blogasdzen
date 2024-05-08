import { useContext, useState } from "react";
import { UserContext } from "../App";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { BlogContext } from "../pages/blog.page";

const CommentField = ({ action }) => {
  let {
    blog: {
      _id,
      author: { _id: blog_author },
    },
  } = useContext(BlogContext);
  let {
    userAuth: { access_token, username, fullname, profile_img },
  } = useContext(UserContext);
  const [comment, setComment] = useState("");

  const handleComment = () => {
    if (!access_token) {
      return toast.error("Вы не авторизованы");
    }
    if (!comment.length) {
      return toast.error("Вы не написали комментарий");
    }
    axios
      .post(
        import.meta.env.VITE_SERVER_DOMAIN + "/add-comment",
        {
          _id,
          blog_author,
          comment,
        },
        { headers: { Authorization: `Bearer ${access_token}` } }
      )
      .then(({ data }) => {
        setComment("");
        data.commented_by = {
          personal_info: { username, profile_img, fullname },
        };
        let newCommentArr
      })
      .catch((err) => {
        console.log(err);
      });
  };
  return (
    <>
      <Toaster />
      <textarea
        onChange={(e) => setComment(e.target.value)}
        value={comment}
        placeholder="Оставьте комментарий"
        className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
      ></textarea>
      <button onClick={handleComment} className="btn-dark mt-5 px-10">
        {action}
      </button>
    </>
  );
};

export default CommentField;
