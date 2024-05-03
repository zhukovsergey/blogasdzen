import { Link } from "react-router-dom";
import { getDay } from "../common/date";

const AboutUser = ({ className, bio, social_links, joinedAt }) => {
  return (
    <div className={"md:w-[90%] md:mt-7 " + className}>
      <p className="text-xl leading-7">{bio.length ? bio : "Нет информации"}</p>
      <div className="flex gap-7 gap-y-2 flex-wrap my-7 items-center text-dark-grey">
        {Object.keys(social_links).map((key) => {
          let link = social_links[key];

          return link ? (
            <Link to={link} target="_blank" key={key}>
              <i
                className={
                  "fi " +
                  (key !== "website" ? "fi-brands-" + key : " fi-rr-globe") +
                  " text-2xl hover:text-black"
                }
              ></i>
            </Link>
          ) : (
            ""
          );
        })}
      </div>
      <p className="text-xl leading-7 text-dark-grey">
        Зарегистрировался: {getDay(joinedAt)} г.
      </p>
    </div>
  );
};

export default AboutUser;
