import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import { useEffect, useState } from "react";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";
import { activeTabRef } from "../components/inpage-navigation.component";
import NoDataMessage from "../components/nodata.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import LoadMoreDataBtn from "../components/load-more.component";

const HomePage = () => {
  let [blogs, setBlogs] = useState(null);

  let [trendingBlogs, setTrendingBlogs] = useState(null);
  let categories = ["сериалы", "шоу", "дорамы", "кулинария", "музыка"];
  let [pageState, setPageState] = useState("home");
  const fetchTrendingBlogs = () => {
    axios
      .get(import.meta.env.VITE_SERVER_DOMAIN + "/trending-blogs")
      .then((res) => {
        setTrendingBlogs(res.data.blogs);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const fetchLatestBlogs = ({ page = 1 }) => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs", { page })
      .then(async (res) => {
        console.log(res.data.blogs);
        let formatedData = await filterPaginationData({
          state: blogs,
          data: res.data.blogs,
          page,
          countRoute: "/all-latest-blogs-count",
        });
        setBlogs(formatedData);
        console.log(formatedData);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const fetchBlogsByCategory = ({ page = 1 }) => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", {
        tag: pageState,
        page,
      })
      .then(async (res) => {
        let formatedData = await filterPaginationData({
          state: blogs,
          data: res.data.blogs,
          page,
          countRoute: "/search-blogs-count",
          data_to_send: { tag: pageState },
        });
        setBlogs(formatedData);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const loadBlogByCategory = (e) => {
    let category = e.target.innerText.toLowerCase();
    setBlogs(null);
    if (pageState == category) {
      setPageState("home");
      return;
    }
    setPageState(category);
  };

  useEffect(() => {
    activeTabRef.current.click;
    if (pageState == "home") {
      fetchLatestBlogs({ page: 1 });
    } else {
      fetchBlogsByCategory({ page: 1 });
    }
    if (!trendingBlogs) {
      fetchTrendingBlogs();
    }
  }, [pageState]);
  return (
    <AnimationWrapper>
      <section className="h-cover flex justify-center gap-10">
        {/* latest blogs */}
        <div className="w-full">
          <InPageNavigation
            routes={[pageState, "trending blogs"]}
            defaultHidden={["trending blogs"]}
          >
            <>
              {blogs == null ? (
                <Loader />
              ) : blogs.results.length ? (
                blogs.results.map((blog, i) => {
                  return (
                    <AnimationWrapper
                      transition={{ duration: 1, delay: i * 0.1 }}
                      key={i}
                    >
                      <BlogPostCard
                        content={blog}
                        author={blog.author.personal_info}
                      />
                    </AnimationWrapper>
                  );
                })
              ) : (
                <NoDataMessage message="Нет опубликованных постов в этой категории" />
              )}
              <LoadMoreDataBtn
                state={blogs}
                fetchDataFun={
                  (pageState == "home" ? fetchLatestBlogs : fetchBlogsByCategory)
                }
              />
            </>
            <>
              {trendingBlogs == null ? (
                <Loader />
              ) : trendingBlogs.length ? (
                trendingBlogs.map((blog, i) => {
                  return (
                    <AnimationWrapper
                      transition={{ duration: 1, delay: i * 0.1 }}
                      key={i}
                    >
                      <MinimalBlogPost
                        blog={blog}
                        author={blog.author.personal_info}
                        index={i}
                      />
                    </AnimationWrapper>
                  );
                })
              ) : (
                <NoDataMessage message="Нет популярных постов" />
              )}
            </>
          </InPageNavigation>
        </div>
        {/* filters and trendings */}
        <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-1 border-grey pl-8 pt-3 max-md:hidden">
          <div className="flex flex-col gap-10">
            <div>
              <h4 className="font-medium text-xl mb-8">Записи по интересам</h4>
              <div className="flex gap-3 flex-wrap">
                {categories.map((category, i) => {
                  return (
                    <button
                      key={i}
                      className={`tag ${
                        pageState == category ? "bg-black text-white" : ""
                      }`}
                      onClick={loadBlogByCategory}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className=" font-medium text-xl mb-8">
                Популярное <i className="fi fi-rr-arrow-trend-up"></i>
              </h4>
              {trendingBlogs == null ? (
                <Loader />
              ) : trendingBlogs.length ? (
                trendingBlogs.map((blog, i) => {
                  return (
                    <AnimationWrapper
                      transition={{ duration: 1, delay: i * 0.1 }}
                      key={i}
                    >
                      <MinimalBlogPost
                        blog={blog}
                        author={blog.author.personal_info}
                        index={i}
                      />
                    </AnimationWrapper>
                  );
                })
              ) : (
                <NoDataMessage message="Нет популярных постов" />
              )}
            </div>
          </div>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default HomePage;
