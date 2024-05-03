import { useContext } from "react";
import { BlogContext } from "../pages/blog.page";

const BlogInteraction = () => {
  let {
    blog: {
      blog_id,
      activity,
      activity: { total_likes },
      author: {
        personal_info: { username: author_username },
      },
      setBlog,
    },
  } = useContext(BlogContext);
  return (
    <>
      <hr className="border-grey my-2" />
      <div className="flex gap-6">
        <div className="flex gap-3 items-center">
          <button className="w-10 h-10 rounded-full flex items-center jutify-center">
            <i className="fi fi-rr-heart"></i>
          </button>
        </div>
      </div>
      <hr className="border-grey my-2" />
    </>
  );
};

export default BlogInteraction;
