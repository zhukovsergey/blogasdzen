import { useContext } from "react";
import AnimationWrapper from "../common/page-animation";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import Tag from "./tags.component";
import { UserContext } from "../App";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PublishForm = () => {
  let characterLimit = 200;
  let tagLimit = 10;
  let {
    blog,
    blog: { title, banner, content, tags, des },
    setEditorState,
    setBlog,
  } = useContext(EditorContext);
  let navigate = useNavigate();
  let {
    userAuth: { access_token },
  } = useContext(UserContext);
  const handleCloseEvent = () => {
    setEditorState("editor");
  };
  const handleBlogTitleChange = (e) => {
    let input = e.target;
    setBlog({ ...blog, title: input.value });
  };
  const handleBlogDesChange = (e) => {
    let input = e.target;
    setBlog({ ...blog, des: input.value });
  };
  const handleTitleKeyDown = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
    }
  };
  const handleKeyDown = (e) => {
    if (e.keyCode == 13 || e.keyCode == 188) {
      e.preventDefault();
      let tag = e.target.value;
      if (tags.length < tagLimit) {
        if (!tags.includes(tag) && tag.length) {
          setBlog({ ...blog, tags: [...tags, tag] });
        }
      } else {
        toast.error(`Достигнуто максимальное количество тегов ${tagLimit}`);
      }
    }
  };

  const publishBlog = (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }
    if (!title.length) {
      return toast.error("Заголовок не может быть пустым");
    }
    if (!des.length || des.length > characterLimit) {
      return toast.error(
        `Описание не может быть пустым или больше ${characterLimit} символов`
      );
    }
    if (!tags.length) {
      return toast.error(
        `Добавьте хоть 1 тег. Тегов не должно быть больше ${tagLimit}`
      );
    }
    if (!banner.length) {
      return toast.error("Загрузите главное фото");
    }
    let loadingToast = toast.loading("Загрузка...🙂");
    e.target.classList.add("disable");
    let blogObj = {
      title,
      banner,
      content,
      tags,
      des,
      draft: false,
    };
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog", blogObj, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      .then(() => {
        e.target.classList.remove("disable");
        toast.dismiss(loadingToast);
        toast.success("Запись успешно создана 👍");
        setTimeout(() => {
          navigate("/");
        }, 500);
      })
      .catch(({ response }) => {
        e.target.classList.remove("disable");
        toast.dismiss(loadingToast);
        return toast.error(response.data.error);
      });
  };
  return (
    <AnimationWrapper>
      <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4">
        <Toaster />
        <button
          className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]"
          onClick={handleCloseEvent}
        >
          <i className="fi fi-br-cross"></i>
        </button>
        <div className="max-w-[550px] center">
          <p className="text-dark-grey">Предпросмотр</p>
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
            <img src={`http://localhost:3000` + banner}></img>
          </div>
          <h1 className="text-4xl font-medium mt-2 leading-tight line-clamp-3">
            {title}
          </h1>
          <p className="font-gelasio line-clamp-3 text-xl leading-7 mt-4">
            {" "}
            {des}
          </p>
        </div>
        <div className="border-grey lg:border-1 lg:pl-8">
          <p className="text-dark-grey mb-2 mt-9">Заголовок записи</p>
          <input
            type="text"
            value={title}
            placeholder="Заголовок записи"
            defautvalue={title}
            className="input-box pl-4"
            onChange={handleBlogTitleChange}
          />
          <p className="text-dark-grey mb-2 mt-9">Короткое описание</p>
          <textarea
            maxLength={characterLimit}
            defaultValue={des}
            className="h-40 resize-none leading-7 input-box pl-4"
            onChange={handleBlogDesChange}
            onKeyDown={handleTitleKeyDown}
          ></textarea>
          <p className="mt-1 text-dark-grey text-sm text-right">
            {characterLimit - des.length} символов осталось (максимум 200)
          </p>
          <p className="text-dark-grey mb-2 mt-9">
            {" "}
            Тэги позволяют искать пользователям ваши записи
          </p>
          <div className="relative input-box pl-2 py-2 pb-4">
            <input
              type="text"
              placeholder="Тэги"
              className="sticky input-box bg-white top-0 left-0 pl-4 mb-3 focus:bg-white"
              onKeyDown={handleKeyDown}
            />
            {tags.map((tag, i) => {
              return <Tag tag={tag} tagIndex={i} key={i} />;
            })}
          </div>
          <p className="mt-1 mb-4 text-dark-grey text-right text-sm">
            {" "}
            Еще можно добавить {tagLimit - tags.length}
          </p>
          <button className="btn-dark px-8" onClick={publishBlog}>
            Опубликовать
          </button>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default PublishForm;
