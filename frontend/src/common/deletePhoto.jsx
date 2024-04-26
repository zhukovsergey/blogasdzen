import axios from "axios";

const deletephoto = async (url) => {
  let formData = new FormData();
  await formData.append("path", url);
  await axios
    .post(`http://localhost:3000/deletephoto`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((res) => {
      return res.data;
    });
};

export default deletephoto;
