import { Link } from "react-router-dom";
import logo from "../imgs/logo.png";
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import axios from "axios";
import fileUpload from "../common/aws";
import deletePhoto from "../common/deletePhoto";
import { Toaster, toast } from "react-hot-toast";

import { useContext, useState } from "react";
import { EditorContext } from "../pages/editor.pages";

const BlogEditor = () => {
  let {
    blog,
    blog: { title, banner, content, tags, des },
    setBlog,
  } = useContext(EditorContext);
  const [url, setUrl] = useState({});
  const [image, setImage] = useState({
    preview: "",
    raw: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
  };
  console.log(blog);
  const handleBannerUpload = async (e) => {
    if (e.target.files.length) {
      setImage({
        preview: URL.createObjectURL(e.target.files[0]),
        raw: e.target.files[0],
      });
    }
    if (e.target.files[0]) {
      let loadingToast = toast.loading("Загрузка...");
      await fileUpload(e.target.files[0]).then((res) => {
        console.log(res);
        setUrl(res.path);
        setBlog({ ...blog, banner: res.path });
      });
      toast.dismiss(loadingToast);
      toast.success("Фото загружено");
    }
  };
  const handleDeletePhoto = async (e) => {
    e.preventDefault();
    await deletePhoto(url);
    setUrl({});
    setImage({
      preview: "",
      raw: "",
    });
    setBlog({ ...blog, banner: "" });
    toast.success("Фото удалено");
  };

  const handleTitleKeyDown = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
    }
  };
  const handleTitleChange = (e) => {
    let input = e.target;
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
    setBlog({ ...blog, title: input.value });
  };
  const handleError = (e) => {
    let img = e.target;
    img.src = defaultBanner;
  };
  return (
    <>
      <nav className="navbar">
        <Link to="/" className="flex-none w-10">
          <img src={logo} className="w-full" />
        </Link>
        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title.length ? title : "Новая запись"}
        </p>
        <div className="flex gap-4 ml-auto">
          <button className="btn-dark py-2">Опубликовать</button>
          <button className="btn-light py-2">Сохранить черновик</button>
        </div>
      </nav>
      <Toaster />
      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full">
            <div className="relative aspect-video bg-white border-4 border-grey hover:opacity-80">
              <label htmlFor="uploadBanner">
                {image.preview && (
                  <span
                    className="absolute right-0 top-0 cursor-pointer "
                    onClick={handleDeletePhoto}
                  >
                    <i className="fi fi-rr-cross-circle text-3xl h-10 w-10 font-bold text-white  rounded-full "></i>
                  </span>
                )}
                <img
                  src={image.preview || defaultBanner}
                  className="z-20 object-cover w-full h-full"
                  alt="banner"
                  onError={handleError}
                />

                <input
                  id="uploadBanner"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleBannerUpload}
                />
              </label>
            </div>

            <textarea
              placeholder="Заголовок записи"
              className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            ></textarea>
            <hr className="w-full opacity-10 my-5" />
            <div id="text-Editor" className="font-gelasio"></div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;
