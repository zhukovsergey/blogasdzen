import { Link } from "react-router-dom";
import pageNotFound from "../imgs/404.png";
import fulllogo from "../imgs/full-logo.png";
const PageNotFound = () => {
  return (
    <section className="h-cover relative p-10 flex flex-col items-center gap-20 text-center">
      <img
        src={pageNotFound}
        className="select-none border-2 border-grey w-72 aspect-square object-cover rounded "
      />
      <h2 className="text-4xl font-gelasio leading-7">Страница не найдена</h2>
      <p className="text-dark-grey text-xl leading-7 -mt-8">
        Страница на которую Вы перешли не существует или была удалена.
      </p>
      <Link to="/" className="text-black underline">
        Вернуться на главную
      </Link>
      <div className="mt-auto">
        <img
          src={fulllogo}
          className="h-8 object-contain block mx-auto select-none "
        />
      </div>
    </section>
  );
};

export default PageNotFound;
