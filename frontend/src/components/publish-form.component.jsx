import { useContext } from "react";
import AnimationWrapper from "../common/page-animation";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import Tag from "./tags.component";

const PublishForm = () => {
  let characterLimit = 200;
  let tagLimit = 10;
  let {
    blog,
    blog: { title, banner, content, tags, des },
    setEditorState,
    setBlog,
  } = useContext(EditorContext);
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
            placeholder="Заголовок записи"
            defautValue={title}
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
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default PublishForm;
