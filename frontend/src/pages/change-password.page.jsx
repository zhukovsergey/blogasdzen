import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import { useContext, useRef } from "react";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import { UserContext } from "../App";

const ChangePassword = () => {
  let {
    userAuth: { access_token },
  } = useContext(UserContext);
  let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
  let changePasswordForm = useRef();
  const handleSubmit = (e) => {
    e.preventDefault();
    let form = new FormData(changePasswordForm.current);
    let formData = {};

    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }
    let { currentPassword, newPassword } = formData;
    if (!currentPassword.length || !newPassword.length) {
      return toast.error("Заполните все поля");
    }
    if (
      !passwordRegex.test(currentPassword) ||
      !passwordRegex.test(newPassword)
    ) {
      return toast.error(
        "Пароль должен содержать цифры и заглавные буквы на латинице"
      );
    }
    e.target.setAttribute("disabled", true);
    let loadingToast = toast.loading("Отправка данных...");
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/change-password", formData, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then(() => {
        toast.dismiss(loadingToast);
        e.target.setAttribute("disabled", false);
        return toast.success("Пароль успешно изменен");
      })
      .catch((err) => {
        console.log(err);
        toast.dismiss(loadingToast);
        e.target.setAttribute("disabled", false);
        toast.error(err.response.data.error);
      });
  };
  return (
    <AnimationWrapper>
      <Toaster />
      <form ref={changePasswordForm}>
        <h1 className="max-md:hidden">Смена пароля</h1>
        <div className="py-10 w-full md:max-w-[400px]">
          <InputBox
            name="currentPassword"
            type="password"
            className="profile-edit-input"
            placeholder="Текущий пароль"
            icon="fi-rr-unlock"
          />
          <InputBox
            name="newPassword"
            type="password"
            className="profile-edit-input"
            placeholder="Новый пароль"
            icon="fi-rr-unlock"
          />
          <button onClick={handleSubmit} className="btn-dark px-10">
            Сменить
          </button>
        </div>
      </form>
    </AnimationWrapper>
  );
};

export default ChangePassword;
