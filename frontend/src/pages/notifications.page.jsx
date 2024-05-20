import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserContext } from "../App";
import { filterPaginationData } from "../common/filter-pagination-data";
import Loader from "../components/loader.component";
import AnimationWrapper from "../common/page-animation";
import NoDataMessage from "../components/nodata.component";
import NotificationCard from "../components/notification-card.component";
import LoadMoreDataBtn from "../components/load-more.component";

const Notification = () => {
  const [filter, setFilter] = useState("Все");
  let filters = ["Все", "Лайки", "Комментарии", "Ответы"];
  let {
    userAuth: { access_token },
  } = useContext(UserContext);

  const handleFilter = (e) => {
    let btn = e.target;
    setFilter(btn.innerText);
    setNotifications(null);
  };
  const [notifications, setNotifications] = useState(null);
  const fetchNotifications = ({ page, deletedDocCount = 0 }) => {
    axios
      .post(
        import.meta.env.VITE_SERVER_DOMAIN + "/notifications",
        {
          page,
          filter,
          deletedDocCount,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then(async ({ data: { notifications: data } }) => {
        let formatedData = await filterPaginationData({
          state: notifications,
          data,
          page,
          countRoute: "/all-notifications-count",
          data_to_send: { filter },
          user: access_token,
        });
        setNotifications(formatedData);
        console.log(formatedData);
      })
      .catch((err) => console.log(err));
  };
  useEffect(() => {
    if (access_token) fetchNotifications({ page: 1 });
  }, [access_token, filter]);
  return (
    <div>
      <h1>Уведомления</h1>
      <div className="my-8 flex gap-6 ">
        {filters.map((filterName, i) => {
          return (
            <button
              onClick={handleFilter}
              className={
                "py-2 " + (filter == filterName ? "btn-dark" : "btn-light")
              }
              key={i}
            >
              {filterName}
            </button>
          );
        })}
      </div>

      {notifications == null ? (
        <Loader />
      ) : (
        <>
          {notifications.results.length ? (
            notifications.results.map((notification, i) => {
              return (
                <AnimationWrapper
                  key={i}
                  transition={{ duration: 1, delay: i * 0.1 }}
                >
                  <NotificationCard
                    data={notification}
                    index={i}
                    notificationState={{ notifications, setNotifications }}
                  />
                </AnimationWrapper>
              );
            })
          ) : (
            <NoDataMessage message="Уведомлений нет" />
          )}
          <LoadMoreDataBtn
            state={notifications}
            fetchDataFun={fetchNotifications}
            additionalParam={{ deletedDocCount: notifications.deletedDocCount }}
          />
        </>
      )}
    </div>
  );
};

export default Notification;
