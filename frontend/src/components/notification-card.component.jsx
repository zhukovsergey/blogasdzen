import { Link } from "react-router-dom";
import { getDay } from "../common/date";
import { useContext, useState } from "react";
import NotificationCommentField from "./notification-comment-field.component";
import { UserContext } from "../App";

const NotificationCard = ({ data, index, notificationState }) => {
  let [isReplying, setReplying] = useState(false);
  let {
    type,
    reply,
    comment,
    createdAt,
    replied_on_comment,
    user,
    user: {
      personal_info: { fullname, username, profile_img },
    },
    blog: { _id, blog_id, title },
    _id: notification_id,
  } = data;

  let {
    userAuth: {
      username: author_username,
      profile_img: author_profile_img,
      access_token,
    },
  } = useContext(UserContext);

  const handleReplyClick = () => {
    setReplying((preVal) => !preVal);
  };
  return (
    <div className="p-6 border-b border-grey border-l-black">
      <div className="flex gap-5 mb-3">
        <img className="w-14 h-14 flex-none rounded-full" src={profile_img} />
        <div className="w-full">
          <h1 className="font-medium text-xl text-dark-grey">
            <span className="lg:inline-block hidden capitalize">
              {fullname}
            </span>
            <Link
              className="mx-1 underline text-black"
              to={`/user/${username}`}
            >
              @{username}
            </Link>
            <span className="font-normal">
              {type == "like"
                ? " Лайкнул ваш пост"
                : type == "comment"
                ? " Написал комментарий"
                : " Ответил на ваш комментарий"}
            </span>
          </h1>
          {type == "reply" ? (
            <div className="p-4 mt-4 rounded-md bg-grey">
              <p>{replied_on_comment.comment}</p>
            </div>
          ) : (
            <Link
              className="font-medium text-dark-grey hover:underline line-clamp-1"
              to={`/blog/${blog_id}`}
            >{`"${title}"`}</Link>
          )}
        </div>
      </div>
      {type !== "like" ? (
        <p className="ml-14 pl-5 font-gelasio text-xl my-5">
          {comment.comment}
        </p>
      ) : (
        ""
      )}
      <div className="ml-14 pl-5 mt-3 text-dark-grey flex gap-8 ">
        <p>{getDay(createdAt)}</p>

        {type !== "like" ? (
          <>
            {!reply ? (
              <button
                className="underline hover:text-black"
                onClick={handleReplyClick}
              >
                {" "}
                Ответить
              </button>
            ) : (
              ""
            )}
            <button className="underline hover:text-black">Удалить</button>
          </>
        ) : (
          ""
        )}
      </div>
      {isReplying ? (
        <div className="mt-8">
          <NotificationCommentField
            _id={_id}
            blog_author={user}
            index={index}
            replyingTo={comment._id}
            setReplying={setReplying}
            notification_id={notification_id}
            notificationData={notificationState}
          />
        </div>
      ) : (
        ""
      )}

      {reply ? (
        <div className="ml-20 p-5 bg-grey mt-5 rounded-md">
          <div className="flex gap-3 mb-3">
            <img src={author_profile_img} className="w-8 h-8 rounded-full" />
            <div>
              <h1 className="fonr-medium text-xl text-dark-grey">
                <Link
                  className="mx-1 text-black underline "
                  to={`/user/${author_username}`}
                >
                  {author_username}
                </Link>
                <span className="font-normal">Ответ на </span>
                <Link
                  className="mx-1 text-black underline "
                  to={`/user/${username}`}
                >
                  {username}
                </Link>
              </h1>
            </div>
          </div>
          <p className="ml-14 font-gelasio text-xl my-2">{reply.comment}</p>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export default NotificationCard;
