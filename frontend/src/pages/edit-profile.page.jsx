import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../App";
import axios from "axios";
import { profileDataStructure } from "./profile.page";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { toast, Toaster } from "react-hot-toast";
import InputBox from "../components/input.component";
import fileUpload from "../common/aws";
import { storeInSession } from "../common/session";

const EditProfile = () => {
  let profileImgEle = useRef();
  let editProfileForm = useRef();
  const [profile, setProfile] = useState(profileDataStructure);
  const [loading, setLoading] = useState(true);
  let bioLimit = 200;
  const [charactersLeft, setCharactersLeft] = useState(bioLimit);
  const [updatedProfileImg, setUpdatedProfileImg] = useState(null);

  let {
    personal_info: {
      fullname,
      username: profile_username,
      profile_img,
      email,
      bio,
    },
    social_links,
  } = profile;
  let {
    userAuth,
    userAuth: { access_token },
    setUserAuth,
  } = useContext(UserContext);
  useEffect(() => {
    if (access_token) {
      axios
        .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-profile", {
          username: userAuth.username,
        })
        .then(({ data }) => {
          setProfile(data);
          setLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setLoading(false);
        });
    }
  }, [access_token]);

  const handleCharacterChange = (e) => {
    setCharactersLeft(bioLimit - e.target.value.length);
  };

  const handleImagePreview = (e) => {
    let img = e.target.files[0];
    profileImgEle.current.src = URL.createObjectURL(img);
    setUpdatedProfileImg(img);
  };

  const handleImageUpload = (e) => {
    e.preventDefault();
    if (updatedProfileImg) {
      let loadingToast = toast.loading("Загрузка...");
      e.target.setAttribute("disabled", "true");
      fileUpload(updatedProfileImg)
        .then((url) => {
          console.log(url);
          if (url) {
            axios
              .post(
                import.meta.env.VITE_SERVER_DOMAIN + "/update-profile-img",
                {
                  url: "http://localhost:3000" + url.path,
                },
                {
                  headers: {
                    Authorization: `Bearer ${access_token}`,
                  },
                }
              )
              .then(({ data }) => {
                let newUserAuth = {
                  ...userAuth,
                  profile_img: data.profile_img,
                };
                storeInSession("user", JSON.stringify(newUserAuth));
                setUserAuth(newUserAuth);
                setUpdatedProfileImg(null);
                toast.dismiss(loadingToast);
                e.target.removeAttribute("disabled");
                toast.success("Изменения сохранены");
              })
              .catch((err) => {
                console.log(err);
                toast.dismiss(loadingToast);
                e.target.removeAttribute("disabled");
                toast.error("Произошла ошибка");
              });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let form = new FormData(editProfileForm.current);
    let formData = {};
    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }
    let {
      username,
      bio,
      youtube,
      facebook,
      twitter,
      instagram,
      github,
      website,
    } = formData;

    if (username.length < 3) {
      return toast.error("короткое имя пользователя");
    }
    if (bio.length > bioLimit) {
      return toast.error(`максимальное количество символов ${bioLimit}`);
    }

    let loadingToast = toast.loading("Обновляем данные...");
    e.target.setAttribute("disabled", "true");
    axios
      .post(
        import.meta.env.VITE_SERVER_DOMAIN + "/update-profile",
        {
          username,
          bio,
          social_links: {
            youtube,
            facebook,
            twitter,
            github,
            instagram,
            website,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then(({ data }) => {
        if (userAuth.username !== data.username) {
          let newUserAuth = { ...userAuth, username: data.username };
          storeInSession("user", JSON.stringify(newUserAuth));
          setUserAuth(newUserAuth);
        }
        toast.dismiss(loadingToast);
        e.target.removeAttribute("disabled");
        toast.success("Изменения сохранены");
      })
      .catch((err) => {
        console.log(err);
        toast.dismiss(loadingToast);
        e.target.removeAttribute("disabled");
        toast.error("Произошла ошибка");
      });
  };
  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : (
        <form ref={editProfileForm}>
          <Toaster />
          <h1 className="max-md:hidden">Форма редактирования профиля</h1>
          <div className="flex flex-col lg:flex-row items-start py-10 gap-8 lg:gap-10">
            <div className="max-lg:center mb-5">
              <label
                htmlFor="uploadImg"
                id="profileImgLabel"
                className="relative block w-48 h-48 bg-grey rounded-full overflow-hidden"
              >
                <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center text-white bg-black/80 opacity-0 hover:opacity-100 hover:cursor-pointer text-sm">
                  Загрузить свое фото
                </div>
                <img ref={profileImgEle} src={profile_img} />
              </label>
              <input
                onChange={handleImagePreview}
                type="file"
                id="uploadImg"
                accept=".jpeg, .png, .jpg"
                hidden
              />
              <button
                onClick={handleImageUpload}
                className="btn-light mt-5 max-lg:center lg:w-full px-10 hover:bg-red/10 hover:text-red transition ease-in-out duration-700"
              >
                Сохранить
              </button>
            </div>
            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5">
                <div>
                  <InputBox
                    name="fullname"
                    type="text"
                    value={fullname}
                    placeholder="Полное имя"
                    disable={true}
                    icon="fi-rr-user"
                  />
                </div>
                <div>
                  <InputBox
                    name="email"
                    type="email"
                    value={email}
                    placeholder="email"
                    disable={true}
                    icon="fi-rr-envelope"
                  />
                </div>
              </div>
              <InputBox
                type="text"
                name="username"
                value={profile_username}
                placeholder="Имя пользователя"
                icon="fi-rr-at"
              />
              <p className="text-dark-grey -mt-3">
                Имя пользователя используется для поиска и его видят все
                пользователи.
              </p>
              <textarea
                name="bio"
                maxLength={bioLimit}
                defaultValue={bio}
                className="input-box h-64 lg:h-40 resize-none leading-7 mt-5 pl-5"
                placeholder="О себе"
                onChange={handleCharacterChange}
              ></textarea>
              <p>{charactersLeft} символов осталось</p>
              <hr className="text-grey my-2" />
              <p className="text-dark-grey my-4">
                Ссылки на Ваши соц.сети и сайты
              </p>
              <div className="md:grid md:grid-cols-2 gap-x-6 mt-4">
                {Object.keys(social_links).map((key, i) => {
                  let link = social_links[key];

                  return (
                    <InputBox
                      key={i}
                      name={key}
                      type="text"
                      value={link}
                      placeholder={key}
                      icon={
                        "fi " +
                        (key !== "website"
                          ? "fi-brands-" + key
                          : " fi-rr-globe") +
                        " text-2xl hover:text-black"
                      }
                    />
                  );
                })}
              </div>
              <button
                onClick={handleSubmit}
                className="btn-dark w-auto px-10"
                type="submit"
              >
                Обновить
              </button>
            </div>
          </div>
        </form>
      )}
    </AnimationWrapper>
  );
};

export default EditProfile;
